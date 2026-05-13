import { Router } from "express";

import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requirePermission } from "../../core/auth/permissions";
import {
  getAuditLogController,
  listAuditLogsController,
} from "./audit-logs.controller";

export const createAuditLogRoutes = (): Router => {
  const router = Router();
  const requireAuditLogAccess = requirePermission("auditLogs:read");

  router.get(
    "/",
    attachAuth,
    requireAuth,
    requireAuditLogAccess,
    listAuditLogsController,
  );
  router.get(
    "/:id",
    attachAuth,
    requireAuth,
    requireAuditLogAccess,
    getAuditLogController,
  );

  return router;
};
