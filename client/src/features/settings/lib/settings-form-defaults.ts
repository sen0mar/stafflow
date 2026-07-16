import type {
  AttendanceSettings,
  CompanySettings,
  LeaveSettings,
} from '../api/settings.api'
import type {
  AttendanceSettingsFormValues,
  CompanySettingsFormValues,
  LeaveSettingsFormValues,
} from '../schemas/settings-form.schema'

export const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
]

export const getCompanyDefaults = (
  settings?: CompanySettings,
): CompanySettingsFormValues => ({
  locale: settings?.locale ?? 'en-US',
  name: settings?.name ?? '',
  timezone: settings?.timezone ?? 'UTC',
})

export const getAttendanceDefaults = (
  settings?: AttendanceSettings,
): AttendanceSettingsFormValues => ({
  allowEmployeeClockIn: settings?.allowEmployeeClockIn ?? true,
  lateGracePeriodMinutes: settings?.lateGracePeriodMinutes ?? 0,
  weeklyWorkingDays: settings?.weeklyWorkingDays ?? [1, 2, 3, 4, 5],
  workdayEnd: settings?.workdayEnd ?? '17:00',
  workdayMinutes: settings?.workdayMinutes ?? 480,
  workdayStart: settings?.workdayStart ?? '09:00',
})

export const getLeaveDefaults = (
  settings?: LeaveSettings,
): LeaveSettingsFormValues => ({
  allowNegativeBalance: settings?.allowNegativeBalance ?? false,
  defaultAnnualAllowanceDays: settings?.defaultAnnualAllowanceDays ?? 0,
  policyText: settings?.policyText ?? '',
})
