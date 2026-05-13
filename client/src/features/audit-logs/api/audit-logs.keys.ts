import type { AuditLogListParams } from './audit-logs.api'

export const auditLogsKeys = {
  all: () => ['audit-logs'] as const,
  detail: (id: string) => [...auditLogsKeys.details(), id] as const,
  details: () => [...auditLogsKeys.all(), 'detail'] as const,
  list: (params: AuditLogListParams) => [...auditLogsKeys.lists(), params] as const,
  lists: () => [...auditLogsKeys.all(), 'list'] as const,
}
