import { z } from 'zod'

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format.')

const numberInputSchema = (min: number, max: number) =>
  z.number().min(min).max(max)

export const companySettingsFormSchema = z.object({
  locale: z.string().trim().min(2, 'Locale is required.').max(20),
  name: z.string().trim().min(1, 'Company name is required.').max(120),
  timezone: z.string().trim().min(1, 'Timezone is required.'),
})

export const attendanceSettingsFormSchema = z
  .object({
    allowEmployeeClockIn: z.boolean(),
    lateGracePeriodMinutes: numberInputSchema(0, 240),
    weeklyWorkingDays: z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one working day.'),
    workdayEnd: timeSchema,
    workdayMinutes: numberInputSchema(1, 1440),
    workdayStart: timeSchema,
  })
  .refine(({ workdayEnd, workdayStart }) => workdayEnd > workdayStart, {
    message: 'End time must be after start time.',
    path: ['workdayEnd'],
  })

export const leaveSettingsFormSchema = z.object({
  allowNegativeBalance: z.boolean(),
  defaultAnnualAllowanceDays: numberInputSchema(0, 365),
  policyText: z.string().max(2000, 'Policy text is too long.'),
})

export type CompanySettingsFormValues = z.infer<typeof companySettingsFormSchema>
export type AttendanceSettingsFormValues = z.infer<typeof attendanceSettingsFormSchema>
export type LeaveSettingsFormValues = z.infer<typeof leaveSettingsFormSchema>
