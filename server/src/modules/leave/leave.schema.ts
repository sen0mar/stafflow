import { z } from "zod";

import {
  limitQuerySchema,
  pageQuerySchema,
} from "../../core/pagination/pagination";
import {
  idInputSchema,
  searchInputSchema,
} from "../../core/validation/request-input";
const optionalNoteSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const leaveIdSchema = z.object({
  params: z.object({
    id: idInputSchema,
  }),
});

export const listLeaveTypesSchema = z.object({
  query: z.object({
    isActive: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value === "true";
      }),
    limit: limitQuerySchema.default(100),
    page: pageQuerySchema,
    search: searchInputSchema.optional(),
  }),
});

export const createLeaveTypeSchema = z.object({
  body: z.object({
    annualAllowance: z.coerce.number().min(0).max(365).optional().nullable(),
    description: z
      .string()
      .trim()
      .max(500)
      .transform((value) => (value.length > 0 ? value : null))
      .optional()
      .nullable(),
    isActive: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    name: z.string().trim().min(2).max(100),
  }),
});

export const updateLeaveTypeSchema = z.object({
  body: createLeaveTypeSchema.shape.body
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one leave type field is required.",
    }),
  params: leaveIdSchema.shape.params,
});

export const listSelfLeaveRequestsSchema = z.object({
  query: z.object({
    limit: limitQuerySchema,
    page: pageQuerySchema,
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  }),
});

export const listLeaveRequestsSchema = z.object({
  query: z.object({
    employeeId: idInputSchema.optional(),
    leaveTypeId: idInputSchema.optional(),
    limit: limitQuerySchema,
    page: pageQuerySchema,
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  }),
});

export const createLeaveRequestSchema = z.object({
  body: z.object({
    endDate: z.string().date(),
    leaveTypeId: idInputSchema,
    reason: optionalNoteSchema,
    startDate: z.string().date(),
  }),
});

export const reviewLeaveRequestSchema = z.object({
  body: z.object({
    reviewNote: optionalNoteSchema,
  }),
  params: leaveIdSchema.shape.params,
});

export type CreateLeaveRequestInput = z.infer<
  typeof createLeaveRequestSchema
>["body"];
export type CreateLeaveTypeInput = z.infer<
  typeof createLeaveTypeSchema
>["body"];
export type ListLeaveRequestsInput = z.infer<
  typeof listLeaveRequestsSchema
>["query"];
export type ListLeaveTypesInput = z.infer<typeof listLeaveTypesSchema>["query"];
export type ListSelfLeaveRequestsInput = z.infer<
  typeof listSelfLeaveRequestsSchema
>["query"];
export type ReviewLeaveRequestInput = z.infer<
  typeof reviewLeaveRequestSchema
>["body"];
export type UpdateLeaveTypeInput = z.infer<
  typeof updateLeaveTypeSchema
>["body"];
