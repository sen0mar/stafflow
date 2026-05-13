import { Prisma } from "@prisma/client";

import { AppError } from "../../core/errors/app-error";
import type { UpdateUserAccountInput } from "./users.schema";
import {
  createUserAuditLog,
  findUserAccountById,
  publicUserSelect,
  revokeUserAccountSessions,
  updateUserAccount,
} from "./users.repository";

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

export const toPublicUserDto = (user: {
  createdAt: Date;
  email: string;
  id: string;
  lastLoginAt: Date | null;
  role: "ADMIN" | "EMPLOYEE";
  status: "ACTIVE" | "DISABLED" | "INVITED";
  updatedAt: Date;
}) => ({
  createdAt: user.createdAt.toISOString(),
  email: user.email,
  id: user.id,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  role: user.role,
  status: user.status,
  updatedAt: user.updatedAt.toISOString(),
});

export const assertUserAccountExists = async (id: string) => {
  const user = await findUserAccountById(id);

  if (!user) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      message: "User account was not found.",
      statusCode: 404,
    });
  }

  return user;
};

const isMissingRecordError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2025";

export const updateExistingUserAccount = async (
  id: string,
  input: UpdateUserAccountInput,
  auditContext: AuditContext,
) => {
  const currentUser = await assertUserAccountExists(id);

  try {
    const user = await updateUserAccount({
      id,
      role: input.role,
      status: input.status,
    });

    if (input.status === "DISABLED" && currentUser.status !== "DISABLED") {
      await revokeUserAccountSessions(id);
    }

    if (input.role !== undefined && input.role !== currentUser.role) {
      await createUserAuditLog({
        ...auditContext,
        action: "USER_ROLE_CHANGED",
        entityId: id,
        metadata: {
          from: currentUser.role,
          to: input.role,
        },
      });
    }

    if (input.status !== undefined && input.status !== currentUser.status) {
      await createUserAuditLog({
        ...auditContext,
        action: "USER_STATUS_CHANGED",
        entityId: id,
        metadata: {
          from: currentUser.status,
          to: input.status,
        },
      });
    }

    return toPublicUserDto(user);
  } catch (error) {
    if (isMissingRecordError(error)) {
      throw new AppError({
        code: "USER_NOT_FOUND",
        message: "User account was not found.",
        statusCode: 404,
      });
    }

    throw error;
  }
};

export const userSelectForTransactions = publicUserSelect;
