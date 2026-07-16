import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { requireDemoMutationAllowed } from "../../core/security/demo-read-only.middleware";
import {
  approveLeaveRequestController,
  cancelLeaveRequestController,
  createLeaveRequestController,
  createLeaveTypeController,
  deleteLeaveTypeController,
  getLeaveRequestController,
  listLeaveRequestsController,
  listLeaveTypesController,
  listSelfLeaveRequestsController,
  rejectLeaveRequestController,
  updateLeaveTypeController,
} from "./leave.controller";

export const createLeaveTypeRoutes = (): Router => {
  const router = Router();

  router.get("/", attachAuth, requireAuth, listLeaveTypesController);
  router.post(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("leave:types:manage"),
    requireCsrf,
    requireDemoMutationAllowed,
    createLeaveTypeController,
  );
  router.patch(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("leave:types:manage"),
    requireCsrf,
    requireDemoMutationAllowed,
    updateLeaveTypeController,
  );
  router.delete(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("leave:types:manage"),
    requireCsrf,
    requireDemoMutationAllowed,
    deleteLeaveTypeController,
  );

  return router;
};

export const createLeaveRequestRoutes = (): Router => {
  const router = Router();

  router.get(
    "/me",
    attachAuth,
    requireAuth,
    requirePermission("leave:read:self"),
    listSelfLeaveRequestsController,
  );
  router.post(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("leave:create:self"),
    requireCsrf,
    requireDemoMutationAllowed,
    createLeaveRequestController,
  );
  router.patch(
    "/:id/cancel",
    attachAuth,
    requireAuth,
    requirePermission("leave:create:self"),
    requireCsrf,
    requireDemoMutationAllowed,
    cancelLeaveRequestController,
  );
  router.get(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("leave:read:any"),
    listLeaveRequestsController,
  );
  router.get(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("leave:read:any"),
    getLeaveRequestController,
  );
  router.patch(
    "/:id/approve",
    attachAuth,
    requireAuth,
    requirePermission("leave:approve:any"),
    requireCsrf,
    requireDemoMutationAllowed,
    approveLeaveRequestController,
  );
  router.patch(
    "/:id/reject",
    attachAuth,
    requireAuth,
    requirePermission("leave:reject:any"),
    requireCsrf,
    requireDemoMutationAllowed,
    rejectLeaveRequestController,
  );

  return router;
};
