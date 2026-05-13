import { AppError } from "../../core/errors/app-error";
import {
  getPaginationParams,
  toPaginatedResult,
} from "../../core/pagination/pagination";
import {
  findAuditLogById,
  listAuditLogs,
  type AuditLogRecord,
} from "./audit-logs.repository";
import type { ListAuditLogsInput } from "./audit-logs.schema";

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
  const limit = input.limit;
  const { items, total } = await listAuditLogs({
    ...input,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toAuditLogDto),
    limit,
    page,
    total,
  });
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
