import type { Express } from "express";

import type { AuthContext } from "../../core/auth/auth.types";
import { AppError } from "../../core/errors/app-error";
import { logger } from "../../core/logger/logger";
import {
  getPaginationParams,
  toPaginatedResult,
} from "../../core/pagination/pagination";
import {
  assertValidPayslipPdf,
  sanitizePayslipDisplayFilename,
} from "../../core/storage/file-validation";
import {
  createPayslipObjectKey,
  createPrivateDownloadUrl,
  deletePrivateObject,
  uploadPrivatePayslipPdf,
} from "../../core/storage/r2.service";
import {
  classifyStorageError,
  isMissingStorageObjectError,
} from "../../core/storage/storage-error";
import { assertDemoUploadsAllowed } from "./demo-upload.guard";
import {
  createOrReplacePayslipWithAuditLog,
  deletePayslipWithAuditLog,
  findEmployeeForPayslip,
  findPayslipById,
  findSoftDeletedPayslipObjects,
  listPayslips,
  listSelfPayslips,
  type PayslipRecord,
} from "./payslips.repository";
import type {
  CreatePayslipInput,
  ListPayslipsInput,
  ListSelfPayslipsInput,
} from "./payslips.schema";
import {
  canDeletePayslips,
  canReadPayslipForEmployee,
  getSelfPayslipEmployeeId,
} from "./payslips.policy";

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  requestId?: string;
  userAgent?: string;
}

type PayslipStorageOperation =
  | "cleanup_failed_upload"
  | "create_download_url"
  | "delete_payslip"
  | "delete_replaced_object"
  | "retry_soft_deleted_object";

const getFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

const toPayslipDto = (payslip: PayslipRecord) => ({
  contentType: payslip.contentType,
  createdAt: payslip.createdAt.toISOString(),
  deletedAt: payslip.deletedAt?.toISOString() ?? null,
  employee: {
    department: payslip.employee.department,
    employeeCode: payslip.employee.employeeCode,
    fullName: getFullName(
      payslip.employee.firstName,
      payslip.employee.lastName,
    ),
    id: payslip.employee.id,
  },
  employeeId: payslip.employeeId,
  fileName: payslip.fileName,
  fileSize: payslip.fileSize,
  id: payslip.id,
  month: payslip.month,
  status: payslip.status,
  updatedAt: payslip.updatedAt.toISOString(),
  uploadedAt: payslip.uploadedAt.toISOString(),
  uploadedBy: payslip.uploadedBy,
  uploadedById: payslip.uploadedById,
  year: payslip.year,
});

const assertPayslipExists = async (id: string) => {
  const payslip = await findPayslipById(id);

  if (!payslip || payslip.status !== "ACTIVE") {
    throw new AppError({
      code: "PAYSLIP_NOT_FOUND",
      message: "Payslip was not found.",
      statusCode: 404,
    });
  }

  return payslip;
};

const assertCanReadPayslip = (auth: AuthContext, payslip: PayslipRecord) => {
  if (!canReadPayslipForEmployee(auth, payslip.employeeId)) {
    throw new AppError({
      code: "PAYSLIP_FORBIDDEN",
      message: "You do not have access to this payslip.",
      statusCode: 403,
    });
  }
};

const assertCanDeletePayslip = (auth: AuthContext) => {
  if (!canDeletePayslips(auth)) {
    throw new AppError({
      code: "PAYSLIP_FORBIDDEN",
      message: "You do not have permission to delete payslips.",
      statusCode: 403,
    });
  }
};

const assertEmployeeCanReceivePayslip = async (employeeId: string) => {
  const employee = await findEmployeeForPayslip(employeeId);

  if (!employee) {
    throw new AppError({
      code: "PAYSLIP_EMPLOYEE_NOT_FOUND",
      message: "Employee was not found.",
      statusCode: 404,
    });
  }

  if (employee.status !== "ACTIVE") {
    throw new AppError({
      code: "PAYSLIP_EMPLOYEE_INACTIVE",
      message: "Payslips can only be uploaded for active employees.",
      statusCode: 409,
    });
  }
};

const logStorageFailure = ({
  error,
  operation,
  payslipId,
  requestId,
}: {
  error: unknown;
  operation: PayslipStorageOperation;
  payslipId: string | null;
  requestId?: string;
}) => {
  logger.error(
    {
      errorClassification: classifyStorageError(error),
      operation,
      payslipId,
      requestId,
    },
    "Payslip storage operation failed",
  );
};

const cleanupUploadedObject = async (objectKey: string, requestId?: string) => {
  try {
    await deletePrivateObject(objectKey);
  } catch (error) {
    logStorageFailure({
      error,
      operation: "cleanup_failed_upload",
      payslipId: null,
      requestId,
    });
  }
};

const deleteReplacedObject = async (
  objectKey: string | null,
  newObjectKey: string,
  payslipId: string,
  requestId?: string,
) => {
  if (!objectKey || objectKey === newObjectKey) {
    return;
  }

  try {
    await deletePrivateObject(objectKey);
  } catch (error) {
    logStorageFailure({
      error,
      operation: "delete_replaced_object",
      payslipId,
      requestId,
    });
  }
};

export const getPayslipList = async (input: ListPayslipsInput) => {
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listPayslips({
    ...input,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toPayslipDto),
    limit,
    page,
    total,
  });
};

export const getSelfPayslipList = async (
  auth: AuthContext,
  input: ListSelfPayslipsInput,
) => {
  const employeeId = getSelfPayslipEmployeeId(auth);
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listSelfPayslips({
    ...input,
    employeeId,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toPayslipDto),
    limit,
    page,
    total,
  });
};

export const getPayslipDetail = async (auth: AuthContext, id: string) => {
  const payslip = await assertPayslipExists(id);
  assertCanReadPayslip(auth, payslip);

  return toPayslipDto(payslip);
};

export const uploadPayslip = async ({
  auditContext,
  file,
  input,
}: {
  auditContext: AuditContext;
  file: Express.Multer.File | undefined;
  input: CreatePayslipInput;
}) => {
  assertDemoUploadsAllowed();
  const validFile = assertValidPayslipPdf(file);
  await assertEmployeeCanReceivePayslip(input.employeeId);

  const objectKey = createPayslipObjectKey(input);
  await uploadPrivatePayslipPdf({
    body: validFile.buffer,
    key: objectKey,
  });

  try {
    const { oldObjectKey, payslip } = await createOrReplacePayslipWithAuditLog({
      ...auditContext,
      contentType: validFile.mimetype,
      fileName: sanitizePayslipDisplayFilename(validFile.originalname),
      fileSize: validFile.size,
      input,
      r2ObjectKey: objectKey,
    });

    await deleteReplacedObject(
      oldObjectKey,
      objectKey,
      payslip.id,
      auditContext.requestId,
    );

    return toPayslipDto(payslip);
  } catch (error) {
    await cleanupUploadedObject(objectKey, auditContext.requestId);
    throw error;
  }
};

export const deletePayslip = async (
  auth: AuthContext,
  id: string,
  auditContext: AuditContext,
) => {
  assertCanDeletePayslip(auth);
  const current = await assertPayslipExists(id);
  const payslip = await deletePayslipWithAuditLog({
    ...auditContext,
    id,
  });

  try {
    await deletePrivateObject(current.r2ObjectKey);
  } catch (error) {
    logStorageFailure({
      error,
      operation: "delete_payslip",
      payslipId: id,
      requestId: auditContext.requestId,
    });
  }

  return toPayslipDto(payslip);
};

export const getPayslipDownload = async (
  auth: AuthContext,
  id: string,
  requestId?: string,
) => {
  const payslip = await assertPayslipExists(id);
  assertCanReadPayslip(auth, payslip);

  try {
    const download = await createPrivateDownloadUrl(payslip.r2ObjectKey);

    return {
      expiresAt: download.expiresAt.toISOString(),
      url: download.url,
    };
  } catch (error) {
    logStorageFailure({
      error,
      operation: "create_download_url",
      payslipId: id,
      requestId,
    });

    throw new AppError({
      code: "PAYSLIP_DOWNLOAD_UNAVAILABLE",
      message: "Payslip download is temporarily unavailable.",
      statusCode: 502,
    });
  }
};

export const retrySoftDeletedPayslipObjectDeletes = async (
  requestId: string,
) => {
  const batchSize = 100;
  const result = {
    attempted: 0,
    deleted: 0,
    failed: 0,
    missing: 0,
  };
  let skip = 0;

  while (true) {
    const payslips = await findSoftDeletedPayslipObjects({
      skip,
      take: batchSize,
    });

    if (payslips.length === 0) {
      break;
    }

    result.attempted += payslips.length;

    for (const payslip of payslips) {
      try {
        await deletePrivateObject(payslip.r2ObjectKey);
        result.deleted += 1;
      } catch (error) {
        if (isMissingStorageObjectError(error)) {
          result.missing += 1;
          continue;
        }

        result.failed += 1;
        logStorageFailure({
          error,
          operation: "retry_soft_deleted_object",
          payslipId: payslip.id,
          requestId,
        });
      }
    }

    skip += payslips.length;
  }

  return result;
};
