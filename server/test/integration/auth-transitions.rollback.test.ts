import { vi } from "vitest";

const { createAuditLog } = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
}));

vi.mock("../../src/modules/audit-logs/audit-log.service", () => ({
  createAuditLog,
}));

import {
  hashPassword,
  verifyPassword,
} from "../../src/core/auth/password.service";
import {
  createSessionToken,
  hashSessionToken,
} from "../../src/core/auth/session.service";
import {
  acceptInvitationAtomically,
  changePasswordAtomically,
} from "../../src/modules/auth/auth.repository";
import { prisma } from "../../src/prisma/prisma.client";

const getTestDatabaseName = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  return new URL(databaseUrl).pathname.replace("/", "");
};

const hasDedicatedTestDatabase = () =>
  getTestDatabaseName()?.toLowerCase().includes("test") ?? false;

const describeWithTestDatabase = hasDedicatedTestDatabase()
  ? describe
  : describe.skip;

const cleanAuthRecords = async () => {
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.invitationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.department.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.attendanceSettings.deleteMany();
  await prisma.leaveSettings.deleteMany();
};

describeWithTestDatabase("atomic auth transition rollback", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    createAuditLog.mockReset();
    createAuditLog.mockRejectedValue(new Error("injected audit failure"));
    await cleanAuthRecords();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rolls back a password update and session revocation when auditing fails", async () => {
    const currentPassword = "RollbackCurrentPassword";
    const currentPasswordHash = await hashPassword(currentPassword);
    const user = await prisma.user.create({
      data: {
        email: "password-rollback.integration@example.com",
        passwordHash: currentPasswordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    });
    const session = await prisma.session.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: hashSessionToken(createSessionToken()),
        userId: user.id,
      },
    });

    await expect(
      changePasswordAtomically({
        auditContext: {},
        currentPasswordHash,
        passwordHash: await hashPassword("RollbackReplacement"),
        userId: user.id,
      }),
    ).rejects.toThrow("injected audit failure");

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const persistedSession = await prisma.session.findUniqueOrThrow({
      where: { id: session.id },
    });

    await expect(
      verifyPassword(currentPassword, persistedUser.passwordHash),
    ).resolves.toBe(true);
    expect(persistedSession.revokedAt).toBeNull();
    await expect(
      prisma.auditLog.count({ where: { entityId: user.id } }),
    ).resolves.toBe(0);
  });

  it("rolls back invitation use, activation, password, and revocation when auditing fails", async () => {
    const originalPassword = "RollbackInvitePlaceholder";
    const user = await prisma.user.create({
      data: {
        email: "invitation-rollback.integration@example.com",
        passwordHash: await hashPassword(originalPassword),
        role: "EMPLOYEE",
        status: "INVITED",
      },
    });
    const tokenHash = hashSessionToken(createSessionToken());
    const invitation = await prisma.invitationToken.create({
      data: {
        email: user.email,
        expiresAt: new Date(Date.now() + 60_000),
        role: user.role,
        tokenHash,
        userId: user.id,
      },
    });
    const session = await prisma.session.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: hashSessionToken(createSessionToken()),
        userId: user.id,
      },
    });

    await expect(
      acceptInvitationAtomically({
        passwordHash: await hashPassword("RollbackInviteReplacement"),
        tokenHash,
      }),
    ).rejects.toThrow("injected audit failure");

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const persistedInvitation = await prisma.invitationToken.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    const persistedSession = await prisma.session.findUniqueOrThrow({
      where: { id: session.id },
    });

    expect(persistedUser.status).toBe("INVITED");
    await expect(
      verifyPassword(originalPassword, persistedUser.passwordHash),
    ).resolves.toBe(true);
    expect(persistedInvitation.acceptedAt).toBeNull();
    expect(persistedSession.revokedAt).toBeNull();
    await expect(
      prisma.auditLog.count({ where: { entityId: user.id } }),
    ).resolves.toBe(0);
  });
});
