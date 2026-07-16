import { env } from "../../config/env";
import { AppError } from "../../core/errors/app-error";
import {
  findAttendanceSettings,
  findCompanySettings,
  findLeaveSettings,
  upsertDefaultAttendanceSettings,
  upsertDefaultCompanySettings,
  upsertDefaultLeaveSettings,
  updateAttendanceSettingsWithAuditLog,
  updateCompanySettingsWithAuditLog,
  updateLeaveSettingsWithAuditLog,
  type AttendanceSettingsRecord,
  type CompanySettingsRecord,
  type LeaveSettingsRecord,
} from "./settings.repository";
import type {
  UpdateAttendanceSettingsInput,
  UpdateCompanySettingsInput,
  UpdateLeaveSettingsInput,
} from "./settings.schema";

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

const toIso = (date: Date) => date.toISOString();

const decimalToNumber = (value: { toString: () => string } | number) =>
  typeof value === "number" ? value : Number(value.toString());

const getChangedFields = (input: Record<string, unknown>) => Object.keys(input);

const toCompanySettingsDto = (settings: CompanySettingsRecord) => ({
  createdAt: toIso(settings.createdAt),
  demoMode: env.DEMO_MODE,
  id: settings.id,
  locale: settings.locale,
  name: settings.name,
  timezone: settings.timezone,
  updatedAt: toIso(settings.updatedAt),
});

const toAttendanceSettingsDto = (settings: AttendanceSettingsRecord) => ({
  allowEmployeeClockIn: settings.allowEmployeeClockIn,
  createdAt: toIso(settings.createdAt),
  demoMode: env.DEMO_MODE,
  id: settings.id,
  lateGracePeriodMinutes: settings.lateGracePeriodMinutes,
  updatedAt: toIso(settings.updatedAt),
  weeklyWorkingDays: settings.weeklyWorkingDays,
  workdayEnd: settings.workdayEnd,
  workdayMinutes: settings.workdayMinutes,
  workdayStart: settings.workdayStart,
});

const toLeaveSettingsDto = (settings: LeaveSettingsRecord) => ({
  allowNegativeBalance: settings.allowNegativeBalance,
  createdAt: toIso(settings.createdAt),
  defaultAnnualAllowanceDays: decimalToNumber(
    settings.defaultAnnualAllowanceDays,
  ),
  demoMode: env.DEMO_MODE,
  id: settings.id,
  policyText: settings.policyText,
  updatedAt: toIso(settings.updatedAt),
});

const getCompanyAuditSnapshot = (settings: CompanySettingsRecord) => ({
  locale: settings.locale,
  name: settings.name,
  timezone: settings.timezone,
});

const getAttendanceAuditSnapshot = (settings: AttendanceSettingsRecord) => ({
  allowEmployeeClockIn: settings.allowEmployeeClockIn,
  lateGracePeriodMinutes: settings.lateGracePeriodMinutes,
  weeklyWorkingDays: settings.weeklyWorkingDays,
  workdayEnd: settings.workdayEnd,
  workdayMinutes: settings.workdayMinutes,
  workdayStart: settings.workdayStart,
});

const getLeaveAuditSnapshot = (settings: LeaveSettingsRecord) => ({
  allowNegativeBalance: settings.allowNegativeBalance,
  defaultAnnualAllowanceDays: decimalToNumber(
    settings.defaultAnnualAllowanceDays,
  ),
  policyText: settings.policyText,
});

const getMinutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
};

const assertWorkdayRange = ({
  workdayEnd,
  workdayStart,
}: {
  workdayEnd: string;
  workdayStart: string;
}) => {
  if (getMinutesFromTime(workdayEnd) <= getMinutesFromTime(workdayStart)) {
    throw new AppError({
      code: "SETTINGS_INVALID_WORKDAY_RANGE",
      message: "Workday end must be after workday start.",
      statusCode: 422,
    });
  }
};

const getCompanySettingsRecord = async () =>
  (await findCompanySettings()) ?? (await upsertDefaultCompanySettings());

const getAttendanceSettingsRecord = async () =>
  (await findAttendanceSettings()) ?? (await upsertDefaultAttendanceSettings());

const getLeaveSettingsRecord = async () =>
  (await findLeaveSettings()) ?? (await upsertDefaultLeaveSettings());

export const getCompanySettings = async () =>
  toCompanySettingsDto(await getCompanySettingsRecord());

export const getAttendanceSettings = async () =>
  toAttendanceSettingsDto(await getAttendanceSettingsRecord());

export const getLeaveSettings = async () =>
  toLeaveSettingsDto(await getLeaveSettingsRecord());

export const updateCompanySettings = async (
  input: UpdateCompanySettingsInput,
  auditContext: AuditContext,
) => {
  const settings = await updateCompanySettingsWithAuditLog({
    auditLog: {
      ...auditContext,
      action: "SETTINGS_COMPANY_UPDATED",
    },
    getAuditMetadata: (current) => ({
      changedFields: getChangedFields(input),
      from: getCompanyAuditSnapshot(current),
      to: {
        ...getCompanyAuditSnapshot(current),
        ...input,
      },
    }),
    input,
  });

  return toCompanySettingsDto(settings);
};

export const updateAttendanceSettings = async (
  input: UpdateAttendanceSettingsInput,
  auditContext: AuditContext,
) => {
  const settings = await updateAttendanceSettingsWithAuditLog({
    auditLog: {
      ...auditContext,
      action: "SETTINGS_ATTENDANCE_UPDATED",
    },
    input,
    prepareUpdate: (current) => {
      const next = {
        ...getAttendanceAuditSnapshot(current),
        ...input,
      };
      assertWorkdayRange({
        workdayEnd: next.workdayEnd,
        workdayStart: next.workdayStart,
      });

      return {
        changedFields: getChangedFields(input),
        from: getAttendanceAuditSnapshot(current),
        to: next,
      };
    },
  });

  return toAttendanceSettingsDto(settings);
};

export const updateLeaveSettings = async (
  input: UpdateLeaveSettingsInput,
  auditContext: AuditContext,
) => {
  const settings = await updateLeaveSettingsWithAuditLog({
    auditLog: {
      ...auditContext,
      action: "SETTINGS_LEAVE_UPDATED",
    },
    getAuditMetadata: (current) => ({
      changedFields: getChangedFields(input),
      from: getLeaveAuditSnapshot(current),
      to: {
        ...getLeaveAuditSnapshot(current),
        ...input,
      },
    }),
    input,
  });

  return toLeaveSettingsDto(settings);
};
