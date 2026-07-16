import request from "supertest";
import { vi } from "vitest";

import { AppError } from "../../core/errors/app-error";

vi.mock("./auth.service", () => ({
  acceptInvitation: vi.fn(),
  changePassword: vi.fn(),
  login: vi.fn().mockResolvedValue({
    token: "test-session-token",
    user: {
      email: "employee@example.com",
      employee: null,
      id: "user-id",
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  }),
  logout: vi.fn(),
}));

import { createApp } from "../../app";
import { login } from "./auth.service";
import { logger } from "../../core/logger/logger";

describe("public auth request hardening", () => {
  it("returns a controlled 422 before oversized input reaches auth work", async () => {
    vi.mocked(login).mockClear();

    await request(createApp())
      .post("/auth/login")
      .send({ email: `${"a".repeat(254)}@example.com`, password: "password" })
      .expect(422)
      .expect(({ body }) => {
        expect(body.error.code).toBe("VALIDATION_ERROR");
      });

    expect(login).not.toHaveBeenCalled();
  });

  it("does not let a cross-site-style form login establish a session", async () => {
    const response = await request(createApp())
      .post("/auth/login")
      .type("form")
      .send({ email: "employee@example.com", password: "password" })
      .expect(415);

    expect(login).not.toHaveBeenCalled();
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects form bodies on invitation acceptance", async () => {
    await request(createApp())
      .post("/auth/invitations/accept")
      .type("form")
      .send({
        email: "employee@example.com",
        password: "password",
        token: "a".repeat(43),
      })
      .expect(415)
      .expect(({ body }) => {
        expect(body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
      });
  });

  it("emits one log event for an expected failed login", async () => {
    vi.mocked(login).mockRejectedValueOnce(
      new AppError({
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
        statusCode: 401,
      }),
    );
    const warnSpy = vi.spyOn(logger, "warn");

    await request(createApp())
      .post("/auth/login")
      .send({ email: "missing@example.com", password: "password" })
      .expect(401);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "missing@example.com",
        reason: "INVALID_CREDENTIALS",
      }),
      "Login attempt failed",
    );
  });
});
