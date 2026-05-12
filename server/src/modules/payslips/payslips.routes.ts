import { Router, type RequestHandler } from "express";
import multer from "multer";

import { env } from "../../config/env";
import { attachAuth, requireAuth } from "../../core/auth/auth.middleware";
import { requireCsrf } from "../../core/auth/csrf.service";
import { requirePermission } from "../../core/auth/permissions";
import { AppError } from "../../core/errors/app-error";
import {
  createPayslipController,
  deletePayslipController,
  downloadPayslipController,
  getPayslipController,
  listPayslipsController,
  listSelfPayslipsController,
} from "./payslips.controller";

const upload = multer({
  limits: {
    fileSize: env.PAYSLIP_MAX_UPLOAD_BYTES,
    files: 1,
  },
  storage: multer.memoryStorage(),
});

const uploadPayslipFile: RequestHandler = (request, response, next) => {
  upload.single("file")(request, response, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      next(
        new AppError({
          code:
            error.code === "LIMIT_FILE_SIZE"
              ? "PAYSLIP_FILE_TOO_LARGE"
              : "PAYSLIP_UPLOAD_INVALID",
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "Payslip PDFs must be 2 MB or smaller."
              : "Payslip upload could not be processed.",
          statusCode: error.code === "LIMIT_FILE_SIZE" ? 413 : 422,
        }),
      );
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};

export const createPayslipRoutes = (): Router => {
  const router = Router();

  router.get(
    "/me",
    attachAuth,
    requireAuth,
    requirePermission("payslips:read:self"),
    listSelfPayslipsController,
  );
  router.get(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("payslips:read:any"),
    listPayslipsController,
  );
  router.post(
    "/",
    attachAuth,
    requireAuth,
    requirePermission("payslips:upload"),
    requireCsrf,
    uploadPayslipFile,
    createPayslipController,
  );
  router.get(
    "/:id/download",
    attachAuth,
    requireAuth,
    downloadPayslipController,
  );
  router.get(
    "/:id",
    attachAuth,
    requireAuth,
    getPayslipController,
  );
  router.delete(
    "/:id",
    attachAuth,
    requireAuth,
    requirePermission("payslips:delete"),
    requireCsrf,
    deletePayslipController,
  );

  return router;
};
