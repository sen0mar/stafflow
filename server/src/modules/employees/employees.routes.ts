import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { requireDemoAccountMutationAllowed } from "../../core/security/demo-account.guard";
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
    requireDemoAccountMutationAllowed,
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
    requireDemoAccountMutationAllowed,
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
    requireDemoAccountMutationAllowed,
    updateEmployeeStatusController,
  );
  router.delete(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("employees:delete"),
    requireCsrf,
    requireDemoAccountMutationAllowed,
    disableEmployeeController,
  );

  return router;
};
