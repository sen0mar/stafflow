import type { Prisma, UserRole, UserStatus } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";

export const publicUserSelect = {
  createdAt: true,
  email: true,
  id: true,
  lastLoginAt: true,
  role: true,
  status: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const findUserAccountById = (id: string) =>
  prisma.user.findUnique({
    select: publicUserSelect,
    where: { id },
  });

export const findUserAccountByEmail = (email: string) =>
  prisma.user.findUnique({
    select: {
      id: true,
      email: true,
    },
    where: { email },
  });

export const updateUserAccount = ({
  id,
  role,
  status,
}: {
  id: string;
  role?: UserRole;
  status?: UserStatus;
}) =>
  prisma.user.update({
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(status !== undefined ? { status } : {}),
    },
    select: publicUserSelect,
    where: { id },
  });

export const revokeUserAccountSessions = (userId: string) =>
  prisma.session.updateMany({
    data: {
      revokedAt: new Date(),
    },
    where: {
      revokedAt: null,
      userId,
    },
  });

export const createUserAuditLog = ({
  action,
  actorUserId,
  entityId,
  ipAddress,
  metadata,
  userAgent,
}: {
  action: string;
  actorUserId: string | null;
  entityId: string | null;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
  userAgent?: string;
}) =>
  prisma.auditLog.create({
    data: {
      action,
      actorUserId,
      entityId,
      entityType: "User",
      ipAddress,
      metadata,
      userAgent,
    },
    select: {
      id: true,
    },
  });

export type PublicUserRecord = NonNullable<
  Awaited<ReturnType<typeof findUserAccountById>>
>;
