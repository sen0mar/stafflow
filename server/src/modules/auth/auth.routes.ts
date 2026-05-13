import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import {
  acceptInvitationController,
  changePasswordController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  resetPasswordController,
} from "./auth.controller";

export const createAuthRoutes = (): Router => {
  const router = Router();

  router.post("/login", loginController);
  router.post("/forgot-password", forgotPasswordController);
  router.post("/reset-password", resetPasswordController);
  router.post("/invitations/accept", acceptInvitationController);
  router.get("/me", attachAuth, requireAuth, meController);
  router.post(
    "/logout",
    attachAuth,
    requireAuth,
    requireCsrf,
    logoutController,
  );
  router.post(
    "/change-password",
    attachAuth,
    requireAuth,
    requireCsrf,
    changePasswordController,
  );

  return router;
};
