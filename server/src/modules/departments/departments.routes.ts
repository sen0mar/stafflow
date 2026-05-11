import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
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
    createDepartmentController,
  );
  router.patch(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("departments:manage"),
    requireCsrf,
    updateDepartmentController,
  );
  router.delete(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("departments:manage"),
    requireCsrf,
    deleteDepartmentController,
  );

  return router;
};
