import type { RequestHandler } from "express";

import { env } from "../../config/env";
import { setCsrfCookie, clearCsrfCookie } from "../../core/auth/csrf.service";
import {
  clearSessionCookie,
  setSessionCookie,
} from "../../core/auth/session.service";
import { AppError } from "../../core/errors/app-error";
import { markExpectedAuthFailure } from "../../core/logger/expected-auth-failure";
import { logger } from "../../core/logger/logger";
import type { ApiSuccess } from "../../core/types/api-response";
import type { PublicAuthUser } from "../../core/auth/auth.types";
import {
  acceptInvitationSchema,
  changePasswordSchema,
  loginSchema,
} from "./auth.schema";
import {
  acceptInvitation,
  changePassword,
  login,
  logout,
} from "./auth.service";

interface AuthResponse {
  csrfToken?: string;
  user: PublicAuthUser;
}

export const authConfigController: RequestHandler = (_request, response) => {
  const responseBody: ApiSuccess<{ demoMode: boolean }> = {
    data: { demoMode: env.DEMO_MODE },
  };

  response.status(200).json(responseBody);
};

const failedLoginCodes = new Set(["ACCOUNT_NOT_ACTIVE", "INVALID_CREDENTIALS"]);

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

// Login sets both cookies but only returns the sanitized user payload.
export const loginController: RequestHandler = async (request, response) => {
  const { body } = loginSchema.parse({ body: request.body });
  let result: Awaited<ReturnType<typeof login>>;

  try {
    result = await login(body);
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code !== undefined &&
      failedLoginCodes.has(error.code)
    ) {
      markExpectedAuthFailure(request, response);
      logger.warn(
        {
          email: body.email,
          ip: request.ip,
          reason: error.code,
          requestId: response.locals.requestId,
          userAgent: request.get("user-agent"),
        },
        "Login attempt failed",
      );
    }

    throw error;
  }

  setSessionCookie(response, result.token);
  const csrfToken = setCsrfCookie(response);

  const responseBody: ApiSuccess<AuthResponse> = {
    data: {
      csrfToken,
      user: result.user,
    },
  };

  response.status(200).json(responseBody);
};

// Logout is a state-changing cookie-authenticated action, so it requires CSRF.
export const logoutController: RequestHandler = async (request, response) => {
  await logout(request.auth?.sessionId ?? "");
  clearSessionCookie(response);
  clearCsrfCookie(response);

  const responseBody: ApiSuccess<{ success: true }> = {
    data: {
      success: true,
    },
  };

  response.status(200).json(responseBody);
};

// /me doubles as a lightweight way for the frontend to refresh its CSRF cookie.
export const meController: RequestHandler = async (request, response) => {
  const csrfToken = setCsrfCookie(response);

  const responseBody: ApiSuccess<AuthResponse> = {
    data: {
      csrfToken,
      user: {
        email: request.auth?.user.email ?? "",
        employee: request.auth?.user.employee ?? null,
        id: request.auth?.user.id ?? "",
        role: request.auth?.user.role ?? "EMPLOYEE",
        status: request.auth?.user.status ?? "ACTIVE",
      },
    },
  };

  response.status(200).json(responseBody);
};

export const changePasswordController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = changePasswordSchema.parse({ body: request.body });
  const user = await changePassword({
    ...body,
    auditContext: getAuditContext(request),
    userId: request.auth?.userId ?? "",
  });

  clearSessionCookie(response);
  clearCsrfCookie(response);

  const responseBody: ApiSuccess<AuthResponse> = {
    data: {
      user,
    },
  };

  response.status(200).json(responseBody);
};

export const acceptInvitationController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = acceptInvitationSchema.parse({ body: request.body });
  const user = await acceptInvitation(body);

  clearSessionCookie(response);
  clearCsrfCookie(response);

  const responseBody: ApiSuccess<AuthResponse> = {
    data: {
      user,
    },
  };

  response.status(200).json(responseBody);
};
