import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import {
  createEmployeeController,
  disableEmployeeController,
  getEmployeeController,
  getSelfEmployeeController,
  listEmployeesController,
  updateEmployeeController,
  updateEmployeeStatusController,
  updateSelfProfileController,
} from "./employees.controller";

export const createEmployeeRoutes = (): Router => {
  const router = Router();

  router.get(
    "/me",
    attachAuth,
    requireAuth,
    requirePermission("profile:read:self"),
    getSelfEmployeeController,
  );
  router.patch(
    "/me/profile",
    attachAuth,
    requireAuth,
    requirePermission("profile:update:self"),
    requireCsrf,
    updateSelfProfileController,
  );
  router.get(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("employees:read:any"),
    listEmployeesController,
  );
  router.get(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("employees:read:any"),
    getEmployeeController,
  );
  router.post(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("employees:create"),
    requireCsrf,
    createEmployeeController,
  );
  router.patch(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("employees:update:any"),
    requireCsrf,
    updateEmployeeController,
  );
  router.patch(
    "/:id/status",
    attachAuth,
    requireAuth,
    requirePermission("employees:update:any"),
    requireCsrf,
    updateEmployeeStatusController,
  );
  router.delete(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("employees:delete"),
    requireCsrf,
    disableEmployeeController,
  );

  return router;
};
