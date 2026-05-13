import { useQuery } from '@tanstack/react-query'
import {
  getAuditLog,
  getAuditLogs,
  type AuditLogListParams,
} from '../api/audit-logs.api'
import { auditLogsKeys } from '../api/audit-logs.keys'

export const useAuditLogs = (params: AuditLogListParams, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getAuditLogs(params),
    queryKey: auditLogsKeys.list(params),
  })

export const useAuditLog = (id: string | null, enabled = true) =>
  useQuery({
    enabled: enabled && Boolean(id),
    queryFn: () => getAuditLog(id ?? ''),
    queryKey: auditLogsKeys.detail(id ?? ''),
  })
