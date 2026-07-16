import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { requireDemoMutationAllowed } from "../../core/security/demo-read-only.middleware";
import {
  clockInController,
  clockOutController,
  getAttendanceController,
  getSelfTodayAttendanceController,
  listAttendanceController,
  listSelfAttendanceController,
  updateAttendanceController,
} from "./attendance.controller";

export const createAttendanceRoutes = (): Router => {
  const router = Router();

  router.get(
    "/me/today",
    attachAuth,
    requireAuth,
    requirePermission("attendance:read:self"),
    getSelfTodayAttendanceController,
  );
  router.get(
    "/me/history",
    attachAuth,
    requireAuth,
    requirePermission("attendance:read:self"),
    listSelfAttendanceController,
  );
  router.post(
    "/clock-in",
    attachAuth,
    requireAuth,
    requirePermission("attendance:clock:self"),
    requireCsrf,
    requireDemoMutationAllowed,
    clockInController,
  );
  router.post(
    "/clock-out",
    attachAuth,
    requireAuth,
    requirePermission("attendance:clock:self"),
    requireCsrf,
    requireDemoMutationAllowed,
    clockOutController,
  );
  router.get(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("attendance:read:any"),
    listAttendanceController,
  );
  router.get(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("attendance:read:any"),
    getAttendanceController,
  );
  router.patch(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("attendance:update:any"),
    requireCsrf,
    requireDemoMutationAllowed,
    updateAttendanceController,
  );

  return router;
};
