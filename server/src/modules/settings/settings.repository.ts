import { Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import { createAuditLog } from "../audit-logs/audit-log.service";
import { SETTINGS_SINGLETON_IDS } from "./settings.constants";
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

type SettingsMutationAuditLog = Omit<
  AuditLogInput,
  "entityId" | "entityType" | "metadata"
>;

const companySettingsDefaults = {
  id: SETTINGS_SINGLETON_IDS.company,
  locale: "en-US",
  name: "Stafflow",
  timezone: "UTC",
} satisfies Prisma.CompanySettingsCreateInput;

const attendanceSettingsDefaults = {
  allowEmployeeClockIn: true,
  id: SETTINGS_SINGLETON_IDS.attendance,
  lateGracePeriodMinutes: 0,
  weeklyWorkingDays: [1, 2, 3, 4, 5],
  workdayEnd: "17:00",
  workdayMinutes: 480,
  workdayStart: "09:00",
} satisfies Prisma.AttendanceSettingsCreateInput;

const leaveSettingsDefaults = {
  allowNegativeBalance: false,
  defaultAnnualAllowanceDays: 0,
  id: SETTINGS_SINGLETON_IDS.leave,
  policyText: null,
} satisfies Prisma.LeaveSettingsCreateInput;

export const findCompanySettings = () =>
  prisma.companySettings.findUnique({
    select: companySettingsSelect,
    where: { id: SETTINGS_SINGLETON_IDS.company },
  });

export const findAttendanceSettings = () =>
  prisma.attendanceSettings.findUnique({
    select: attendanceSettingsSelect,
    where: { id: SETTINGS_SINGLETON_IDS.attendance },
  });

export const findLeaveSettings = () =>
  prisma.leaveSettings.findUnique({
    select: leaveSettingsSelect,
    where: { id: SETTINGS_SINGLETON_IDS.leave },
  });

export const upsertDefaultCompanySettings = () =>
  prisma.companySettings.upsert({
    create: companySettingsDefaults,
    select: companySettingsSelect,
    update: {},
    where: { id: SETTINGS_SINGLETON_IDS.company },
  });

export const upsertDefaultAttendanceSettings = () =>
  prisma.attendanceSettings.upsert({
    create: attendanceSettingsDefaults,
    select: attendanceSettingsSelect,
    update: {},
    where: { id: SETTINGS_SINGLETON_IDS.attendance },
  });

export const upsertDefaultLeaveSettings = () =>
  prisma.leaveSettings.upsert({
    create: leaveSettingsDefaults,
    select: leaveSettingsSelect,
    update: {},
    where: { id: SETTINGS_SINGLETON_IDS.leave },
  });

export const updateCompanySettingsWithAuditLog = ({
  auditLog,
  getAuditMetadata,
  input,
}: {
  auditLog: SettingsMutationAuditLog;
  getAuditMetadata: (current: CompanySettingsRecord) => Prisma.InputJsonValue;
  input: UpdateCompanySettingsInput;
}) =>
  prisma.$transaction(async (transaction) => {
    const current = await transaction.companySettings.upsert({
      create: companySettingsDefaults,
      select: companySettingsSelect,
      update: { id: SETTINGS_SINGLETON_IDS.company },
      where: { id: SETTINGS_SINGLETON_IDS.company },
    });
    const settings = await transaction.companySettings.update({
      data: input,
      select: companySettingsSelect,
      where: { id: SETTINGS_SINGLETON_IDS.company },
    });

    await createAuditLog({
      ...auditLog,
      entityId: settings.id,
      entityType: "CompanySettings",
      metadata: getAuditMetadata(current),
      tx: transaction,
    });

    return settings;
  });

export const updateAttendanceSettingsWithAuditLog = ({
  auditLog,
  prepareUpdate,
  input,
}: {
  auditLog: SettingsMutationAuditLog;
  prepareUpdate: (current: AttendanceSettingsRecord) => Prisma.InputJsonValue;
  input: UpdateAttendanceSettingsInput;
}) =>
  prisma.$transaction(async (transaction) => {
    const current = await transaction.attendanceSettings.upsert({
      create: attendanceSettingsDefaults,
      select: attendanceSettingsSelect,
      update: { id: SETTINGS_SINGLETON_IDS.attendance },
      where: { id: SETTINGS_SINGLETON_IDS.attendance },
    });
    const metadata = prepareUpdate(current);
    const settings = await transaction.attendanceSettings.update({
      data: input,
      select: attendanceSettingsSelect,
      where: { id: SETTINGS_SINGLETON_IDS.attendance },
    });

    await createAuditLog({
      ...auditLog,
      entityId: settings.id,
      entityType: "AttendanceSettings",
      metadata,
      tx: transaction,
    });

    return settings;
  });

export const updateLeaveSettingsWithAuditLog = ({
  auditLog,
  getAuditMetadata,
  input,
}: {
  auditLog: SettingsMutationAuditLog;
  getAuditMetadata: (current: LeaveSettingsRecord) => Prisma.InputJsonValue;
  input: UpdateLeaveSettingsInput;
}) =>
  prisma.$transaction(async (transaction) => {
    const current = await transaction.leaveSettings.upsert({
      create: leaveSettingsDefaults,
      select: leaveSettingsSelect,
      update: { id: SETTINGS_SINGLETON_IDS.leave },
      where: { id: SETTINGS_SINGLETON_IDS.leave },
    });
    const settings = await transaction.leaveSettings.update({
      data: input,
      select: leaveSettingsSelect,
      where: { id: SETTINGS_SINGLETON_IDS.leave },
    });

    await createAuditLog({
      ...auditLog,
      entityId: settings.id,
      entityType: "LeaveSettings",
      metadata: getAuditMetadata(current),
      tx: transaction,
    });

    return settings;
  });
