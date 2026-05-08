import { prisma } from "../../prisma/prisma.client";

// Centralize the auth select so password hashes never leak past the service layer.
export const authUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  role: true,
  status: true,
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

// Login needs the password hash, but controllers only receive sanitized users.
export const findUserByEmailForAuth = async (email: string) =>
  prisma.user.findUnique({
    where: { email },
    select: authUserSelect,
  });

export const findUserByIdForAuth = async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: authUserSelect,
  });

export const findActiveUserByEmail = async (email: string) =>
  prisma.user.findFirst({
    where: {
      email,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

// Persist only the hashed token; the raw token lives solely in the cookie.
export const createSession = async ({
  expiresAt,
  tokenHash,
  userId,
}: {
  expiresAt: Date;
  tokenHash: string;
  userId: string;
}) =>
  prisma.session.create({
    data: {
      expiresAt,
      tokenHash,
      userId,
    },
    select: {
      id: true,
    },
  });

// Track successful login time separately from session creation for auditability.
export const updateLastLoginAt = async (userId: string) =>
  prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
    select: { id: true },
  });

// Mark sessions revoked instead of deleting them so invalidation remains explicit.
export const revokeSession = async (sessionId: string) =>
  prisma.session.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

// Security-sensitive password setup/reset flows revoke every active session.
export const revokeUserSessions = async (userId: string) =>
  prisma.session.updateMany({
    where: {
      revokedAt: null,
      userId,
    },
    data: {
      revokedAt: new Date(),
    },
  });

// Password hash updates are deliberately narrow and never return the hash.
export const updatePasswordHash = async ({
  passwordHash,
  userId,
}: {
  passwordHash: string;
  userId: string;
}) =>
  prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true },
  });

export const createPasswordResetToken = async ({
  expiresAt,
  tokenHash,
  userId,
}: {
  expiresAt: Date;
  tokenHash: string;
  userId: string;
}) =>
  prisma.passwordResetToken.create({
    data: {
      expiresAt,
      tokenHash,
      userId,
    },
    select: {
      id: true,
    },
  });

export const findValidPasswordResetToken = async (tokenHash: string) =>
  prisma.passwordResetToken.findFirst({
    where: {
      expiresAt: { gt: new Date() },
      tokenHash,
      usedAt: null,
      user: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: authUserSelect,
      },
    },
  });

export const markPasswordResetTokenUsed = async (tokenId: string) =>
  prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
    select: { id: true },
  });

export const findValidInvitationToken = async (tokenHash: string) =>
  prisma.invitationToken.findFirst({
    where: {
      acceptedAt: null,
      expiresAt: { gt: new Date() },
      tokenHash,
    },
    select: {
      email: true,
      id: true,
      role: true,
      userId: true,
      user: {
        select: authUserSelect,
      },
    },
  });

export const acceptInvitationToken = async ({
  passwordHash,
  tokenId,
  userId,
}: {
  passwordHash: string;
  tokenId: string;
  userId: string;
}) =>
  prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        status: "ACTIVE",
      },
      select: { id: true },
    }),
    prisma.invitationToken.update({
      where: { id: tokenId },
      data: { acceptedAt: new Date() },
      select: { id: true },
    }),
  ]);

export const markInvitationTokenAccepted = async (tokenId: string) =>
  prisma.invitationToken.update({
    where: { id: tokenId },
    data: { acceptedAt: new Date() },
    select: { id: true },
  });

export const createInvitedUserForAcceptedInvitation = async ({
  email,
  passwordHash,
  role,
}: {
  email: string;
  passwordHash: string;
  role: "ADMIN" | "EMPLOYEE";
}) =>
  prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      status: "ACTIVE",
    },
    select: authUserSelect,
  });
