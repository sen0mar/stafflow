import { apiClient } from '@/shared/lib/api-client'

export interface AuditLogActor {
  email: string
  id: string
  role: 'ADMIN' | 'EMPLOYEE'
  status: 'ACTIVE' | 'DISABLED' | 'INVITED'
}

export interface AuditLog {
  action: string
  actorUser: AuditLogActor | null
  actorUserId: string | null
  createdAt: string
  entityId: string | null
  entityType: string
  id: string
  ipAddress: string | null
  metadata: unknown
  userAgent: string | null
}

export interface Pagination {
  page: number
  pageCount: number
  pageSize: number
  total: number
}

export interface AuditLogListParams {
  action?: string
  actorUserId?: string
  createdAtFrom?: string
  createdAtTo?: string
  entityId?: string
  entityType?: string
  limit: number
  page: number
}

export interface AuditLogListResponse {
  items: AuditLog[]
  pagination: Pagination
}

interface ApiResponse<TData> {
  data: TData
}

const appendOptionalParam = (
  searchParams: URLSearchParams,
  key: string,
  value: string | undefined,
) => {
  if (value) {
    searchParams.set(key, value)
  }
}

const getAuditLogSearchParams = (params: AuditLogListParams) => {
  const searchParams = new URLSearchParams()
  searchParams.set('limit', String(params.limit))
  searchParams.set('page', String(params.page))
  appendOptionalParam(searchParams, 'action', params.action)
  appendOptionalParam(searchParams, 'actorUserId', params.actorUserId)
  appendOptionalParam(searchParams, 'createdAtFrom', params.createdAtFrom)
  appendOptionalParam(searchParams, 'createdAtTo', params.createdAtTo)
  appendOptionalParam(searchParams, 'entityId', params.entityId)
  appendOptionalParam(searchParams, 'entityType', params.entityType)

  return searchParams
}

export const getAuditLogs = async (params: AuditLogListParams) => {
  const searchParams = getAuditLogSearchParams(params)
  const response = await apiClient<ApiResponse<AuditLogListResponse>>(
    `/audit-logs?${searchParams.toString()}`,
  )

  return response.data
}

export const getAuditLog = async (id: string) => {
  const response = await apiClient<ApiResponse<AuditLog>>(`/audit-logs/${id}`)

  return response.data
}
