import path from "node:path";

import type { Express } from "express";

import type { AuthContext } from "../../core/auth/auth.types";
import { AppError } from "../../core/errors/app-error";
import { logger } from "../../core/logger/logger";
import { assertValidPayslipPdf } from "../../core/storage/file-validation";
import {
  createPayslipObjectKey,
  createPrivateDownloadUrl,
  deletePrivateObject,
  uploadPrivatePayslipPdf,
} from "../../core/storage/r2.service";
import { assertDemoUploadsAllowed } from "./demo-upload.guard";
import {
  createOrReplacePayslipWithAuditLog,
  deletePayslipWithAuditLog,
  findEmployeeForPayslip,
  findPayslipById,
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
  userAgent?: string;
}

const getPagination = ({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) => ({
  page,
  pageCount: Math.max(1, Math.ceil(total / pageSize)),
  pageSize,
  total,
});

const getFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

const toPayslipDto = (payslip: PayslipRecord) => ({
  contentType: payslip.contentType,
  createdAt: payslip.createdAt.toISOString(),
  deletedAt: payslip.deletedAt?.toISOString() ?? null,
  employee: {
    department: payslip.employee.department,
    employeeCode: payslip.employee.employeeCode,
    fullName: getFullName(payslip.employee.firstName, payslip.employee.lastName),
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

const cleanupUploadedObject = async (objectKey: string) => {
  try {
    await deletePrivateObject(objectKey);
  } catch (error) {
    logger.error(
      {
        err: error,
        objectKey,
      },
      "Failed to clean up uploaded payslip object after database error",
    );
  }
};

const deleteReplacedObject = async (objectKey: string | null, newObjectKey: string) => {
  if (!objectKey || objectKey === newObjectKey) {
    return;
  }

  try {
    await deletePrivateObject(objectKey);
  } catch (error) {
    logger.error(
      {
        err: error,
        objectKey,
      },
      "Failed to delete replaced payslip object",
    );
  }
};

export const getPayslipList = async (input: ListPayslipsInput) => {
  const page = input.page;
  const pageSize = input.limit;
  const { items, total } = await listPayslips({
    ...input,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: items.map(toPayslipDto),
    pagination: getPagination({ page, pageSize, total }),
  };
};

export const getSelfPayslipList = async (
  auth: AuthContext,
  input: ListSelfPayslipsInput,
) => {
  const employeeId = getSelfPayslipEmployeeId(auth);
  const page = input.page;
  const pageSize = input.limit;
  const { items, total } = await listSelfPayslips({
    ...input,
    employeeId,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: items.map(toPayslipDto),
    pagination: getPagination({ page, pageSize, total }),
  };
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
      fileName: path.basename(validFile.originalname),
      fileSize: validFile.size,
      input,
      r2ObjectKey: objectKey,
    });

    await deleteReplacedObject(oldObjectKey, objectKey);

    return toPayslipDto(payslip);
  } catch (error) {
    await cleanupUploadedObject(objectKey);
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
    logger.error(
      {
        err: error,
        objectKey: current.r2ObjectKey,
        payslipId: id,
      },
      "Failed to delete payslip object after metadata deletion",
    );
  }

  return toPayslipDto(payslip);
};

export const getPayslipDownload = async (auth: AuthContext, id: string) => {
  const payslip = await assertPayslipExists(id);
  assertCanReadPayslip(auth, payslip);

  try {
    const download = await createPrivateDownloadUrl(payslip.r2ObjectKey);

    return {
      expiresAt: download.expiresAt.toISOString(),
      url: download.url,
    };
  } catch (error) {
    logger.error(
      {
        err: error,
        objectKey: payslip.r2ObjectKey,
        payslipId: id,
      },
      "Failed to create payslip download URL",
    );

    throw new AppError({
      code: "PAYSLIP_DOWNLOAD_UNAVAILABLE",
      message: "Payslip download is temporarily unavailable.",
      statusCode: 502,
    });
  }
};
