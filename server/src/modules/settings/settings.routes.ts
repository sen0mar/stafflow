import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { requireDemoMutationAllowed } from "../../core/security/demo-read-only.middleware";
import {
  getAttendanceSettingsController,
  getCompanySettingsController,
  getLeaveSettingsController,
  updateAttendanceSettingsController,
  updateCompanySettingsController,
  updateLeaveSettingsController,
} from "./settings.controller";

export const createSettingsRoutes = (): Router => {
  const router = Router();
  const requireSettingsAccess = requirePermission("settings:manage");

  router.get(
    "/company",
    attachAuth,
    requireAuth,
    requireSettingsAccess,
    getCompanySettingsController,
  );
  router.patch(
    "/company",
    attachAuth,
    requireAuth,
    requireSettingsAccess,
    requireCsrf,
    requireDemoMutationAllowed,
    updateCompanySettingsController,
  );
  router.get(
    "/attendance",
    attachAuth,
    requireAuth,
    requireSettingsAccess,
    getAttendanceSettingsController,
  );
  router.patch(
    "/attendance",
    attachAuth,
    requireAuth,
    requireSettingsAccess,
    requireCsrf,
    requireDemoMutationAllowed,
    updateAttendanceSettingsController,
  );
  router.get(
    "/leave",
    attachAuth,
    requireAuth,
    requireSettingsAccess,
    getLeaveSettingsController,
  );
  router.patch(
    "/leave",
    attachAuth,
    requireAuth,
    requireSettingsAccess,
    requireCsrf,
    requireDemoMutationAllowed,
    updateLeaveSettingsController,
  );

  return router;
};
