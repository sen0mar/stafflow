import { apiClient } from '@/shared/lib/api-client'

export interface PayslipEmployee {
  department: {
    id: string
    name: string
  } | null
  employeeCode: string
  fullName: string
  id: string
}

export interface Payslip {
  contentType: string
  createdAt: string
  deletedAt: string | null
  employee: PayslipEmployee
  employeeId: string
  fileName: string
  fileSize: number
  id: string
  month: number
  status: 'ACTIVE' | 'DELETED'
  updatedAt: string
  uploadedAt: string
  uploadedBy: {
    email: string
    id: string
  } | null
  uploadedById: string | null
  year: number
}

export interface Pagination {
  page: number
  pageCount: number
  pageSize: number
  total: number
}

export interface PayslipListParams {
  employeeId?: string
  limit: number
  month?: number
  page: number
  search?: string
  year?: number
}

export interface SelfPayslipListParams {
  limit: number
  month?: number
  page: number
  year?: number
}

export interface PayslipListResponse {
  items: Payslip[]
  pagination: Pagination
}

export interface UploadPayslipInput {
  employeeId: string
  file: File
  month: number
  year: number
}

interface ApiResponse<TData> {
  data: TData
}

const appendPagination = (searchParams: URLSearchParams, params: { limit: number; page: number }) => {
  searchParams.set('limit', String(params.limit))
  searchParams.set('page', String(params.page))
}

const getPayslipSearchParams = (params: PayslipListParams | SelfPayslipListParams) => {
  const searchParams = new URLSearchParams()
  appendPagination(searchParams, params)

  if ('employeeId' in params && params.employeeId) {
    searchParams.set('employeeId', params.employeeId)
  }

  if ('search' in params && params.search) {
    searchParams.set('search', params.search)
  }

  if (params.month) {
    searchParams.set('month', String(params.month))
  }

  if (params.year) {
    searchParams.set('year', String(params.year))
  }

  return searchParams
}

export const getPayslips = async (params: PayslipListParams) => {
  const searchParams = getPayslipSearchParams(params)
  const response = await apiClient<ApiResponse<PayslipListResponse>>(
    `/payslips?${searchParams.toString()}`,
  )

  return response.data
}

export const getSelfPayslips = async (params: SelfPayslipListParams) => {
  const searchParams = getPayslipSearchParams(params)
  const response = await apiClient<ApiResponse<PayslipListResponse>>(
    `/payslips/me?${searchParams.toString()}`,
  )

  return response.data
}

export const uploadPayslip = async ({ employeeId, file, month, year }: UploadPayslipInput) => {
  const formData = new FormData()
  formData.set('employeeId', employeeId)
  formData.set('month', String(month))
  formData.set('year', String(year))
  formData.set('file', file)

  const response = await apiClient<ApiResponse<Payslip>>('/payslips', {
    body: formData,
    method: 'POST',
  })

  return response.data
}

export const deletePayslip = async (id: string) => {
  const response = await apiClient<ApiResponse<Payslip>>(`/payslips/${id}`, {
    method: 'DELETE',
  })

  return response.data
}

export const getPayslipDownload = async (id: string) => {
  const response = await apiClient<ApiResponse<{ expiresAt: string; url: string }>>(
    `/payslips/${id}/download`,
  )

  return response.data
}
