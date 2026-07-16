import { z } from "zod";

export const authInputLimits = {
  emailCharacters: 254,
  passwordBytes: 72,
  passwordCharacters: 72,
  tokenCharacters: 128,
} as const;

const emailSchema = z
  .string()
  .trim()
  .max(authInputLimits.emailCharacters)
  .email()
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(1)
  .max(authInputLimits.passwordCharacters)
  .refine(
    (password) =>
      Buffer.byteLength(password, "utf8") <= authInputLimits.passwordBytes,
    {
      message: `Password must be ${authInputLimits.passwordBytes} bytes or fewer.`,
    },
  );

const tokenSchema = z.string().min(32).max(authInputLimits.tokenCharacters);

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: passwordSchema,
    token: tokenSchema,
  }),
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    password: passwordSchema,
    token: tokenSchema,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type AcceptInvitationInput = z.infer<
  typeof acceptInvitationSchema
>["body"];
