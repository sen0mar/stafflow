import { AppError } from "../../core/errors/app-error";
import type { AuthContext } from "../../core/auth/auth.types";
import { hasPermission } from "../../core/auth/permissions";

export const getSelfPayslipEmployeeId = (auth: AuthContext): string => {
  if (!auth.employeeId) {
    throw new AppError({
      code: "EMPLOYEE_PROFILE_REQUIRED",
      message: "An employee profile is required for payslip actions.",
      statusCode: 403,
    });
  }

  return auth.employeeId;
};

export const canReadPayslipForEmployee = (
  auth: AuthContext,
  targetEmployeeId: string,
): boolean =>
  hasPermission(auth.permissions, "payslips:read:any") ||
  (hasPermission(auth.permissions, "payslips:read:self") &&
    auth.employeeId === targetEmployeeId);

export const canUploadPayslips = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "payslips:upload");

export const canDeletePayslips = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "payslips:delete");
