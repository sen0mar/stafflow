import { apiClient } from '@/shared/lib/api-client'
import type {
  PaginatedResponse,
  PaginationMeta,
} from '@/shared/types/pagination'

export type LeaveRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export interface LeaveType {
  annualAllowance: number | null
  createdAt: string
  description: string | null
  id: string
  isActive: boolean
  isPaid: boolean
  leaveBalanceCount: number
  leaveRequestCount: number
  name: string
  updatedAt: string
}

export interface LeaveEmployee {
  department: {
    id: string
    name: string
  } | null
  employeeCode: string
  fullName: string
  id: string
}

export interface LeaveRequest {
  createdAt: string
  employee: LeaveEmployee
  employeeId: string
  endDate: string
  id: string
  leaveType: {
    id: string
    isPaid: boolean
    name: string
  }
  leaveTypeId: string
  reason: string | null
  reviewedAt: string | null
  reviewedBy: {
    email: string
    id: string
  } | null
  reviewedById: string | null
  reviewNote: string | null
  startDate: string
  status: LeaveRequestStatus
  totalDays: number
  updatedAt: string
}

export interface LeaveBalance {
  allocated: number
  employeeId: string
  id: string
  leaveType: {
    id: string
    name: string
  }
  leaveTypeId: string
  remaining: number
  used: number
  year: number
}

export type Pagination = PaginationMeta

export interface LeaveTypeListParams {
  isActive?: boolean
  limit: number
  page: number
  search?: string
}

export interface LeaveRequestListParams {
  employeeId?: string
  leaveTypeId?: string
  limit: number
  page: number
  status?: LeaveRequestStatus
}

export interface SelfLeaveRequestListParams {
  limit: number
  page: number
  status?: LeaveRequestStatus
}

export interface LeaveTypeListResponse {
  data: LeaveType[]
  meta: Pagination
}

export interface LeaveRequestListResponse {
  data: LeaveRequest[]
  meta: Pagination
}

export interface SelfLeaveRequestListResponse extends LeaveRequestListResponse {
  balances: LeaveBalance[]
}

export interface CreateLeaveTypeInput {
  annualAllowance?: number | null
  description?: string | null
  isActive?: boolean
  isPaid?: boolean
  name: string
}

export interface UpdateLeaveTypeInput extends Partial<CreateLeaveTypeInput> {
  id: string
}

export interface CreateLeaveRequestInput {
  endDate: string
  leaveTypeId: string
  reason?: string | null
  startDate: string
}

export interface ReviewLeaveRequestInput {
  id: string
  reviewNote?: string | null
}

interface ApiResponse<TData> {
  data: TData
}

const appendPagination = (
  searchParams: URLSearchParams,
  params: { limit: number; page: number },
) => {
  searchParams.set('limit', String(params.limit))
  searchParams.set('page', String(params.page))
}

export const getLeaveTypes = async (params: LeaveTypeListParams) => {
  const searchParams = new URLSearchParams()
  appendPagination(searchParams, params)

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive))
  }

  const response = await apiClient<PaginatedResponse<LeaveType>>(
    `/leave-types?${searchParams.toString()}`,
  )

  return response
}

export const createLeaveType = async (input: CreateLeaveTypeInput) => {
  const response = await apiClient<ApiResponse<LeaveType>>('/leave-types', {
    body: { ...input },
    method: 'POST',
  })

  return response.data
}

export const updateLeaveType = async ({
  id,
  ...input
}: UpdateLeaveTypeInput) => {
  const response = await apiClient<ApiResponse<LeaveType>>(
    `/leave-types/${id}`,
    {
      body: input,
      method: 'PATCH',
    },
  )

  return response.data
}

export const deleteLeaveType = async (id: string) => {
  const response = await apiClient<ApiResponse<LeaveType>>(
    `/leave-types/${id}`,
    {
      method: 'DELETE',
    },
  )

  return response.data
}

export const getSelfLeaveRequests = async (
  params: SelfLeaveRequestListParams,
) => {
  const searchParams = new URLSearchParams()
  appendPagination(searchParams, params)

  if (params.status) {
    searchParams.set('status', params.status)
  }

  const response = await apiClient<SelfLeaveRequestListResponse>(
    `/leave-requests/me?${searchParams.toString()}`,
  )

  return response
}

export const createLeaveRequest = async (input: CreateLeaveRequestInput) => {
  const response = await apiClient<ApiResponse<LeaveRequest>>(
    '/leave-requests',
    {
      body: { ...input },
      method: 'POST',
    },
  )

  return response.data
}

export const cancelLeaveRequest = async (id: string) => {
  const response = await apiClient<ApiResponse<LeaveRequest>>(
    `/leave-requests/${id}/cancel`,
    {
      method: 'PATCH',
    },
  )

  return response.data
}

export const getLeaveRequests = async (params: LeaveRequestListParams) => {
  const searchParams = new URLSearchParams()
  appendPagination(searchParams, params)

  if (params.employeeId) {
    searchParams.set('employeeId', params.employeeId)
  }

  if (params.leaveTypeId) {
    searchParams.set('leaveTypeId', params.leaveTypeId)
  }

  if (params.status) {
    searchParams.set('status', params.status)
  }

  const response = await apiClient<LeaveRequestListResponse>(
    `/leave-requests?${searchParams.toString()}`,
  )

  return response
}

export const getLeaveRequest = async (id: string) => {
  const response = await apiClient<ApiResponse<LeaveRequest>>(
    `/leave-requests/${id}`,
  )

  return response.data
}

export const approveLeaveRequest = async ({
  id,
  reviewNote,
}: ReviewLeaveRequestInput) => {
  const response = await apiClient<ApiResponse<LeaveRequest>>(
    `/leave-requests/${id}/approve`,
    {
      body: { reviewNote },
      method: 'PATCH',
    },
  )

  return response.data
}

export const rejectLeaveRequest = async ({
  id,
  reviewNote,
}: ReviewLeaveRequestInput) => {
  const response = await apiClient<ApiResponse<LeaveRequest>>(
    `/leave-requests/${id}/reject`,
    {
      body: { reviewNote },
      method: 'PATCH',
    },
  )

  return response.data
}
