import { z } from "zod";

import {
  limitQuerySchema,
  pageQuerySchema,
} from "../../core/pagination/pagination";
import { idInputSchema } from "../../core/validation/request-input";
const optionalDateTimeSchema = z.string().datetime().optional().nullable();

export const attendanceIdSchema = z.object({
  params: z.object({
    id: idInputSchema,
  }),
});

export const listSelfAttendanceSchema = z.object({
  query: z.object({
    from: z.string().date().optional(),
    limit: limitQuerySchema,
    page: pageQuerySchema,
    status: z.enum(["PRESENT", "ABSENT", "LATE", "PARTIAL"]).optional(),
    to: z.string().date().optional(),
  }),
});

export const listAttendanceSchema = z.object({
  query: z.object({
    departmentId: idInputSchema.optional(),
    employeeId: idInputSchema.optional(),
    from: z.string().date().optional(),
    limit: limitQuerySchema,
    page: pageQuerySchema,
    status: z.enum(["PRESENT", "ABSENT", "LATE", "PARTIAL"]).optional(),
    to: z.string().date().optional(),
  }),
});

export const updateAttendanceSchema = z.object({
  body: z
    .object({
      clockInAt: optionalDateTimeSchema,
      clockOutAt: optionalDateTimeSchema,
      notes: z
        .string()
        .trim()
        .max(500)
        .transform((value) => (value.length > 0 ? value : null))
        .optional()
        .nullable(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "PARTIAL"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one attendance field is required.",
    }),
  params: attendanceIdSchema.shape.params,
});

export type ListSelfAttendanceInput = z.infer<
  typeof listSelfAttendanceSchema
>["query"];
export type ListAttendanceInput = z.infer<typeof listAttendanceSchema>["query"];
export type UpdateAttendanceInput = z.infer<
  typeof updateAttendanceSchema
>["body"];
