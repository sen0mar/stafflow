import { z } from 'zod'
import { parseDateOnly } from '@/shared/lib/dates'

export const MAX_LEAVE_REQUEST_CALENDAR_DAYS = 365

const millisecondsPerDay = 86_400_000

export const leaveRequestFormSchema = z
  .object({
    endDate: z.string().min(1, 'End date is required.'),
    leaveTypeId: z.string().min(1, 'Leave type is required.'),
    reason: z
      .string()
      .max(500, 'Reason must be 500 characters or less.')
      .optional(),
    startDate: z.string().min(1, 'Start date is required.'),
  })
  .superRefine((value, context) => {
    if (!value.startDate || !value.endDate) {
      return
    }

    const startDate = parseDateOnly(value.startDate)
    const endDate = parseDateOnly(value.endDate)

    if (endDate < startDate) {
      context.addIssue({
        code: 'custom',
        message: 'End date must be on or after start date.',
        path: ['endDate'],
      })
      return
    }

    if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) {
      context.addIssue({
        code: 'custom',
        message: 'Leave requests must stay within one calendar year.',
        path: ['endDate'],
      })
      return
    }

    const totalDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / millisecondsPerDay,
      ) + 1

    if (totalDays > MAX_LEAVE_REQUEST_CALENDAR_DAYS) {
      context.addIssue({
        code: 'custom',
        message: `Leave requests cannot exceed ${MAX_LEAVE_REQUEST_CALENDAR_DAYS} calendar days.`,
        path: ['endDate'],
      })
    }
  })

export const leaveTypeFormSchema = z.object({
  annualAllowance: z
    .string()
    .min(1, 'Allowance is required.')
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
      message: 'Allowance cannot be negative.',
    })
    .refine((value) => Number(value) <= 365, {
      message: 'Allowance must be 365 days or less.',
    }),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less.')
    .optional(),
  isActive: z.boolean(),
  isPaid: z.boolean(),
  name: z
    .string()
    .trim()
    .min(2, 'Name is required.')
    .max(100, 'Name is too long.'),
})

export const leaveReviewSchema = z.object({
  reviewNote: z
    .string()
    .max(500, 'Note must be 500 characters or less.')
    .optional(),
})

export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormSchema>
export type LeaveReviewValues = z.infer<typeof leaveReviewSchema>
export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>
