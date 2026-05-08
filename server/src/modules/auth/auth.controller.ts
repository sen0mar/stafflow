import type { RequestHandler } from "express";

import { setCsrfCookie, clearCsrfCookie } from "../../core/auth/csrf.service";
import {
  clearSessionCookie,
  setSessionCookie,
} from "../../core/auth/session.service";
import type { ApiSuccess } from "../../core/types/api-response";
import type { PublicAuthUser } from "../../core/auth/auth.types";
import {
  acceptInvitationSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.schema";
import {
  acceptInvitation,
  changePassword,
  forgotPassword,
  login,
  logout,
  resetPassword,
} from "./auth.service";

interface AuthResponse {
  user: PublicAuthUser;
}

// Login sets both cookies but only returns the sanitized user payload.
export const loginController: RequestHandler = async (request, response) => {
  const { body } = loginSchema.parse({ body: request.body });
  const result = await login(body);

  setSessionCookie(response, result.token);
  setCsrfCookie(response);

  const responseBody: ApiSuccess<AuthResponse> = {
    data: {
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
  setCsrfCookie(response);

  const responseBody: ApiSuccess<AuthResponse> = {
    data: {
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

export const forgotPasswordController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = forgotPasswordSchema.parse({ body: request.body });
  const result = await forgotPassword(body);

  const responseBody: ApiSuccess<{ success: true }> = {
    data: result,
  };

  response.status(200).json(responseBody);
};

export const resetPasswordController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = resetPasswordSchema.parse({ body: request.body });
  const user = await resetPassword(body);

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
