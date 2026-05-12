import { z } from 'zod'

export const maxPayslipUploadBytes = 2 * 1024 * 1024

export const payslipUploadSchema = z.object({
  employeeId: z.string().min(1, 'Select an employee.'),
  file: z
    .instanceof(File, { message: 'Choose a PDF file.' })
    .refine((file) => file.type === 'application/pdf', 'Choose a PDF file.')
    .refine((file) => file.name.toLowerCase().endsWith('.pdf'), 'File name must end in .pdf.')
    .refine((file) => file.size <= maxPayslipUploadBytes, 'PDF must be 2 MB or smaller.'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})

export type PayslipUploadValues = z.infer<typeof payslipUploadSchema>
