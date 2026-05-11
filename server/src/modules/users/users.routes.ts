import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { updateUserAccountController } from "./users.controller";

export const createUserRoutes = (): Router => {
  const router = Router();

  router.patch(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("employees:update:any"),
    requireCsrf,
    updateUserAccountController,
  );

  return router;
};
