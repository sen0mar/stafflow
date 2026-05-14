import { apiClient } from '@/shared/lib/api-client'
import type { PaginatedResponse } from '@/shared/types/pagination'

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'INVITED'
export type UserRole = 'ADMIN' | 'EMPLOYEE'
export type EmployeeSort =
  | 'name'
  | 'newest'
  | 'oldest'
  | 'department'
  | 'status'

export interface EmployeeDepartment {
  id: string
  name: string
}

export interface EmployeeAccount {
  createdAt: string
  email: string
  id: string
  lastLoginAt: string | null
  role: UserRole
  status: AccountStatus
  updatedAt: string
}

export interface Employee {
  account: EmployeeAccount | null
  createdAt: string
  department: EmployeeDepartment | null
  departmentId: string | null
  employeeCode: string
  firstName: string
  fullName: string
  hireDate: string | null
  id: string
  jobTitle: string | null
  lastName: string
  phone: string | null
  status: EmployeeStatus
  terminationDate: string | null
  updatedAt: string
}

export interface EmployeeListParams {
  departmentId?: string
  limit: number
  page: number
  search?: string
  sort: EmployeeSort
  status?: EmployeeStatus
}

export interface EmployeeListResponse {
  data: Employee[]
  meta: PaginatedResponse<Employee>['meta']
}

export interface CreateEmployeeInput {
  departmentId?: string | null
  email: string
  employeeCode: string
  firstName: string
  hireDate?: string | null
  jobTitle?: string | null
  lastName: string
  phone?: string | null
}

export type UpdateEmployeeInput = Partial<
  Omit<CreateEmployeeInput, 'email'>
> & {
  id: string
}

export interface UpdateEmployeeStatusInput {
  accountStatus?: AccountStatus
  employeeStatus?: EmployeeStatus
  id: string
}

export interface UpdateSelfProfileInput {
  firstName?: string
  lastName?: string
  phone?: string | null
}

export interface EmployeeInvitation {
  accountId: string
  email: string
  employeeId: string
  employeeName: string
  expiresAt: string
}

interface ApiResponse<TData> {
  data: TData
}

interface CreateEmployeeResponse {
  employee: Employee
  invitation: {
    expiresAt: string
    token: string
  }
}

export interface RegenerateEmployeeInvitationResponse {
  employee: EmployeeInvitation
  invitation: {
    expiresAt: string
    token: string
  }
}

const getEmployeeListSearchParams = (params: EmployeeListParams) => {
  const searchParams = new URLSearchParams({
    limit: String(params.limit),
    page: String(params.page),
    sort: params.sort,
  })

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.departmentId) {
    searchParams.set('departmentId', params.departmentId)
  }

  if (params.status) {
    searchParams.set('status', params.status)
  }

  return searchParams
}

export const getEmployees = async (params: EmployeeListParams) => {
  const searchParams = getEmployeeListSearchParams(params)
  const response = await apiClient<EmployeeListResponse>(
    `/employees?${searchParams.toString()}`,
  )

  return response
}

export const getEmployee = async (id: string) => {
  const response = await apiClient<ApiResponse<Employee>>(`/employees/${id}`)

  return response.data
}

export const getSelfEmployee = async () => {
  const response = await apiClient<ApiResponse<Employee>>('/employees/me')

  return response.data
}

export const createEmployee = async (input: CreateEmployeeInput) => {
  const response = await apiClient<ApiResponse<CreateEmployeeResponse>>(
    '/employees',
    {
      body: { ...input },
      method: 'POST',
    },
  )

  return response.data
}

export const getEmployeeInvitations = async () => {
  const response =
    await apiClient<ApiResponse<EmployeeInvitation[]>>('/employees/invitations')

  return response.data
}

export const regenerateEmployeeInvitation = async (id: string) => {
  const response = await apiClient<
    ApiResponse<RegenerateEmployeeInvitationResponse>
  >(`/employees/${id}/invitation`, {
    method: 'POST',
  })

  return response.data
}

export const updateEmployee = async ({ id, ...input }: UpdateEmployeeInput) => {
  const response = await apiClient<ApiResponse<Employee>>(`/employees/${id}`, {
    body: input,
    method: 'PATCH',
  })

  return response.data
}

export const updateEmployeeStatus = async ({
  id,
  ...input
}: UpdateEmployeeStatusInput) => {
  const response = await apiClient<ApiResponse<Employee>>(
    `/employees/${id}/status`,
    {
      body: input,
      method: 'PATCH',
    },
  )

  return response.data
}

export const disableEmployee = async (id: string) => {
  const response = await apiClient<ApiResponse<Employee>>(`/employees/${id}`, {
    method: 'DELETE',
  })

  return response.data
}

export const updateSelfProfile = async (input: UpdateSelfProfileInput) => {
  const response = await apiClient<ApiResponse<Employee>>(
    '/employees/me/profile',
    {
      body: { ...input },
      method: 'PATCH',
    },
  )

  return response.data
}
