import type { AttendanceStatus } from "@prisma/client";

import type { AuthContext } from "../../core/auth/auth.types";
import { AppError } from "../../core/errors/app-error";
import {
  createClockInRecord,
  findActiveAttendanceRecordForDay,
  findAttendanceRecordById,
  findAttendanceRecordForDay,
  getAttendanceSettings,
  getAttendanceUpdateData,
  getCompanyTimezone,
  listAttendanceRecords,
  listSelfAttendanceRecords,
  updateAttendanceWithAuditLog,
  updateClockOutRecord,
  type AttendanceRecord,
} from "./attendance.repository";
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

interface ZonedDay {
  day: number;
  month: number;
  year: number;
}

const getPagination = ({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) => ({
  page,
  pageCount: Math.max(1, Math.ceil(total / pageSize)),
  pageSize,
  total,
});

const toIso = (date: Date | null) => date?.toISOString() ?? null;

const getFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

const getTimezoneOffsetMs = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.get("year")),
    Number(values.get("month")) - 1,
    Number(values.get("day")),
    Number(values.get("hour")),
    Number(values.get("minute")),
    Number(values.get("second")),
  );

  return asUtc - date.getTime();
};

const getZonedParts = (date: Date, timeZone: string): ZonedDay => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => {
    const value = parts.find((part) => part.type === type)?.value;

    if (!value) {
      throw new Error(`Missing ${type} date part.`);
    }

    return Number(value);
  };

  return {
    day: getPart("day"),
    month: getPart("month"),
    year: getPart("year"),
  };
};

const zonedDayToUtc = ({ day, month, year }: ZonedDay, timeZone: string) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day));
  const offsetMs = getTimezoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offsetMs);
};

const getTodayDate = async () => {
  const timeZone = await getCompanyTimezone();

  return zonedDayToUtc(getZonedParts(new Date(), timeZone), timeZone);
};

const calculateTotalMinutes = (clockInAt: Date | null, clockOutAt: Date | null) => {
  if (!clockInAt || !clockOutAt) {
    return null;
  }

  return Math.max(0, Math.round((clockOutAt.getTime() - clockInAt.getTime()) / 60_000));
};

const getClockOutStatus = (
  totalMinutes: number,
  workdayMinutes: number,
): AttendanceStatus => (totalMinutes < workdayMinutes ? "PARTIAL" : "PRESENT");

const toAttendanceDto = (record: AttendanceRecord) => ({
  clockInAt: toIso(record.clockInAt),
  clockOutAt: toIso(record.clockOutAt),
  createdAt: record.createdAt.toISOString(),
  date: record.date.toISOString(),
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
  const pageSize = input.limit;
  const { items, total } = await listSelfAttendanceRecords({
    ...input,
    employeeId,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: items.map(toAttendanceDto),
    pagination: getPagination({ page, pageSize, total }),
  };
};

export const getAttendanceList = async (input: ListAttendanceInput) => {
  const page = input.page;
  const pageSize = input.limit;
  const { items, total } = await listAttendanceRecords({
    ...input,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: items.map(toAttendanceDto),
    pagination: getPagination({ page, pageSize, total }),
  };
};

export const getAttendanceDetail = async (id: string) => {
  const attendance = await assertAttendanceExists(id);

  return toAttendanceDto(attendance);
};

export const clockInSelf = async (auth: AuthContext) => {
  const employeeId = getSelfAttendanceEmployeeId(auth);
  const date = await getTodayDate();
  const existingRecord = await findAttendanceRecordForDay(employeeId, date);

  if (existingRecord?.clockInAt && !existingRecord.clockOutAt) {
    throw new AppError({
      code: "ATTENDANCE_ALREADY_CLOCKED_IN",
      message: "You are already clocked in.",
      statusCode: 409,
    });
  }

  if (existingRecord) {
    throw new AppError({
      code: "ATTENDANCE_ALREADY_RECORDED",
      message: "Attendance is already recorded for today.",
      statusCode: 409,
    });
  }

  const record = await createClockInRecord({
    clockInAt: new Date(),
    date,
    employeeId,
  });

  return toAttendanceDto(record);
};

export const clockOutSelf = async (auth: AuthContext) => {
  const employeeId = getSelfAttendanceEmployeeId(auth);
  const date = await getTodayDate();
  const activeRecord = await findActiveAttendanceRecordForDay(employeeId, date);

  if (!activeRecord?.clockInAt) {
    throw new AppError({
      code: "ATTENDANCE_NO_ACTIVE_CLOCK_IN",
      message: "You do not have an active clock-in for today.",
      statusCode: 409,
    });
  }

  const clockOutAt = new Date();
  const totalMinutes = calculateTotalMinutes(activeRecord.clockInAt, clockOutAt) ?? 0;
  const settings = await getAttendanceSettings();
  const record = await updateClockOutRecord({
    clockOutAt,
    id: activeRecord.id,
    status: getClockOutStatus(totalMinutes, settings.workdayMinutes),
    totalMinutes,
  });

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
