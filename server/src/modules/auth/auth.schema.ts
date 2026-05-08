import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
