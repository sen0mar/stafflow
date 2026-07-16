import type {
  AttendanceSettingsFormValues,
  CompanySettingsFormValues,
  LeaveSettingsFormValues,
} from '../schemas/settings-form.schema'

export type PendingSettingsSave =
  | { type: 'company'; values: CompanySettingsFormValues }
  | { type: 'attendance'; values: AttendanceSettingsFormValues }
  | { type: 'leave'; values: LeaveSettingsFormValues }
