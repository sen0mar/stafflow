import { z } from 'zod'

export const attendanceCorrectionSchema = z
  .object({
    clockInAt: z.string().optional(),
    clockOutAt: z.string().optional(),
    notes: z.string().max(500).optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'PARTIAL']),
  })
  .refine(
    (value) => {
      if (!value.clockInAt || !value.clockOutAt) {
        return true
      }

      return new Date(value.clockOutAt) >= new Date(value.clockInAt)
    },
    {
      message: 'Clock-out must be after clock-in.',
      path: ['clockOutAt'],
    },
  )

export type AttendanceCorrectionValues = z.infer<typeof attendanceCorrectionSchema>
