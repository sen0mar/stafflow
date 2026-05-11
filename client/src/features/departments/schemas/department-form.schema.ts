import { z } from 'zod'

export const departmentFormSchema = z.object({
  description: z.string().trim().max(500, 'Description must be 500 characters or less.').optional(),
  isActive: z.boolean(),
  name: z.string().trim().min(1, 'Department name is required.').max(120, 'Department name is too long.'),
})

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>
