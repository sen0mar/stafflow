import { AppError } from "../../core/errors/app-error";
import type { AuthContext } from "../../core/auth/auth.types";

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
