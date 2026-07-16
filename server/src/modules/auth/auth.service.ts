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
import type {
  AcceptInvitationInput,
  ChangePasswordInput,
  LoginInput,
} from "./auth.schema";
import {
  acceptInvitationAtomically,
  AuthTransitionError,
  changePasswordAtomically,
  createLoginSessionAtomically,
  findUserByEmailForAuth,
  findUserByIdForAuth,
  revokeSession,
} from "./auth.repository";

const demoSessionLimitPerUser = 100;
// Fixed cost-12 hash used only to keep missing-user logins on the same bcrypt
// verification path as bad-password logins. It is not a credential.
const dummyPasswordHash =
  "$2b$12$ucEMJzebu4xs6MrPsO8UJOQ5fTYPni.PaUs7h7sVX5O2FDV7E9B4i";

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

const protectedDemoEmails = new Set([
  "admin.demo@example.com",
  "employee.demo@example.com",
]);

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
    await verifyPassword(input.password, dummyPasswordHash);
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

  await createLoginSessionAtomically({
    demoSessionLimit: env.DEMO_MODE ? demoSessionLimitPerUser : null,
    expiresAt: getSessionExpiresAt(),
    loggedInAt: new Date(),
    tokenHash,
    userId: user.id,
  });

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

  try {
    await changePasswordAtomically({
      auditContext,
      currentPasswordHash: user.passwordHash,
      passwordHash,
      userId,
    });
  } catch (error) {
    if (
      error instanceof AuthTransitionError &&
      error.reason === "PASSWORD_CHANGED"
    ) {
      throw new AppError({
        code: "PASSWORD_CHANGE_CONFLICT",
        message: "The password changed before this request completed.",
        statusCode: 409,
      });
    }

    throw error;
  }

  return toPublicAuthUser(user);
};

export const acceptInvitation = async ({
  password,
  token,
}: AcceptInvitationInput) => {
  validatePasswordConstraints(password);

  const passwordHash = await hashPassword(password);

  try {
    const user = await acceptInvitationAtomically({
      passwordHash,
      tokenHash: hashSessionToken(token),
    });

    return toPublicAuthUser(user);
  } catch (error) {
    if (
      error instanceof AuthTransitionError &&
      error.reason === "INVITATION_INVALID"
    ) {
      throw invalidTokenError();
    }

    throw error;
  }
};
