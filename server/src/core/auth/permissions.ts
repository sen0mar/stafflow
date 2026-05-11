import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../errors/app-error";

export type Permission =
  | "dashboard:read:admin"
  | "dashboard:read:self"
  | "employees:read:any"
  | "employees:create"
  | "employees:update:any"
  | "employees:delete"
  | "departments:read"
  | "departments:manage"
  | "attendance:read:any"
  | "attendance:update:any"
  | "leave:read:any"
  | "leave:approve:any"
  | "leave:reject:any"
  | "payslips:read:any"
  | "payslips:upload"
  | "payslips:delete"
  | "settings:manage"
  | "auditLogs:read"
  | "profile:read:self"
  | "profile:update:self"
  | "attendance:read:self"
  | "attendance:clock:self"
  | "leave:create:self"
  | "leave:read:self"
  | "payslips:read:self";

export const rolePermissions = {
  ADMIN: [
    "dashboard:read:admin",
    "employees:read:any",
    "employees:create",
    "employees:update:any",
    "employees:delete",
    "departments:read",
    "departments:manage",
    "attendance:read:any",
    "attendance:update:any",
    "leave:read:any",
    "leave:approve:any",
    "leave:reject:any",
    "payslips:read:any",
    "payslips:upload",
    "payslips:delete",
    "settings:manage",
    "auditLogs:read",
  ],
  EMPLOYEE: [
    "dashboard:read:self",
    "departments:read",
    "profile:read:self",
    "profile:update:self",
    "attendance:read:self",
    "attendance:clock:self",
    "leave:create:self",
    "leave:read:self",
    "payslips:read:self",
  ],
} as const satisfies Record<UserRole, readonly Permission[]>;

export const hasPermission = (
  permissions: readonly Permission[],
  requiredPermission: Permission,
) => permissions.includes(requiredPermission);

export const getRolePermissions = (role: UserRole): Permission[] => [
  ...rolePermissions[role],
];

export const requirePermission =
  (permission: Permission): RequestHandler =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth) {
      throw new AppError({
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
        statusCode: 401,
      });
    }

    if (!hasPermission(request.auth.permissions, permission)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
        statusCode: 403,
      });
    }

    next();
  };
