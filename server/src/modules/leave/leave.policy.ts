import { AppError } from "../../core/errors/app-error";
import type { AuthContext } from "../../core/auth/auth.types";
import { hasPermission } from "../../core/auth/permissions";

export const getSelfLeaveEmployeeId = (auth: AuthContext): string => {
  if (!auth.employeeId) {
    throw new AppError({
      code: "EMPLOYEE_PROFILE_REQUIRED",
      message: "An employee profile is required for leave actions.",
      statusCode: 403,
    });
  }

  return auth.employeeId;
};

export const canCreateLeaveForSelf = (
  auth: AuthContext,
  targetEmployeeId: string,
): boolean =>
  hasPermission(auth.permissions, "leave:create:self") &&
  auth.employeeId === targetEmployeeId;

export const canReadLeaveForEmployee = (
  auth: AuthContext,
  targetEmployeeId: string,
): boolean =>
  hasPermission(auth.permissions, "leave:read:any") ||
  (hasPermission(auth.permissions, "leave:read:self") &&
    auth.employeeId === targetEmployeeId);

export const canApproveAnyLeave = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "leave:approve:any");

export const canRejectAnyLeave = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "leave:reject:any");
