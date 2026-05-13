import { apiClient } from '@/shared/lib/api-client'
import type { PaginatedResponse } from '@/shared/types/pagination'

export interface Department {
  createdAt: string
  description: string | null
  employeeCount: number
  id: string
  isActive: boolean
  name: string
  updatedAt: string
}

export interface DepartmentListParams {
  isActive?: boolean
  page: number
  pageSize: number
  search?: string
}

export interface DepartmentMutationInput {
  description?: string | null
  isActive?: boolean
  name: string
}

export interface UpdateDepartmentInput extends Partial<DepartmentMutationInput> {
  id: string
}

interface ApiResponse<TData> {
  data: TData
}

const getDepartmentListSearchParams = (params: DepartmentListParams) => {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive))
  }

  return searchParams
}

export const getDepartments = async (params: DepartmentListParams) => {
  const searchParams = getDepartmentListSearchParams(params)
  const response = await apiClient<PaginatedResponse<Department>>(
    `/departments?${searchParams.toString()}`,
  )

  return response
}

export const getDepartment = async (id: string) => {
  const response = await apiClient<ApiResponse<Department>>(
    `/departments/${id}`,
  )

  return response.data
}

export const createDepartment = async (input: DepartmentMutationInput) => {
  const response = await apiClient<ApiResponse<Department>>('/departments', {
    body: { ...input },
    method: 'POST',
  })

  return response.data
}

export const updateDepartment = async ({
  id,
  ...input
}: UpdateDepartmentInput) => {
  const response = await apiClient<ApiResponse<Department>>(
    `/departments/${id}`,
    {
      body: { ...input },
      method: 'PATCH',
    },
  )

  return response.data
}

export const deleteDepartment = async (id: string) => {
  const response = await apiClient<ApiResponse<Department>>(
    `/departments/${id}`,
    {
      method: 'DELETE',
    },
  )

  return response.data
}
