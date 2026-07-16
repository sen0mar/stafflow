import { Prisma, type AttendanceStatus } from "@prisma/client";

import type { AuthContext } from "../../core/auth/auth.types";
import { AppError } from "../../core/errors/app-error";
import {
  getPaginationParams,
  toPaginatedResult,
} from "../../core/pagination/pagination";
import {
  createClockInRecord,
  findActiveAttendanceRecordForDay,
  findAttendanceRecordById,
  findAttendanceRecordForDay,
  getAttendanceUpdateData,
  getCompanyTimezone,
  getSelfClockActionContext,
  listAttendanceRecords,
  listSelfAttendanceRecords,
  updateAttendanceWithAuditLog,
  updateClockOutRecord,
  type AttendanceRecord,
  type SelfClockActionContext,
} from "./attendance.repository";
import {
  getCompanyDate,
  getScheduledTime,
  isWorkingDay,
} from "../../core/utils/company-day";
import { formatDateOnly } from "../../core/utils/date-only";
import { getSelfAttendanceEmployeeId } from "./attendance.policy";
import type {
  ListAttendanceInput,
  ListSelfAttendanceInput,
  UpdateAttendanceInput,
} from "./attendance.schema";

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

const toIso = (date: Date | null) => date?.toISOString() ?? null;

const getFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

const getTodayDate = async () => {
  const timeZone = await getCompanyTimezone();

  return getCompanyDate(new Date(), timeZone);
};

const calculateTotalMinutes = (
  clockInAt: Date | null,
  clockOutAt: Date | null,
) => {
  if (!clockInAt || !clockOutAt) {
    return null;
  }

  return Math.max(
    0,
    Math.round((clockOutAt.getTime() - clockInAt.getTime()) / 60_000),
  );
};

const getClockOutStatus = (
  clockInStatus: AttendanceStatus,
  clockOutAt: Date,
  context: SelfClockActionContext,
  totalMinutes: number,
): AttendanceStatus => {
  const scheduledEnd = getScheduledTime(
    clockOutAt,
    context.timeZone,
    context.workdayEnd,
  );

  if (
    totalMinutes < context.workdayMinutes ||
    clockOutAt.getTime() < scheduledEnd.getTime()
  ) {
    return "PARTIAL";
  }

  return clockInStatus === "LATE" ? "LATE" : "PRESENT";
};

const assertSelfClockActionAllowed = (
  context: SelfClockActionContext,
  now: Date,
) => {
  if (context.employeeStatus !== "ACTIVE") {
    throw new AppError({
      code: "ATTENDANCE_EMPLOYEE_INACTIVE",
      message: "Only active employees can use self attendance.",
      statusCode: 409,
    });
  }

  if (!isWorkingDay(now, context.timeZone, context.weeklyWorkingDays)) {
    throw new AppError({
      code: "ATTENDANCE_NON_WORKING_DAY",
      message: "Self attendance is unavailable on non-working days.",
      statusCode: 409,
    });
  }
};

const isUniqueAttendanceDayError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

const toAttendanceDto = (record: AttendanceRecord) => ({
  clockInAt: toIso(record.clockInAt),
  clockOutAt: toIso(record.clockOutAt),
  createdAt: record.createdAt.toISOString(),
  date: formatDateOnly(record.date),
  employee: {
    department: record.employee.department,
    employeeCode: record.employee.employeeCode,
    fullName: getFullName(record.employee.firstName, record.employee.lastName),
    id: record.employee.id,
  },
  employeeId: record.employeeId,
  id: record.id,
  notes: record.notes,
  source: record.source,
  status: record.status,
  totalMinutes: record.totalMinutes,
  updatedAt: record.updatedAt.toISOString(),
});

const assertAttendanceExists = async (id: string) => {
  const attendance = await findAttendanceRecordById(id);

  if (!attendance) {
    throw new AppError({
      code: "ATTENDANCE_NOT_FOUND",
      message: "Attendance record was not found.",
      statusCode: 404,
    });
  }

  return attendance;
};

export const getSelfTodayAttendance = async (auth: AuthContext) => {
  const employeeId = getSelfAttendanceEmployeeId(auth);
  const date = await getTodayDate();
  const record = await findAttendanceRecordForDay(employeeId, date);

  return record ? toAttendanceDto(record) : null;
};

export const getSelfAttendanceHistory = async (
  auth: AuthContext,
  input: ListSelfAttendanceInput,
) => {
  const employeeId = getSelfAttendanceEmployeeId(auth);
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listSelfAttendanceRecords({
    ...input,
    employeeId,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toAttendanceDto),
    limit,
    page,
    total,
  });
};

export const getAttendanceList = async (input: ListAttendanceInput) => {
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listAttendanceRecords({
    ...input,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toAttendanceDto),
    limit,
    page,
    total,
  });
};

export const getAttendanceDetail = async (id: string) => {
  const attendance = await assertAttendanceExists(id);

  return toAttendanceDto(attendance);
};

export const clockInSelf = async (auth: AuthContext) => {
  const employeeId = getSelfAttendanceEmployeeId(auth);
  const now = new Date();
  const context = await getSelfClockActionContext(employeeId);
  assertSelfClockActionAllowed(context, now);

  if (!context.allowEmployeeClockIn) {
    throw new AppError({
      code: "ATTENDANCE_CLOCK_IN_DISABLED",
      message: "Employee clock-in is disabled.",
      statusCode: 409,
    });
  }

  const scheduledStart = getScheduledTime(
    now,
    context.timeZone,
    context.workdayStart,
  );
  const lateAfter = new Date(
    scheduledStart.getTime() + context.lateGracePeriodMinutes * 60_000,
  );

  try {
    const record = await createClockInRecord({
      clockInAt: now,
      date: getCompanyDate(now, context.timeZone),
      employeeId,
      status: now.getTime() > lateAfter.getTime() ? "LATE" : "PRESENT",
    });

    return toAttendanceDto(record);
  } catch (error) {
    if (isUniqueAttendanceDayError(error)) {
      throw new AppError({
        code: "ATTENDANCE_ALREADY_RECORDED",
        message: "Attendance is already recorded for today.",
        statusCode: 409,
      });
    }

    throw error;
  }
};

export const clockOutSelf = async (auth: AuthContext) => {
  const employeeId = getSelfAttendanceEmployeeId(auth);
  const now = new Date();
  const context = await getSelfClockActionContext(employeeId);
  assertSelfClockActionAllowed(context, now);
  const date = getCompanyDate(now, context.timeZone);
  const activeRecord = await findActiveAttendanceRecordForDay(employeeId, date);

  if (!activeRecord?.clockInAt) {
    const completedRecord = await findAttendanceRecordForDay(employeeId, date);

    if (completedRecord?.clockInAt && completedRecord.clockOutAt) {
      throw new AppError({
        code: "ATTENDANCE_ALREADY_CLOCKED_OUT",
        message: "Attendance has already been clocked out.",
        statusCode: 409,
      });
    }

    throw new AppError({
      code: "ATTENDANCE_NO_ACTIVE_CLOCK_IN",
      message: "You do not have an active clock-in for today.",
      statusCode: 409,
    });
  }

  const clockOutAt = now;
  const totalMinutes =
    calculateTotalMinutes(activeRecord.clockInAt, clockOutAt) ?? 0;
  const record = await updateClockOutRecord({
    clockOutAt,
    id: activeRecord.id,
    status: getClockOutStatus(
      activeRecord.status,
      clockOutAt,
      context,
      totalMinutes,
    ),
    totalMinutes,
  });

  if (!record) {
    throw new AppError({
      code: "ATTENDANCE_ALREADY_CLOCKED_OUT",
      message: "Attendance has already been clocked out.",
      statusCode: 409,
    });
  }

  return toAttendanceDto(record);
};

export const correctAttendance = async (
  id: string,
  input: UpdateAttendanceInput,
  auditContext: AuditContext,
) => {
  const current = await assertAttendanceExists(id);
  const nextClockInAt =
    input.clockInAt !== undefined
      ? input.clockInAt
        ? new Date(input.clockInAt)
        : null
      : current.clockInAt;
  const nextClockOutAt =
    input.clockOutAt !== undefined
      ? input.clockOutAt
        ? new Date(input.clockOutAt)
        : null
      : current.clockOutAt;

  if (nextClockInAt && nextClockOutAt && nextClockOutAt < nextClockInAt) {
    throw new AppError({
      code: "ATTENDANCE_INVALID_TIME_RANGE",
      message: "Clock-out must be after clock-in.",
      statusCode: 422,
    });
  }

  const totalMinutes = calculateTotalMinutes(nextClockInAt, nextClockOutAt);
  const changedFields = Object.keys(input);
  const record = await updateAttendanceWithAuditLog({
    ...auditContext,
    action: "ATTENDANCE_CORRECTED",
    data: getAttendanceUpdateData({
      ...input,
      totalMinutes,
    }),
    entityId: id,
    metadata: {
      changedFields,
      from: {
        clockInAt: toIso(current.clockInAt),
        clockOutAt: toIso(current.clockOutAt),
        notes: current.notes,
        status: current.status,
        totalMinutes: current.totalMinutes,
      },
      to: {
        clockInAt: toIso(nextClockInAt),
        clockOutAt: toIso(nextClockOutAt),
        notes: input.notes !== undefined ? input.notes : current.notes,
        status: input.status ?? current.status,
        totalMinutes,
      },
    },
  });

  return toAttendanceDto(record);
};
