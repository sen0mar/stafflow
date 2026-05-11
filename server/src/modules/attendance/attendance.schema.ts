import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(10);
const optionalDateTimeSchema = z
  .string()
  .datetime()
  .optional()
  .nullable();

export const attendanceIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listSelfAttendanceSchema = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    limit: limitSchema,
    page: pageSchema,
    status: z.enum(["PRESENT", "ABSENT", "LATE", "PARTIAL"]).optional(),
    to: z.string().datetime().optional(),
  }),
});

export const listAttendanceSchema = z.object({
  query: z.object({
    departmentId: z.string().trim().optional(),
    employeeId: z.string().trim().optional(),
    from: z.string().datetime().optional(),
    limit: limitSchema,
    page: pageSchema,
    status: z.enum(["PRESENT", "ABSENT", "LATE", "PARTIAL"]).optional(),
    to: z.string().datetime().optional(),
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
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>["body"];
