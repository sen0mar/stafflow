import path from "node:path";

import type { Express } from "express";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

export const payslipPdfMimeType = "application/pdf";
export const payslipDisplayFilenameMaxLength = 120;

const getCrossPlatformBasename = (fileName: string) =>
  fileName.replaceAll("\\", "/").split("/").at(-1) ?? "";

const truncateCodePoints = (value: string, maxLength: number) =>
  Array.from(value).slice(0, maxLength).join("");

export const sanitizePayslipDisplayFilename = (originalName: string) => {
  const basename = getCrossPlatformBasename(originalName)
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/[<>:"|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  const stem = basename.replace(/\.pdf$/i, "").replace(/^[. ]+|[. ]+$/g, "");
  const maxStemLength = payslipDisplayFilenameMaxLength - ".pdf".length;
  const boundedStem = truncateCodePoints(stem, maxStemLength).trimEnd();

  return `${boundedStem || "payslip"}.pdf`;
};

export const assertValidPayslipPdf = (
  file: Express.Multer.File | undefined,
): Express.Multer.File => {
  if (!file) {
    throw new AppError({
      code: "PAYSLIP_FILE_REQUIRED",
      message: "A payslip PDF file is required.",
      statusCode: 422,
    });
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (extension !== ".pdf") {
    throw new AppError({
      code: "PAYSLIP_FILE_EXTENSION_INVALID",
      message: "Payslip uploads must use a .pdf file.",
      statusCode: 422,
    });
  }

  if (file.mimetype !== payslipPdfMimeType) {
    throw new AppError({
      code: "PAYSLIP_FILE_TYPE_INVALID",
      message: "Payslip uploads must be PDF files.",
      statusCode: 422,
    });
  }

  if (file.size > env.PAYSLIP_MAX_UPLOAD_BYTES) {
    throw new AppError({
      code: "PAYSLIP_FILE_TOO_LARGE",
      message: "Payslip PDFs must be 2 MB or smaller.",
      statusCode: 413,
    });
  }

  if (!file.buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
    throw new AppError({
      code: "PAYSLIP_FILE_SIGNATURE_INVALID",
      message: "Payslip uploads must be valid PDF files.",
      statusCode: 422,
    });
  }

  return file;
};
