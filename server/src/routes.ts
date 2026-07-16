import { Router } from "express";

import { checkDatabaseConnection } from "./prisma/prisma.client";
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

interface HealthResponse {
  status: "ok";
}

interface ReadinessResponse {
  status: "not_ready" | "ready";
}

interface RouteDependencies {
  checkDatabase?: () => Promise<void>;
  readinessTimeoutMs?: number;
}

export const DEFAULT_READINESS_TIMEOUT_MS = 1_000;

const checkReadiness = async (
  checkDatabase: () => Promise<void>,
  timeoutMs: number,
) => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      checkDatabase(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Readiness check timed out")),
          timeoutMs,
        );
        timeout.unref();
      }),
    ]);

    return true;
  } catch {
    return false;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export const createRoutes = ({
  checkDatabase = checkDatabaseConnection,
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS,
}: RouteDependencies = {}): Router => {
  const router = Router();

  router.get("/health", (_request, response) => {
    const responseBody: ApiSuccess<HealthResponse> = {
      data: { status: "ok" },
    };

    response.status(200).json(responseBody);
  });

  router.get("/ready", async (_request, response) => {
    const ready = await checkReadiness(checkDatabase, readinessTimeoutMs);
    const responseBody: ApiSuccess<ReadinessResponse> = {
      data: { status: ready ? "ready" : "not_ready" },
    };

    response.status(ready ? 200 : 503).json(responseBody);
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

  return router;
};
