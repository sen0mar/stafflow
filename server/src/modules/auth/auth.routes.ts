import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requireDemoMutationAllowed } from "../../core/security/demo-read-only.middleware";
import {
  acceptInvitationController,
  authConfigController,
  changePasswordController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  resetPasswordController,
} from "./auth.controller";

export const createAuthRoutes = (): Router => {
  const router = Router();

  router.get("/config", authConfigController);
  router.post("/login", loginController);
  router.post(
    "/forgot-password",
    requireDemoMutationAllowed,
    forgotPasswordController,
  );
  router.post(
    "/reset-password",
    requireDemoMutationAllowed,
    resetPasswordController,
  );
  router.post(
    "/invitations/accept",
    requireDemoMutationAllowed,
    acceptInvitationController,
  );
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
    requireDemoMutationAllowed,
    changePasswordController,
  );

  return router;
};
