import { z } from "zod";

import {
  limitQuerySchema,
  pageQuerySchema,
} from "../../core/pagination/pagination";
import {
  idInputSchema,
  searchInputSchema,
} from "../../core/validation/request-input";

export const departmentIdSchema = z.object({
  params: z.object({
    id: idInputSchema,
  }),
});

export const listDepartmentsSchema = z.object({
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
    page: pageQuerySchema,
    pageSize: limitQuerySchema,
    search: searchInputSchema.optional(),
  }),
});

export const createDepartmentSchema = z.object({
  body: z.object({
    description: z.string().trim().max(500).optional().nullable(),
    isActive: z.boolean().optional(),
    name: z.string().trim().min(1, "Department name is required.").max(120),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z
    .object({
      description: z.string().trim().max(500).optional().nullable(),
      isActive: z.boolean().optional(),
      name: z
        .string()
        .trim()
        .min(1, "Department name is required.")
        .max(120)
        .optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one department field is required.",
    }),
  params: departmentIdSchema.shape.params,
});

export type ListDepartmentsInput = z.infer<
  typeof listDepartmentsSchema
>["query"];
export type CreateDepartmentInput = z.infer<
  typeof createDepartmentSchema
>["body"];
export type UpdateDepartmentInput = z.infer<
  typeof updateDepartmentSchema
>["body"];
