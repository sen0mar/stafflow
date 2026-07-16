import {
  deleteRetainedAuthRecords,
  getAuthMaintenanceCutoff,
} from "../../src/modules/auth/auth-maintenance.repository";
import { createLoginSessionAtomically } from "../../src/modules/auth/auth.repository";
import {
  createSessionToken,
  hashSessionToken,
} from "../../src/core/auth/session.service";
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

const createActiveUser = (email: string) =>
  prisma.user.create({
    data: {
      email,
      passwordHash: "integration-test-hash",
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  });

const uniqueTokenHash = () => hashSessionToken(createSessionToken());

describeWithTestDatabase("auth table growth bounds", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    await cleanAuthRecords();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("commits session creation and lastLoginAt together", async () => {
    const user = await createActiveUser("atomic-login.integration@example.com");
    const loggedInAt = new Date("2026-07-16T12:00:00.000Z");

    const session = await createLoginSessionAtomically({
      demoSessionLimit: null,
      expiresAt: new Date("2026-07-23T12:00:00.000Z"),
      loggedInAt,
      tokenHash: uniqueTokenHash(),
      userId: user.id,
    });

    await expect(
      prisma.session.findUnique({ where: { id: session.id } }),
    ).resolves.not.toBeNull();
    await expect(
      prisma.user.findUnique({
        select: { lastLoginAt: true },
        where: { id: user.id },
      }),
    ).resolves.toEqual({ lastLoginAt: loggedInAt });
  });

  it("rolls back a created session when the lastLoginAt write fails", async () => {
    const user = await createActiveUser(
      "atomic-login-rollback.integration@example.com",
    );

    await expect(
      createLoginSessionAtomically({
        demoSessionLimit: null,
        expiresAt: new Date("2026-07-23T12:00:00.000Z"),
        loggedInAt: new Date(Number.NaN),
        tokenHash: uniqueTokenHash(),
        userId: user.id,
      }),
    ).rejects.toThrow();

    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.user.findUnique({
        select: { lastLoginAt: true },
        where: { id: user.id },
      }),
    ).resolves.toEqual({ lastLoginAt: null });
  });

  it("keeps the 100-session demo cap under concurrent successful logins", async () => {
    const user = await createActiveUser("demo-cap.integration@example.com");
    const expiresAt = new Date("2026-07-23T12:00:00.000Z");

    await prisma.session.createMany({
      data: Array.from({ length: 100 }, (_, index) => ({
        createdAt: new Date(Date.UTC(2026, 6, 1, 0, 0, index)),
        expiresAt,
        tokenHash: uniqueTokenHash(),
        userId: user.id,
      })),
    });

    const createdSessions = await Promise.all(
      Array.from({ length: 10 }, () =>
        createLoginSessionAtomically({
          demoSessionLimit: 100,
          expiresAt,
          loggedInAt: new Date("2026-07-16T12:00:00.000Z"),
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        }),
      ),
    );

    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(100);
    await expect(
      prisma.session.count({
        where: { id: { in: createdSessions.map(({ id }) => id) } },
      }),
    ).resolves.toBe(10);
    await expect(
      prisma.user.findUnique({
        select: { lastLoginAt: true },
        where: { id: user.id },
      }),
    ).resolves.toEqual({ lastLoginAt: null });
  });

  it("deletes only terminal rows strictly older than the retention cutoff", async () => {
    const user = await createActiveUser("maintenance.integration@example.com");
    const now = new Date("2026-07-16T12:00:00.000Z");
    const cutoff = getAuthMaintenanceCutoff(now);
    const beforeCutoff = new Date(cutoff.getTime() - 1);
    const atCutoff = new Date(cutoff);
    const afterCutoff = new Date(cutoff.getTime() + 1);
    const future = new Date("2026-08-01T00:00:00.000Z");

    const sessions = await Promise.all([
      prisma.session.create({
        data: {
          expiresAt: beforeCutoff,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.session.create({
        data: {
          expiresAt: future,
          revokedAt: beforeCutoff,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.session.create({
        data: {
          expiresAt: future,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.session.create({
        data: {
          expiresAt: atCutoff,
          revokedAt: afterCutoff,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
    ]);
    const invitations = await Promise.all([
      prisma.invitationToken.create({
        data: {
          acceptedAt: beforeCutoff,
          email: user.email,
          expiresAt: future,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.invitationToken.create({
        data: {
          email: user.email,
          expiresAt: beforeCutoff,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.invitationToken.create({
        data: {
          email: user.email,
          expiresAt: future,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.invitationToken.create({
        data: {
          acceptedAt: atCutoff,
          email: user.email,
          expiresAt: atCutoff,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
    ]);
    const resetTokens = await Promise.all([
      prisma.passwordResetToken.create({
        data: {
          expiresAt: future,
          tokenHash: uniqueTokenHash(),
          usedAt: beforeCutoff,
          userId: user.id,
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          expiresAt: beforeCutoff,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          expiresAt: future,
          tokenHash: uniqueTokenHash(),
          userId: user.id,
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          expiresAt: atCutoff,
          tokenHash: uniqueTokenHash(),
          usedAt: atCutoff,
          userId: user.id,
        },
      }),
    ]);

    await expect(deleteRetainedAuthRecords(cutoff)).resolves.toEqual({
      cutoff,
      invitationTokensDeleted: 2,
      passwordResetTokensDeleted: 2,
      sessionsDeleted: 2,
    });

    const remainingSessions = await prisma.session.findMany({
      select: { id: true },
    });
    const remainingInvitations = await prisma.invitationToken.findMany({
      select: { id: true },
    });
    const remainingResetTokens = await prisma.passwordResetToken.findMany({
      select: { id: true },
    });

    expect(remainingSessions).toHaveLength(2);
    expect(remainingSessions).toEqual(
      expect.arrayContaining(sessions.slice(2).map(({ id }) => ({ id }))),
    );
    expect(remainingInvitations).toHaveLength(2);
    expect(remainingInvitations).toEqual(
      expect.arrayContaining(invitations.slice(2).map(({ id }) => ({ id }))),
    );
    expect(remainingResetTokens).toHaveLength(2);
    expect(remainingResetTokens).toEqual(
      expect.arrayContaining(resetTokens.slice(2).map(({ id }) => ({ id }))),
    );

    await expect(deleteRetainedAuthRecords(cutoff)).resolves.toEqual({
      cutoff,
      invitationTokensDeleted: 0,
      passwordResetTokensDeleted: 0,
      sessionsDeleted: 0,
    });
  });
});
