import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(10);

export const payslipIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listPayslipsSchema = z.object({
  query: z.object({
    employeeId: z.string().trim().optional(),
    limit: limitSchema,
    month: z.coerce.number().int().min(1).max(12).optional(),
    page: pageSchema,
    search: z.string().trim().optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const listSelfPayslipsSchema = z.object({
  query: z.object({
    limit: limitSchema,
    month: z.coerce.number().int().min(1).max(12).optional(),
    page: pageSchema,
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const createPayslipSchema = z.object({
  body: z.object({
    employeeId: z.string().trim().min(1),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

export type ListPayslipsInput = z.infer<typeof listPayslipsSchema>["query"];
export type ListSelfPayslipsInput = z.infer<
  typeof listSelfPayslipsSchema
>["query"];
export type CreatePayslipInput = z.infer<typeof createPayslipSchema>["body"];
