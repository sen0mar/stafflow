import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requirePermission } from "../../core/auth/permissions";
import {
  adminDashboardSummaryController,
  employeeDashboardSummaryController,
} from "./dashboard.controller";

export const createDashboardRoutes = (): Router => {
  const router = Router();

  router.get(
    "/admin-summary",
    attachAuth,
    requireAuth,
    requirePermission("dashboard:read:admin"),
    adminDashboardSummaryController,
  );
  router.get(
    "/me",
    attachAuth,
    requireAuth,
    requirePermission("dashboard:read:self"),
    employeeDashboardSummaryController,
  );

  return router;
};
