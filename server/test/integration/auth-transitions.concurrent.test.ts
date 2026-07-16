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
  AuthTransitionError,
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

describeWithTestDatabase("atomic auth transition concurrency", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    await cleanAuthRecords();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("commits exactly one concurrent password change", async () => {
    const currentPasswordHash = await hashPassword("CurrentPassword");
    const candidatePasswords = ["FirstReplacement", "SecondReplacement"];
    const candidateHashes = await Promise.all(
      candidatePasswords.map((password) => hashPassword(password)),
    );
    const user = await prisma.user.create({
      data: {
        email: "password-race.integration@example.com",
        passwordHash: currentPasswordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    });

    await prisma.session.createMany({
      data: [
        {
          expiresAt: new Date(Date.now() + 60_000),
          tokenHash: hashSessionToken(createSessionToken()),
          userId: user.id,
        },
        {
          expiresAt: new Date(Date.now() + 60_000),
          tokenHash: hashSessionToken(createSessionToken()),
          userId: user.id,
        },
      ],
    });

    const results = await Promise.allSettled(
      candidateHashes.map((passwordHash) =>
        changePasswordAtomically({
          auditContext: {},
          currentPasswordHash,
          passwordHash,
          userId: user.id,
        }),
      ),
    );
    const successfulIndexes = results.flatMap((result, index) =>
      result.status === "fulfilled" ? [index] : [],
    );
    const rejectedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    expect(successfulIndexes).toHaveLength(1);
    expect(rejectedResults).toHaveLength(1);
    expect(rejectedResults[0]?.reason).toMatchObject({
      reason: "PASSWORD_CHANGED",
    });

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const winningPassword = candidatePasswords[successfulIndexes[0] ?? -1];

    expect(winningPassword).toBeDefined();
    await expect(
      verifyPassword(winningPassword ?? "", persistedUser.passwordHash),
    ).resolves.toBe(true);
    await expect(
      prisma.session.count({
        where: { revokedAt: { not: null }, userId: user.id },
      }),
    ).resolves.toBe(2);
    await expect(
      prisma.auditLog.count({
        where: { action: "PASSWORD_CHANGED", entityId: user.id },
      }),
    ).resolves.toBe(1);
  });

  it("consumes an invitation exactly once under concurrent acceptance", async () => {
    const originalPasswordHash = await hashPassword("InvitationPlaceholder");
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const candidatePasswords = ["FirstInvitePassword", "SecondInvitePassword"];
    const candidateHashes = await Promise.all(
      candidatePasswords.map((password) => hashPassword(password)),
    );
    const user = await prisma.user.create({
      data: {
        email: "invitation-race.integration@example.com",
        passwordHash: originalPasswordHash,
        role: "EMPLOYEE",
        status: "INVITED",
      },
    });
    const invitation = await prisma.invitationToken.create({
      data: {
        email: user.email,
        expiresAt: new Date(Date.now() + 60_000),
        role: user.role,
        tokenHash,
        userId: user.id,
      },
    });

    await prisma.session.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: hashSessionToken(createSessionToken()),
        userId: user.id,
      },
    });

    const results = await Promise.allSettled(
      candidateHashes.map((passwordHash) =>
        acceptInvitationAtomically({ passwordHash, tokenHash }),
      ),
    );
    const successfulIndexes = results.flatMap((result, index) =>
      result.status === "fulfilled" ? [index] : [],
    );
    const rejectedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    expect(successfulIndexes).toHaveLength(1);
    expect(rejectedResults).toHaveLength(1);
    expect(rejectedResults[0]?.reason).toBeInstanceOf(AuthTransitionError);
    expect(rejectedResults[0]?.reason).toMatchObject({
      reason: "INVITATION_INVALID",
    });

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const persistedInvitation = await prisma.invitationToken.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    const winningPassword = candidatePasswords[successfulIndexes[0] ?? -1];

    expect(persistedUser.status).toBe("ACTIVE");
    expect(persistedInvitation.acceptedAt).not.toBeNull();
    await expect(
      verifyPassword(winningPassword ?? "", persistedUser.passwordHash),
    ).resolves.toBe(true);
    await expect(
      prisma.session.count({
        where: { revokedAt: { not: null }, userId: user.id },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.auditLog.count({
        where: { action: "INVITATION_ACCEPTED", entityId: user.id },
      }),
    ).resolves.toBe(1);
  });

  it("rejects an invitation when its linked user is no longer invited", async () => {
    const originalPassword = "StillActivePassword";
    const originalPasswordHash = await hashPassword(originalPassword);
    const replacementPasswordHash = await hashPassword("UnsafeReplacement");
    const tokenHash = hashSessionToken(createSessionToken());
    const user = await prisma.user.create({
      data: {
        email: "active-invite.integration@example.com",
        passwordHash: originalPasswordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    });
    const invitation = await prisma.invitationToken.create({
      data: {
        email: user.email,
        expiresAt: new Date(Date.now() + 60_000),
        role: user.role,
        tokenHash,
        userId: user.id,
      },
    });

    await expect(
      acceptInvitationAtomically({
        passwordHash: replacementPasswordHash,
        tokenHash,
      }),
    ).rejects.toMatchObject({ reason: "INVITATION_INVALID" });

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const persistedInvitation = await prisma.invitationToken.findUniqueOrThrow({
      where: { id: invitation.id },
    });

    expect(persistedUser.status).toBe("ACTIVE");
    await expect(
      verifyPassword(originalPassword, persistedUser.passwordHash),
    ).resolves.toBe(true);
    expect(persistedInvitation.acceptedAt).toBeNull();
    await expect(
      prisma.auditLog.count({ where: { entityId: user.id } }),
    ).resolves.toBe(0);
  });
});
