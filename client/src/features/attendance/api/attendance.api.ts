import { apiClient } from '@/shared/lib/api-client'
import type { PaginatedResponse } from '@/shared/types/pagination'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'PARTIAL'
export type AttendanceSource = 'SELF' | 'ADMIN' | 'SYSTEM'

export interface AttendanceEmployee {
  department: {
    id: string
    name: string
  } | null
  employeeCode: string
  fullName: string
  id: string
}

export interface AttendanceRecord {
  clockInAt: string | null
  clockOutAt: string | null
  createdAt: string
  date: string
  employee: AttendanceEmployee
  employeeId: string
  id: string
  notes: string | null
  source: AttendanceSource
  status: AttendanceStatus
  totalMinutes: number | null
  updatedAt: string
}

export interface AttendanceListParams {
  departmentId?: string
  employeeId?: string
  from?: string
  limit: number
  page: number
  status?: AttendanceStatus
  to?: string
}

export interface SelfAttendanceListParams {
  from?: string
  limit: number
  page: number
  status?: AttendanceStatus
  to?: string
}

export type AttendanceListResponse = PaginatedResponse<AttendanceRecord>

export interface UpdateAttendanceInput {
  clockInAt?: string | null
  clockOutAt?: string | null
  id: string
  notes?: string | null
  status?: AttendanceStatus
}

interface ApiResponse<TData> {
  data: TData
}

const appendCommonParams = (
  searchParams: URLSearchParams,
  params: AttendanceListParams | SelfAttendanceListParams,
) => {
  searchParams.set('limit', String(params.limit))
  searchParams.set('page', String(params.page))

  if (params.from) {
    searchParams.set('from', params.from)
  }

  if (params.to) {
    searchParams.set('to', params.to)
  }

  if (params.status) {
    searchParams.set('status', params.status)
  }
}

export const getSelfTodayAttendance = async () => {
  const response = await apiClient<ApiResponse<AttendanceRecord | null>>('/attendance/me/today')

  return response.data
}

export const getSelfAttendanceHistory = async (params: SelfAttendanceListParams) => {
  const searchParams = new URLSearchParams()
  appendCommonParams(searchParams, params)
  const response = await apiClient<AttendanceListResponse>(
    `/attendance/me/history?${searchParams.toString()}`,
  )

  return response
}

export const clockIn = async () => {
  const response = await apiClient<ApiResponse<AttendanceRecord>>('/attendance/clock-in', {
    method: 'POST',
  })

  return response.data
}

export const clockOut = async () => {
  const response = await apiClient<ApiResponse<AttendanceRecord>>('/attendance/clock-out', {
    method: 'POST',
  })

  return response.data
}

export const getAttendanceRecords = async (params: AttendanceListParams) => {
  const searchParams = new URLSearchParams()
  appendCommonParams(searchParams, params)

  if (params.employeeId) {
    searchParams.set('employeeId', params.employeeId)
  }

  if (params.departmentId) {
    searchParams.set('departmentId', params.departmentId)
  }

  const response = await apiClient<AttendanceListResponse>(
    `/attendance?${searchParams.toString()}`,
  )

  return response
}

export const getAttendanceRecord = async (id: string) => {
  const response = await apiClient<ApiResponse<AttendanceRecord>>(`/attendance/${id}`)

  return response.data
}

export const updateAttendanceRecord = async ({ id, ...input }: UpdateAttendanceInput) => {
  const response = await apiClient<ApiResponse<AttendanceRecord>>(`/attendance/${id}`, {
    body: input,
    method: 'PATCH',
  })

  return response.data
}
