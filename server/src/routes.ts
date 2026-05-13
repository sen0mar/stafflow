import { Router } from "express";

import type { ApiSuccess } from "./core/types/api-response";
import { createAuditLogRoutes } from "./modules/audit-logs/audit-logs.routes";
import { createAttendanceRoutes } from "./modules/attendance/attendance.routes";
import { createAuthRoutes } from "./modules/auth/auth.routes";
import { createDashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { createDepartmentRoutes } from "./modules/departments/departments.routes";
import { createEmployeeRoutes } from "./modules/employees/employees.routes";
import {
  createLeaveRequestRoutes,
  createLeaveTypeRoutes,
} from "./modules/leave/leave.routes";
import { createPayslipRoutes } from "./modules/payslips/payslips.routes";
import { createSettingsRoutes } from "./modules/settings/settings.routes";
import { createUserRoutes } from "./modules/users/users.routes";

interface HealthResponse {
  status: "ok";
}

export const createRoutes = (): Router => {
  const router = Router();

  router.get("/health", (_request, response) => {
    const responseBody: ApiSuccess<HealthResponse> = {
      data: { status: "ok" },
    };

    response.status(200).json(responseBody);
  });

  router.use("/auth", createAuthRoutes());
  router.use("/audit-logs", createAuditLogRoutes());
  router.use("/attendance", createAttendanceRoutes());
  router.use("/dashboard", createDashboardRoutes());
  router.use("/departments", createDepartmentRoutes());
  router.use("/employees", createEmployeeRoutes());
  router.use("/leave-requests", createLeaveRequestRoutes());
  router.use("/leave-types", createLeaveTypeRoutes());
  router.use("/payslips", createPayslipRoutes());
  router.use("/settings", createSettingsRoutes());
  router.use("/users", createUserRoutes());

  return router;
};
