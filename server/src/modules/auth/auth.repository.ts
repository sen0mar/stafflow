import type { UserRole } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import {
  createAuditLog,
  type AuditLogInput,
} from "../audit-logs/audit-log.service";

type AuthAuditContext = Pick<AuditLogInput, "ipAddress" | "userAgent">;

type AuthTransitionFailureReason = "INVITATION_INVALID" | "PASSWORD_CHANGED";

export class AuthTransitionError extends Error {
  public readonly reason: AuthTransitionFailureReason;

  public constructor(reason: AuthTransitionFailureReason) {
    super(reason);
    this.name = "AuthTransitionError";
    this.reason = reason;
  }
}

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
export const createLoginSessionAtomically = async ({
  demoSessionLimit,
  expiresAt,
  loggedInAt,
  tokenHash,
  userId,
}: {
  demoSessionLimit: number | null;
  expiresAt: Date;
  loggedInAt: Date;
  tokenHash: string;
  userId: string;
}) =>
  prisma.$transaction(async (tx) => {
    // Lock the user row so concurrent shared-demo logins cannot each prune from
    // a stale snapshot and leave more than the configured per-user cap.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;

    const session = await tx.session.create({
      data: {
        expiresAt,
        tokenHash,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (demoSessionLimit === null) {
      await tx.user.update({
        data: { lastLoginAt: loggedInAt },
        select: { id: true },
        where: { id: userId },
      });
    } else {
      const retainedSessions = await tx.session.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
        take: demoSessionLimit - 1,
        where: {
          id: { not: session.id },
          userId,
        },
      });

      await tx.session.deleteMany({
        where: {
          id: {
            notIn: [session.id, ...retainedSessions.map(({ id }) => id)],
          },
          userId,
        },
      });
    }

    return session;
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

// Security-sensitive credential changes revoke every active session.
export const changePasswordAtomically = async ({
  auditContext,
  currentPasswordHash,
  passwordHash,
  userId,
}: {
  auditContext: AuthAuditContext;
  currentPasswordHash: string;
  passwordHash: string;
  userId: string;
}) =>
  prisma.$transaction(async (tx) => {
    const now = new Date();
    const passwordUpdate = await tx.user.updateMany({
      data: { passwordHash },
      where: {
        id: userId,
        passwordHash: currentPasswordHash,
        status: "ACTIVE",
      },
    });

    if (passwordUpdate.count !== 1) {
      throw new AuthTransitionError("PASSWORD_CHANGED");
    }

    await tx.session.updateMany({
      data: { revokedAt: now },
      where: {
        revokedAt: null,
        userId,
      },
    });
    await createAuditLog({
      ...auditContext,
      action: "PASSWORD_CHANGED",
      actorUserId: userId,
      entityId: userId,
      entityType: "User",
      metadata: {
        sessionsRevoked: true,
      },
      tx,
    });
  });

const invitationUserMatches = (
  user: {
    email: string;
    role: UserRole;
    status: "ACTIVE" | "DISABLED" | "INVITED";
  },
  invitation: { email: string; role: UserRole },
) =>
  user.email === invitation.email &&
  user.role === invitation.role &&
  user.status === "INVITED";

export const acceptInvitationAtomically = async ({
  passwordHash,
  tokenHash,
}: {
  passwordHash: string;
  tokenHash: string;
}) =>
  prisma.$transaction(async (tx) => {
    const now = new Date();
    const invitation = await tx.invitationToken.findUnique({
      select: {
        acceptedAt: true,
        email: true,
        expiresAt: true,
        id: true,
        role: true,
        userId: true,
      },
      where: { tokenHash },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now) {
      throw new AuthTransitionError("INVITATION_INVALID");
    }

    const tokenConsumption = await tx.invitationToken.updateMany({
      data: { acceptedAt: now },
      where: {
        acceptedAt: null,
        expiresAt: { gt: now },
        id: invitation.id,
        tokenHash,
      },
    });

    if (tokenConsumption.count !== 1) {
      throw new AuthTransitionError("INVITATION_INVALID");
    }

    const existingUser = invitation.userId
      ? await tx.user.findUnique({
          select: authUserSelect,
          where: { id: invitation.userId },
        })
      : await tx.user.findUnique({
          select: authUserSelect,
          where: { email: invitation.email },
        });

    let userId: string;

    if (existingUser) {
      if (!invitationUserMatches(existingUser, invitation)) {
        throw new AuthTransitionError("INVITATION_INVALID");
      }

      const userUpdate = await tx.user.updateMany({
        data: {
          passwordHash,
          status: "ACTIVE",
        },
        where: {
          email: invitation.email,
          id: existingUser.id,
          role: invitation.role,
          status: "INVITED",
        },
      });

      if (userUpdate.count !== 1) {
        throw new AuthTransitionError("INVITATION_INVALID");
      }

      userId = existingUser.id;
    } else {
      const createdUser = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: invitation.role,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      userId = createdUser.id;
    }

    await tx.session.updateMany({
      data: { revokedAt: now },
      where: {
        revokedAt: null,
        userId,
      },
    });
    await createAuditLog({
      action: "INVITATION_ACCEPTED",
      actorUserId: userId,
      entityId: userId,
      entityType: "User",
      metadata: {
        invitationId: invitation.id,
        sessionsRevoked: true,
      },
      tx,
    });

    const user = await tx.user.findUnique({
      select: authUserSelect,
      where: { id: userId },
    });

    if (!user) {
      throw new AuthTransitionError("INVITATION_INVALID");
    }

    return user;
  });
