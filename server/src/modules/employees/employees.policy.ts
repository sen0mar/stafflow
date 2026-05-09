import { AppError } from "../../core/errors/app-error";
import type { AuthContext } from "../../core/auth/auth.types";
import { hasPermission } from "../../core/auth/permissions";

export const requireSelfEmployeeId = (auth: AuthContext): string => {
  if (!auth.employeeId) {
    throw new AppError({
      code: "EMPLOYEE_PROFILE_REQUIRED",
      message: "An employee profile is required for this action.",
      statusCode: 403,
    });
  }

  return auth.employeeId;
};

export const canReadEmployee = (
  auth: AuthContext,
  targetEmployeeId: string,
): boolean =>
  hasPermission(auth.permissions, "employees:read:any") ||
  (hasPermission(auth.permissions, "profile:read:self") &&
    auth.employeeId === targetEmployeeId);

export const canUpdateEmployee = (
  auth: AuthContext,
  targetEmployeeId: string,
): boolean =>
  hasPermission(auth.permissions, "employees:update:any") ||
  (hasPermission(auth.permissions, "profile:update:self") &&
    auth.employeeId === targetEmployeeId);

export const canCreateEmployees = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "employees:create");

export const canDeleteEmployees = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "employees:delete");
