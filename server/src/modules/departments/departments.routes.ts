import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { requireDemoMutationAllowed } from "../../core/security/demo-read-only.middleware";
import {
  createDepartmentController,
  deleteDepartmentController,
  getDepartmentController,
  listDepartmentsController,
  updateDepartmentController,
} from "./departments.controller";

export const createDepartmentRoutes = (): Router => {
  const router = Router();

  router.get(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("departments:read"),
    listDepartmentsController,
  );
  router.get(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("departments:read"),
    getDepartmentController,
  );
  router.post(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("departments:manage"),
    requireCsrf,
    requireDemoMutationAllowed,
    createDepartmentController,
  );
  router.patch(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("departments:manage"),
    requireCsrf,
    requireDemoMutationAllowed,
    updateDepartmentController,
  );
  router.delete(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("departments:manage"),
    requireCsrf,
    requireDemoMutationAllowed,
    deleteDepartmentController,
  );

  return router;
};
