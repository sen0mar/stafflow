import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requireDemoMutationAllowed } from "../../core/security/demo-read-only.middleware";
import { requireJson } from "../../core/security/require-json.middleware";
import {
  acceptInvitationController,
  authConfigController,
  changePasswordController,
  loginController,
  logoutController,
  meController,
} from "./auth.controller";

export const createAuthRoutes = (): Router => {
  const router = Router();

  router.get("/config", authConfigController);
  router.post("/login", requireJson, loginController);
  router.post(
    "/invitations/accept",
    requireJson,
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
    requireJson,
    requireDemoMutationAllowed,
    changePasswordController,
  );

  return router;
};
