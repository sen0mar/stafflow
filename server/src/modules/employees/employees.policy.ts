import { AppError } from "../../core/errors/app-error";
import type { AuthContext } from "../../core/auth/auth.types";

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
