import { z } from "zod";

import {
  limitQuerySchema,
  pageQuerySchema,
} from "../../core/pagination/pagination";

export const payslipIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listPayslipsSchema = z.object({
  query: z.object({
    employeeId: z.string().trim().optional(),
    limit: limitQuerySchema,
    month: z.coerce.number().int().min(1).max(12).optional(),
    page: pageQuerySchema,
    search: z.string().trim().optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const listSelfPayslipsSchema = z.object({
  query: z.object({
    limit: limitQuerySchema,
    month: z.coerce.number().int().min(1).max(12).optional(),
    page: pageQuerySchema,
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
