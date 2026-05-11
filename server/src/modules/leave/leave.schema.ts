import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(10);
const optionalNoteSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const leaveIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listLeaveTypesSchema = z.object({
  query: z.object({
    isActive: z.coerce.boolean().optional(),
    limit: limitSchema.default(100),
    page: pageSchema,
    search: z.string().trim().optional(),
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
  body: createLeaveTypeSchema.shape.body.partial().refine(
    (value) => Object.keys(value).length > 0,
    {
      message: "At least one leave type field is required.",
    },
  ),
  params: leaveIdSchema.shape.params,
});

export const listSelfLeaveRequestsSchema = z.object({
  query: z.object({
    limit: limitSchema,
    page: pageSchema,
    status: z
      .enum(["PENDING", "APPROVED", "REJECTED"])
      .optional(),
  }),
});

export const listLeaveRequestsSchema = z.object({
  query: z.object({
    employeeId: z.string().trim().optional(),
    leaveTypeId: z.string().trim().optional(),
    limit: limitSchema,
    page: pageSchema,
    status: z
      .enum(["PENDING", "APPROVED", "REJECTED"])
      .optional(),
  }),
});

export const createLeaveRequestSchema = z.object({
  body: z.object({
    endDate: z.string().date(),
    leaveTypeId: z.string().trim().min(1),
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
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>["body"];
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
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>["body"];
