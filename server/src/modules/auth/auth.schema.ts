import { z } from "zod";

import {
  emailInputSchema,
  publicTokenInputSchema,
  requestInputLimits,
} from "../../core/validation/request-input";

export const authInputLimits = {
  emailCharacters: requestInputLimits.emailCharacters,
  passwordBytes: 72,
  passwordCharacters: 72,
  tokenCharacters: requestInputLimits.publicTokenCharacters,
} as const;

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

export const loginSchema = z.object({
  body: z.object({
    email: emailInputSchema,
    password: passwordSchema,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  }),
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    password: passwordSchema,
    token: publicTokenInputSchema,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
export type AcceptInvitationInput = z.infer<
  typeof acceptInvitationSchema
>["body"];
