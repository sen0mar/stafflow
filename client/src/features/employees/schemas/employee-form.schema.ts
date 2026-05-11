import { z } from 'zod'

export const employeeFormSchema = z.object({
  departmentId: z.string().optional(),
  email: z.string().trim().email('Enter a valid email address.').optional(),
  employeeCode: z.string().trim().min(1, 'Employee code is required.').max(40),
  firstName: z.string().trim().min(1, 'First name is required.').max(80),
  hireDate: z.string().optional(),
  jobTitle: z.string().trim().max(120).optional(),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80),
  phone: z.string().trim().max(40).optional(),
})

export const createEmployeeFormSchema = employeeFormSchema.extend({
  email: z.string().trim().email('Enter a valid email address.'),
})

export const selfProfileFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(80),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80),
  phone: z.string().trim().max(40).optional(),
})

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>
export type CreateEmployeeFormValues = z.infer<typeof createEmployeeFormSchema>
export type SelfProfileFormValues = z.infer<typeof selfProfileFormSchema>
