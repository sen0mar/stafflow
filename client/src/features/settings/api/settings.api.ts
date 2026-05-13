import { apiClient } from '@/shared/lib/api-client'

interface ApiResponse<TData> {
  data: TData
}

export interface CompanySettings {
  createdAt: string
  demoMode: boolean
  id: string
  locale: string
  name: string
  timezone: string
  updatedAt: string
}

export interface AttendanceSettings {
  allowEmployeeClockIn: boolean
  createdAt: string
  demoMode: boolean
  id: string
  lateGracePeriodMinutes: number
  updatedAt: string
  weeklyWorkingDays: number[]
  workdayEnd: string
  workdayMinutes: number
  workdayStart: string
}

export interface LeaveSettings {
  allowNegativeBalance: boolean
  createdAt: string
  defaultAnnualAllowanceDays: number
  demoMode: boolean
  id: string
  policyText: string | null
  updatedAt: string
}

export interface UpdateCompanySettingsInput {
  locale?: string
  name?: string
  timezone?: string
}

export interface UpdateAttendanceSettingsInput {
  allowEmployeeClockIn?: boolean
  lateGracePeriodMinutes?: number
  weeklyWorkingDays?: number[]
  workdayEnd?: string
  workdayMinutes?: number
  workdayStart?: string
}

export interface UpdateLeaveSettingsInput {
  allowNegativeBalance?: boolean
  defaultAnnualAllowanceDays?: number
  policyText?: string | null
}

export const getCompanySettings = async () => {
  const response =
    await apiClient<ApiResponse<CompanySettings>>('/settings/company')

  return response.data
}

export const updateCompanySettings = async (
  input: UpdateCompanySettingsInput,
) => {
  const response = await apiClient<ApiResponse<CompanySettings>>(
    '/settings/company',
    {
      body: { ...input },
      method: 'PATCH',
    },
  )

  return response.data
}

export const getAttendanceSettings = async () => {
  const response = await apiClient<ApiResponse<AttendanceSettings>>(
    '/settings/attendance',
  )

  return response.data
}

export const updateAttendanceSettings = async (
  input: UpdateAttendanceSettingsInput,
) => {
  const response = await apiClient<ApiResponse<AttendanceSettings>>(
    '/settings/attendance',
    {
      body: { ...input },
      method: 'PATCH',
    },
  )

  return response.data
}

export const getLeaveSettings = async () => {
  const response =
    await apiClient<ApiResponse<LeaveSettings>>('/settings/leave')

  return response.data
}

export const updateLeaveSettings = async (input: UpdateLeaveSettingsInput) => {
  const response = await apiClient<ApiResponse<LeaveSettings>>(
    '/settings/leave',
    {
      body: { ...input },
      method: 'PATCH',
    },
  )

  return response.data
}
