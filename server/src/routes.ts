import { Router } from "express";

import type { ApiSuccess } from "./core/types/api-response";
import { createAuthRoutes } from "./modules/auth/auth.routes";
import { createDashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { createDepartmentRoutes } from "./modules/departments/departments.routes";
import { createEmployeeRoutes } from "./modules/employees/employees.routes";
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
  router.use("/dashboard", createDashboardRoutes());
  router.use("/departments", createDepartmentRoutes());
  router.use("/employees", createEmployeeRoutes());
  router.use("/users", createUserRoutes());

  return router;
};
