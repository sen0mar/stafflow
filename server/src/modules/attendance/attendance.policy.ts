import { AppError } from "../../core/errors/app-error";
import type { AuthContext } from "../../core/auth/auth.types";
import { hasPermission } from "../../core/auth/permissions";

export const getSelfAttendanceEmployeeId = (auth: AuthContext): string => {
  if (!auth.employeeId) {
    throw new AppError({
      code: "EMPLOYEE_PROFILE_REQUIRED",
      message: "An employee profile is required for attendance actions.",
      statusCode: 403,
    });
  }

  return auth.employeeId;
};

export const canReadAttendanceForEmployee = (
  auth: AuthContext,
  targetEmployeeId: string,
): boolean =>
  hasPermission(auth.permissions, "attendance:read:any") ||
  (hasPermission(auth.permissions, "attendance:read:self") &&
    auth.employeeId === targetEmployeeId);

export const canClockSelfAttendance = (
  auth: AuthContext,
  targetEmployeeId: string,
): boolean =>
  hasPermission(auth.permissions, "attendance:clock:self") &&
  auth.employeeId === targetEmployeeId;

export const canUpdateAnyAttendance = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "attendance:update:any");
