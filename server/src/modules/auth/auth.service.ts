import { AppError } from "../../core/errors/app-error";
import {
  getSessionExpiresAt,
  createSessionToken,
  hashSessionToken,
} from "../../core/auth/session.service";
import {
  hashPassword,
  validatePasswordConstraints,
  verifyPassword,
} from "../../core/auth/password.service";
import { env } from "../../config/env";
import type { PublicAuthUser } from "../../core/auth/auth.types";
import { createAuditLog } from "../audit-logs/audit-log.service";
import type {
  AcceptInvitationInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from "./auth.schema";
import {
  acceptInvitationToken,
  createInvitedUserForAcceptedInvitation,
  createPasswordResetToken,
  createSession,
  findActiveUserByEmail,
  findUserByEmailForAuth,
  findUserByIdForAuth,
  findValidInvitationToken,
  findValidPasswordResetToken,
  markInvitationTokenAccepted,
  markPasswordResetTokenUsed,
  revokeSession,
  revokeUserSessions,
  updateLastLoginAt,
  pruneUserSessions,
  updatePasswordHash,
} from "./auth.repository";

const demoSessionLimitPerUser = 100;

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

// Use the same response for missing users and bad passwords to avoid enumeration.
const invalidCredentialsError = () =>
  new AppError({
    code: "INVALID_CREDENTIALS",
    message: "Email or password is incorrect.",
    statusCode: 401,
  });

const invalidTokenError = () =>
  new AppError({
    code: "INVALID_OR_EXPIRED_TOKEN",
    message: "This token is invalid or has expired.",
    statusCode: 400,
  });

const passwordResetTtlMs = 60 * 60 * 1000;
const protectedDemoEmails = new Set([
  "admin.demo@example.com",
  "employee.demo@example.com",
]);

const getExpiresAt = (ttlMs: number) => new Date(Date.now() + ttlMs);

// Strip service-only fields such as passwordHash before returning API data.
const toPublicAuthUser = (user: {
  id: string;
  email: string;
  role: PublicAuthUser["role"];
  status: PublicAuthUser["status"];
  employee: PublicAuthUser["employee"];
}): PublicAuthUser => ({
  email: user.email,
  employee: user.employee,
  id: user.id,
  role: user.role,
  status: user.status,
});

// Authenticate credentials, create a hashed DB session, and return the raw token
// only to the controller so it can be placed in an HTTP-only cookie.
export const login = async (input: LoginInput) => {
  const user = await findUserByEmailForAuth(input.email);

  if (!user) {
    throw invalidCredentialsError();
  }

  const passwordMatches = await verifyPassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw invalidCredentialsError();
  }

  if (user.status !== "ACTIVE") {
    throw new AppError({
      code: "ACCOUNT_NOT_ACTIVE",
      message: "This account is not active.",
      statusCode: 403,
    });
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);

  await createSession({
    expiresAt: getSessionExpiresAt(),
    tokenHash,
    userId: user.id,
  });
  if (env.DEMO_MODE) {
    await pruneUserSessions({ keep: demoSessionLimitPerUser, userId: user.id });
  } else {
    await updateLastLoginAt(user.id);
  }

  return {
    token,
    user: toPublicAuthUser(user),
  };
};

// Logout invalidates the server-side session before the cookie is cleared.
export const logout = async (sessionId: string) => {
  await revokeSession(sessionId);
};

// Changing a password requires the old password and writes a fresh hash.
export const changePassword = async ({
  currentPassword,
  newPassword,
  userId,
  auditContext,
}: ChangePasswordInput & {
  auditContext: AuditContext;
  userId: string;
}) => {
  validatePasswordConstraints(newPassword);

  const user = await findUserByIdForAuth(userId);

  if (!user || user.status !== "ACTIVE") {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
      statusCode: 401,
    });
  }

  const passwordMatches = await verifyPassword(
    currentPassword,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError({
      code: "CURRENT_PASSWORD_INVALID",
      message: "Current password is incorrect.",
      statusCode: 401,
    });
  }

  if (env.DEMO_MODE && protectedDemoEmails.has(user.email)) {
    throw new AppError({
      code: "DEMO_ACCOUNT_PROTECTED",
      message: "Password changes are disabled for demo accounts.",
      statusCode: 403,
    });
  }

  const passwordHash = await hashPassword(newPassword);

  await updatePasswordHash({ passwordHash, userId });
  await revokeUserSessions(userId);
  await createAuditLog({
    ...auditContext,
    action: "PASSWORD_CHANGED",
    actorUserId: userId,
    entityId: userId,
    entityType: "User",
    metadata: {
      sessionsRevoked: true,
    },
  });

  return toPublicAuthUser(user);
};

// Password reset request is enumeration-safe. Email delivery can use the stored
// token later without changing the public API shape.
export const forgotPassword = async ({ email }: ForgotPasswordInput) => {
  const user = await findActiveUserByEmail(email);

  if (user) {
    const token = createSessionToken();

    await createPasswordResetToken({
      expiresAt: getExpiresAt(passwordResetTtlMs),
      tokenHash: hashSessionToken(token),
      userId: user.id,
    });
  }

  return { success: true as const };
};

export const resetPassword = async ({
  newPassword,
  token,
  auditContext,
}: ResetPasswordInput & {
  auditContext: AuditContext;
}) => {
  validatePasswordConstraints(newPassword);

  const resetToken = await findValidPasswordResetToken(hashSessionToken(token));

  if (!resetToken) {
    throw invalidTokenError();
  }

  const passwordHash = await hashPassword(newPassword);

  await updatePasswordHash({ passwordHash, userId: resetToken.userId });
  await markPasswordResetTokenUsed(resetToken.id);
  await revokeUserSessions(resetToken.userId);
  await createAuditLog({
    ...auditContext,
    action: "PASSWORD_RESET_COMPLETED",
    actorUserId: null,
    entityId: resetToken.userId,
    entityType: "User",
    metadata: {
      sessionsRevoked: true,
    },
  });

  return toPublicAuthUser(resetToken.user);
};

export const acceptInvitation = async ({
  password,
  token,
}: AcceptInvitationInput) => {
  validatePasswordConstraints(password);

  const invitation = await findValidInvitationToken(hashSessionToken(token));

  if (!invitation) {
    throw invalidTokenError();
  }

  const passwordHash = await hashPassword(password);
  const existingUser =
    invitation.user ?? (await findUserByEmailForAuth(invitation.email));
  const user =
    existingUser ??
    (await createInvitedUserForAcceptedInvitation({
      email: invitation.email,
      passwordHash,
      role: invitation.role,
    }));

  if (existingUser) {
    await acceptInvitationToken({
      passwordHash,
      tokenId: invitation.id,
      userId: existingUser.id,
    });
  } else {
    await markInvitationTokenAccepted(invitation.id);
  }

  await revokeUserSessions(user.id);

  return toPublicAuthUser({
    ...user,
    status: "ACTIVE",
  });
};
