import { AppError } from "../../core/errors/app-error";
import type { AuthContext } from "../../core/auth/auth.types";

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
