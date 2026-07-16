import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { requireDemoMutationAllowed } from "../../core/security/demo-read-only.middleware";
import {
  createEmployeeController,
  disableEmployeeController,
  getEmployeeController,
  getSelfEmployeeController,
  listEmployeeInvitationsController,
  listEmployeesController,
  regenerateEmployeeInvitationController,
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
    requireDemoMutationAllowed,
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
    "/invitations",
    attachAuth,
    requireAuth,
    requirePermission("employees:read:any"),
    listEmployeeInvitationsController,
  );
  router.post(
    "/:id/invitation",
    attachAuth,
    requireAuth,
    requirePermission("employees:update:any"),
    requireCsrf,
    requireDemoMutationAllowed,
    regenerateEmployeeInvitationController,
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
    requireDemoMutationAllowed,
    createEmployeeController,
  );
  router.patch(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("employees:update:any"),
    requireCsrf,
    requireDemoMutationAllowed,
    updateEmployeeController,
  );
  router.patch(
    "/:id/status",
    attachAuth,
    requireAuth,
    requirePermission("employees:update:any"),
    requireCsrf,
    requireDemoMutationAllowed,
    updateEmployeeStatusController,
  );
  router.delete(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("employees:delete"),
    requireCsrf,
    requireDemoMutationAllowed,
    disableEmployeeController,
  );

  return router;
};
