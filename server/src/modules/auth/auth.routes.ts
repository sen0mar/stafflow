import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import {
  changePasswordController,
  loginController,
  logoutController,
  meController,
} from "./auth.controller";

export const createAuthRoutes = (): Router => {
  const router = Router();

  router.post("/login", loginController);
  router.get("/me", attachAuth, requireAuth, meController);
  router.post("/logout", attachAuth, requireAuth, requireCsrf, logoutController);
  router.post(
    "/change-password",
    attachAuth,
    requireAuth,
    requireCsrf,
    changePasswordController,
  );

  return router;
};
