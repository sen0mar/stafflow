import { z } from "zod";

import {
  limitQuerySchema,
  pageQuerySchema,
} from "../../core/pagination/pagination";
const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const employeeIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listEmployeesSchema = z.object({
  query: z.object({
    departmentId: z.string().trim().optional(),
    limit: limitQuerySchema,
    page: pageQuerySchema,
    search: z.string().trim().optional(),
    sort: z
      .enum(["name", "newest", "oldest", "department", "status"])
      .default("name"),
    status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    departmentId: optionalTrimmedString,
    email: z.string().trim().email().toLowerCase(),
    employeeCode: z.string().trim().min(1).max(40),
    firstName: z.string().trim().min(1).max(80),
    hireDate: z.string().date().optional().nullable(),
    jobTitle: optionalTrimmedString,
    lastName: z.string().trim().min(1).max(80),
    phone: optionalTrimmedString,
  }),
});

export const updateEmployeeSchema = z.object({
  body: z
    .object({
      departmentId: optionalTrimmedString,
      employeeCode: z.string().trim().min(1).max(40).optional(),
      firstName: z.string().trim().min(1).max(80).optional(),
      hireDate: z.string().date().optional().nullable(),
      jobTitle: optionalTrimmedString,
      lastName: z.string().trim().min(1).max(80).optional(),
      phone: optionalTrimmedString,
      terminationDate: z.string().date().optional().nullable(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one employee field is required.",
    }),
  params: employeeIdSchema.shape.params,
});

export const updateEmployeeStatusSchema = z.object({
  body: z
    .object({
      accountStatus: z.enum(["ACTIVE", "DISABLED", "INVITED"]).optional(),
      employeeStatus: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one status field is required.",
    }),
  params: employeeIdSchema.shape.params,
});

export const disableEmployeeSchema = z.object({
  body: z
    .object({
      employeeStatus: z.enum(["INACTIVE", "TERMINATED"]).default("INACTIVE"),
    })
    .optional()
    .default({ employeeStatus: "INACTIVE" }),
  params: employeeIdSchema.shape.params,
});

export const updateSelfProfileSchema = z.object({
  body: z
    .object({
      firstName: z.string().trim().min(1).max(80).optional(),
      lastName: z.string().trim().min(1).max(80).optional(),
      phone: optionalTrimmedString,
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one profile field is required.",
    }),
});

export type ListEmployeesInput = z.infer<typeof listEmployeesSchema>["query"];
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>["body"];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>["body"];
export type UpdateEmployeeStatusInput = z.infer<
  typeof updateEmployeeStatusSchema
>["body"];
export type DisableEmployeeInput = z.infer<
  typeof disableEmployeeSchema
>["body"];
export type UpdateSelfProfileInput = z.infer<
  typeof updateSelfProfileSchema
>["body"];
