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
import type { PublicAuthUser } from "../../core/auth/auth.types";
import type { ChangePasswordInput, LoginInput } from "./auth.schema";
import {
  createSession,
  findUserByEmailForAuth,
  findUserByIdForAuth,
  revokeOtherUserSessions,
  revokeSession,
  updateLastLoginAt,
  updatePasswordHash,
} from "./auth.repository";

// Use the same response for missing users and bad passwords to avoid enumeration.
const invalidCredentialsError = () =>
  new AppError({
    code: "INVALID_CREDENTIALS",
    message: "Email or password is incorrect.",
    statusCode: 401,
  });

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

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

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
  await updateLastLoginAt(user.id);

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
  currentSessionId,
  newPassword,
  userId,
}: ChangePasswordInput & {
  currentSessionId: string;
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

  const passwordMatches = await verifyPassword(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError({
      code: "CURRENT_PASSWORD_INVALID",
      message: "Current password is incorrect.",
      statusCode: 401,
    });
  }

  const passwordHash = await hashPassword(newPassword);

  await updatePasswordHash({ passwordHash, userId });
  await revokeOtherUserSessions({ currentSessionId, userId });

  return toPublicAuthUser(user);
};
