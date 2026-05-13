import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  auditLogIdSchema,
  listAuditLogsSchema,
} from "./audit-logs.schema";
import { getAuditLog, getAuditLogs } from "./audit-logs.service";

export const listAuditLogsController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listAuditLogsSchema.parse({ query: request.query });
  const auditLogs = await getAuditLogs(query);

  response.status(200).json(auditLogs);
};

export const getAuditLogController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = auditLogIdSchema.parse({ params: request.params });
  const auditLog = await getAuditLog(params.id);
  const responseBody: ApiSuccess<typeof auditLog> = { data: auditLog };

  response.status(200).json(responseBody);
};
