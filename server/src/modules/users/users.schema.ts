import { z } from "zod";

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateUserAccountSchema = z.object({
  body: z
    .object({
      role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
      status: z.enum(["ACTIVE", "DISABLED", "INVITED"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one user account field is required.",
    }),
  params: userIdSchema.shape.params,
});

export type UpdateUserAccountInput = z.infer<
  typeof updateUserAccountSchema
>["body"];
