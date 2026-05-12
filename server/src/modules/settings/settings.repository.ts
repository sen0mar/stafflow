import { Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import type {
  UpdateAttendanceSettingsInput,
  UpdateCompanySettingsInput,
  UpdateLeaveSettingsInput,
} from "./settings.schema";

const companySettingsSelect = {
  createdAt: true,
  id: true,
  locale: true,
  name: true,
  timezone: true,
  updatedAt: true,
} satisfies Prisma.CompanySettingsSelect;

const attendanceSettingsSelect = {
  allowEmployeeClockIn: true,
  createdAt: true,
  id: true,
  lateGracePeriodMinutes: true,
  updatedAt: true,
  weeklyWorkingDays: true,
  workdayEnd: true,
  workdayMinutes: true,
  workdayStart: true,
} satisfies Prisma.AttendanceSettingsSelect;

const leaveSettingsSelect = {
  allowNegativeBalance: true,
  createdAt: true,
  defaultAnnualAllowanceDays: true,
  id: true,
  policyText: true,
  updatedAt: true,
} satisfies Prisma.LeaveSettingsSelect;

export type CompanySettingsRecord = Prisma.CompanySettingsGetPayload<{
  select: typeof companySettingsSelect;
}>;
export type AttendanceSettingsRecord = Prisma.AttendanceSettingsGetPayload<{
  select: typeof attendanceSettingsSelect;
}>;
export type LeaveSettingsRecord = Prisma.LeaveSettingsGetPayload<{
  select: typeof leaveSettingsSelect;
}>;

interface AuditLogInput {
  action: string;
  actorUserId: string | null;
  entityId: string;
  entityType: string;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
  userAgent?: string;
}

export const findCompanySettings = () =>
  prisma.companySettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: companySettingsSelect,
  });

export const findAttendanceSettings = () =>
  prisma.attendanceSettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: attendanceSettingsSelect,
  });

export const findLeaveSettings = () =>
  prisma.leaveSettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: leaveSettingsSelect,
  });

export const createDefaultCompanySettings = () =>
  prisma.companySettings.create({
    data: {
      locale: "en-US",
      name: "Stafflow",
      timezone: "UTC",
    },
    select: companySettingsSelect,
  });

export const createDefaultAttendanceSettings = () =>
  prisma.attendanceSettings.create({
    data: {
      allowEmployeeClockIn: true,
      lateGracePeriodMinutes: 0,
      weeklyWorkingDays: [1, 2, 3, 4, 5],
      workdayEnd: "17:00",
      workdayMinutes: 480,
      workdayStart: "09:00",
    },
    select: attendanceSettingsSelect,
  });

export const createDefaultLeaveSettings = () =>
  prisma.leaveSettings.create({
    data: {
      allowNegativeBalance: false,
      defaultAnnualAllowanceDays: 0,
      policyText: null,
    },
    select: leaveSettingsSelect,
  });

export const updateCompanySettingsWithAuditLog = ({
  auditLog,
  id,
  input,
}: {
  auditLog: Omit<AuditLogInput, "entityId" | "entityType">;
  id: string;
  input: UpdateCompanySettingsInput;
}) =>
  prisma.$transaction(async (transaction) => {
    const settings = await transaction.companySettings.update({
      data: input,
      select: companySettingsSelect,
      where: { id },
    });

    await transaction.auditLog.create({
      data: {
        ...auditLog,
        entityId: settings.id,
        entityType: "CompanySettings",
      },
      select: { id: true },
    });

    return settings;
  });

export const updateAttendanceSettingsWithAuditLog = ({
  auditLog,
  id,
  input,
}: {
  auditLog: Omit<AuditLogInput, "entityId" | "entityType">;
  id: string;
  input: UpdateAttendanceSettingsInput;
}) =>
  prisma.$transaction(async (transaction) => {
    const settings = await transaction.attendanceSettings.update({
      data: input,
      select: attendanceSettingsSelect,
      where: { id },
    });

    await transaction.auditLog.create({
      data: {
        ...auditLog,
        entityId: settings.id,
        entityType: "AttendanceSettings",
      },
      select: { id: true },
    });

    return settings;
  });

export const updateLeaveSettingsWithAuditLog = ({
  auditLog,
  id,
  input,
}: {
  auditLog: Omit<AuditLogInput, "entityId" | "entityType">;
  id: string;
  input: UpdateLeaveSettingsInput;
}) =>
  prisma.$transaction(async (transaction) => {
    const settings = await transaction.leaveSettings.update({
      data: input,
      select: leaveSettingsSelect,
      where: { id },
    });

    await transaction.auditLog.create({
      data: {
        ...auditLog,
        entityId: settings.id,
        entityType: "LeaveSettings",
      },
      select: { id: true },
    });

    return settings;
  });
