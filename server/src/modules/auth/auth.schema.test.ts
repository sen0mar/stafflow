import {
  acceptInvitationSchema,
  authInputLimits,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.schema";

describe("public auth input limits", () => {
  it("rejects oversized emails and login passwords", () => {
    expect(() =>
      loginSchema.parse({
        body: {
          email: `${"a".repeat(authInputLimits.emailCharacters)}@example.com`,
          password: "password",
        },
      }),
    ).toThrow();
    expect(() =>
      loginSchema.parse({
        body: {
          email: "employee@example.com",
          password: "a".repeat(authInputLimits.passwordCharacters + 1),
        },
      }),
    ).toThrow();
    expect(() =>
      loginSchema.parse({
        body: {
          email: "employee@example.com",
          password: "😀".repeat(19),
        },
      }),
    ).toThrow();
  });

  it("rejects oversized public auth tokens", () => {
    const token = "a".repeat(authInputLimits.tokenCharacters + 1);

    expect(() =>
      resetPasswordSchema.parse({
        body: { newPassword: "valid-password", token },
      }),
    ).toThrow();
    expect(() =>
      acceptInvitationSchema.parse({
        body: { password: "valid-password", token },
      }),
    ).toThrow();
  });

  it("normalizes valid bounded emails", () => {
    const result = forgotPasswordSchema.parse({
      body: { email: "  Employee@Example.com  " },
    });

    expect(result.body.email).toBe("employee@example.com");
  });
});
