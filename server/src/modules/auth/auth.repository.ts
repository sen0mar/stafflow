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

// Password changes preserve the current session but remove other active sessions.
export const revokeOtherUserSessions = async ({
  currentSessionId,
  userId,
}: {
  currentSessionId: string;
  userId: string;
}) =>
  prisma.session.updateMany({
    where: {
      id: { not: currentSessionId },
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
