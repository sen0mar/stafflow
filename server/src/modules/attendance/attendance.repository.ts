import type { AttendanceStatus, Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import { createAuditLog } from "../audit-logs/audit-log.service";
import type {
  ListAttendanceInput,
  ListSelfAttendanceInput,
  UpdateAttendanceInput,
} from "./attendance.schema";

export const attendanceSelect = {
  clockInAt: true,
  clockOutAt: true,
  createdAt: true,
  date: true,
  employee: {
    select: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      employeeCode: true,
      firstName: true,
      id: true,
      lastName: true,
    },
  },
  employeeId: true,
  id: true,
  notes: true,
  source: true,
  status: true,
  totalMinutes: true,
  updatedAt: true,
} satisfies Prisma.AttendanceRecordSelect;

export type AttendanceRecord = Prisma.AttendanceRecordGetPayload<{
  select: typeof attendanceSelect;
}>;

export interface DateRange {
  end: Date;
  start: Date;
}

export interface AttendanceListFilters extends ListAttendanceInput {
  skip: number;
  take: number;
}

export interface SelfAttendanceListFilters extends ListSelfAttendanceInput {
  employeeId: string;
  skip: number;
  take: number;
}

export const getCompanyTimezone = async () => {
  const settings = await prisma.companySettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: { timezone: true },
  });

  return settings?.timezone ?? "UTC";
};

export const getAttendanceSettings = async () => {
  const settings = await prisma.attendanceSettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: { workdayMinutes: true },
  });

  return {
    workdayMinutes: settings?.workdayMinutes ?? 480,
  };
};

const getDateFilter = ({
  from,
  to,
}: Pick<ListAttendanceInput, "from" | "to">): Prisma.DateTimeFilter | undefined => {
  if (!from && !to) {
    return undefined;
  }

  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
};

const getAttendanceWhere = ({
  departmentId,
  employeeId,
  from,
  status,
  to,
}: Pick<
  AttendanceListFilters,
  "departmentId" | "employeeId" | "from" | "status" | "to"
>): Prisma.AttendanceRecordWhereInput => ({
  ...(employeeId ? { employeeId } : {}),
  ...(status ? { status } : {}),
  ...(getDateFilter({ from, to }) ? { date: getDateFilter({ from, to }) } : {}),
  ...(departmentId ? { employee: { departmentId } } : {}),
});

export const listAttendanceRecords = async ({
  departmentId,
  employeeId,
  from,
  skip,
  status,
  take,
  to,
}: AttendanceListFilters) => {
  const where = getAttendanceWhere({
    departmentId,
    employeeId,
    from,
    status,
    to,
  });

  const [items, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: attendanceSelect,
      skip,
      take,
      where,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { items, total };
};

export const listSelfAttendanceRecords = async ({
  employeeId,
  from,
  skip,
  status,
  take,
  to,
}: SelfAttendanceListFilters) =>
  listAttendanceRecords({
    employeeId,
    from,
    limit: take,
    page: Math.floor(skip / take) + 1,
    skip,
    status,
    take,
    to,
  });

export const findAttendanceRecordById = (id: string) =>
  prisma.attendanceRecord.findUnique({
    select: attendanceSelect,
    where: { id },
  });

export const findAttendanceRecordForDay = (
  employeeId: string,
  date: Date,
) =>
  prisma.attendanceRecord.findUnique({
    select: attendanceSelect,
    where: {
      employeeId_date: {
        date,
        employeeId,
      },
    },
  });

export const findActiveAttendanceRecordForDay = (
  employeeId: string,
  date: Date,
) =>
  prisma.attendanceRecord.findFirst({
    select: attendanceSelect,
    where: {
      clockInAt: { not: null },
      clockOutAt: null,
      date,
      employeeId,
    },
  });

export const createClockInRecord = ({
  clockInAt,
  date,
  employeeId,
}: {
  clockInAt: Date;
  date: Date;
  employeeId: string;
}) =>
  prisma.attendanceRecord.create({
    data: {
      clockInAt,
      date,
      employeeId,
      source: "SELF",
      status: "PRESENT",
    },
    select: attendanceSelect,
  });

export const updateClockOutRecord = ({
  clockOutAt,
  id,
  status,
  totalMinutes,
}: {
  clockOutAt: Date;
  id: string;
  status: AttendanceStatus;
  totalMinutes: number;
}) =>
  prisma.attendanceRecord.update({
    data: {
      clockOutAt,
      status,
      totalMinutes,
    },
    select: attendanceSelect,
    where: { id },
  });

export const updateAttendanceWithAuditLog = ({
  action,
  actorUserId,
  data,
  entityId,
  ipAddress,
  metadata,
  userAgent,
}: {
  action: string;
  actorUserId: string | null;
  data: Prisma.AttendanceRecordUpdateInput;
  entityId: string;
  ipAddress?: string;
  metadata: Prisma.InputJsonValue;
  userAgent?: string;
}) =>
  prisma.$transaction(async (tx) => {
    const attendance = await tx.attendanceRecord.update({
      data,
      select: attendanceSelect,
      where: { id: entityId },
    });

    await createAuditLog({
      action,
      actorUserId,
      entityId,
      entityType: "AttendanceRecord",
      ipAddress,
      metadata,
      tx,
      userAgent,
    });

    return attendance;
  });

export const getAttendanceUpdateData = (
  input: UpdateAttendanceInput & { totalMinutes: number | null },
): Prisma.AttendanceRecordUpdateInput => ({
  ...(input.clockInAt !== undefined
    ? { clockInAt: input.clockInAt ? new Date(input.clockInAt) : null }
    : {}),
  ...(input.clockOutAt !== undefined
    ? { clockOutAt: input.clockOutAt ? new Date(input.clockOutAt) : null }
    : {}),
  ...(input.notes !== undefined ? { notes: input.notes } : {}),
  ...(input.status !== undefined ? { status: input.status } : {}),
  totalMinutes: input.totalMinutes,
  source: "ADMIN",
});
