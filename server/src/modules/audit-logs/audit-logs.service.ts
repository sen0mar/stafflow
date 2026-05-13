import { AppError } from "../../core/errors/app-error";
import {
  findAuditLogById,
  listAuditLogs,
  type AuditLogRecord,
} from "./audit-logs.repository";
import type { ListAuditLogsInput } from "./audit-logs.schema";

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

const toAuditLogDto = (auditLog: AuditLogRecord) => ({
  action: auditLog.action,
  actorUser: auditLog.actorUser,
  actorUserId: auditLog.actorUserId,
  createdAt: auditLog.createdAt.toISOString(),
  entityId: auditLog.entityId,
  entityType: auditLog.entityType,
  id: auditLog.id,
  ipAddress: auditLog.ipAddress,
  metadata: auditLog.metadata,
  userAgent: auditLog.userAgent,
});

export const getAuditLogs = async (input: ListAuditLogsInput) => {
  const page = input.page;
  const pageSize = input.limit;
  const { items, total } = await listAuditLogs({
    ...input,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: items.map(toAuditLogDto),
    pagination: getPagination({ page, pageSize, total }),
  };
};

export const getAuditLog = async (id: string) => {
  const auditLog = await findAuditLogById(id);

  if (!auditLog) {
    throw new AppError({
      code: "AUDIT_LOG_NOT_FOUND",
      message: "Audit log was not found.",
      statusCode: 404,
    });
  }

  return toAuditLogDto(auditLog);
};
