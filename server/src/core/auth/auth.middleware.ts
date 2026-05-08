import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../errors/app-error";
import { prisma } from "../../prisma/prisma.client";
import type { Permission } from "./auth.types";
import { hashSessionToken, sessionCookieName } from "./session.service";

const rolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    "audit-logs:read",
    "attendance:manage",
    "attendance:self",
    "departments:manage",
    "employees:manage",
    "leave:manage",
    "leave:self",
    "payslips:manage",
    "payslips:self",
    "settings:manage",
  ],
  EMPLOYEE: ["attendance:self", "leave:self", "payslips:self"],
};

// Attach auth when a valid active session exists, but let public routes continue.
export const attachAuth: RequestHandler = async (request, _response, next) => {
  const rawToken = request.cookies?.[sessionCookieName];

  if (typeof rawToken !== "string") {
    next();
    return;
  }

  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  // Match by hashed token and active user so disabled accounts lose access fast.
  const session = await prisma.session.findFirst({
    where: {
      expiresAt: { gt: now },
      revokedAt: null,
      tokenHash,
      user: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (session) {
    const employeeId = session.user.employee?.id ?? null;

    // Downstream routes should rely on this server-derived identity only.
    request.auth = {
      employeeId,
      permissions: rolePermissions[session.user.role] ?? [],
      role: session.user.role,
      sessionId: session.id,
      userId: session.user.id,
      user: {
        email: session.user.email,
        employee: session.user.employee,
        employeeId,
        id: session.user.id,
        role: session.user.role,
        status: session.user.status,
      },
    };
  }

  next();
};

// Protected routes use this after attachAuth to enforce a real authenticated user.
export const requireAuth = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if (!request.auth) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
      statusCode: 401,
    });
  }

  next();
};
