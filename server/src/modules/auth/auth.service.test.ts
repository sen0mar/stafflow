import { vi } from "vitest";

const { findUserByEmailForAuth, verifyPassword } = vi.hoisted(() => ({
  findUserByEmailForAuth: vi.fn().mockResolvedValue(null),
  verifyPassword: vi.fn().mockResolvedValue(false),
}));

vi.mock("../../core/auth/password.service", () => ({
  hashPassword: vi.fn(),
  validatePasswordConstraints: vi.fn(),
  verifyPassword,
}));

vi.mock("../audit-logs/audit-log.service", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("./auth.repository", () => ({
  acceptInvitationToken: vi.fn(),
  createInvitedUserForAcceptedInvitation: vi.fn(),
  createSession: vi.fn(),
  findUserByEmailForAuth,
  findUserByIdForAuth: vi.fn(),
  findValidInvitationToken: vi.fn(),
  markInvitationTokenAccepted: vi.fn(),
  pruneUserSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeUserSessions: vi.fn(),
  updateLastLoginAt: vi.fn(),
  updatePasswordHash: vi.fn(),
}));

import { login } from "./auth.service";

describe("auth login timing hardening", () => {
  it("performs a fixed bcrypt comparison when the email is missing", async () => {
    await expect(
      login({ email: "missing@example.com", password: "candidate-password" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      statusCode: 401,
    });

    expect(findUserByEmailForAuth).toHaveBeenCalledWith("missing@example.com");
    expect(verifyPassword).toHaveBeenCalledOnce();
    expect(verifyPassword).toHaveBeenCalledWith(
      "candidate-password",
      expect.stringMatching(/^\$2b\$12\$/),
    );
  });
});
