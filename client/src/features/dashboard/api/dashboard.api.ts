import { apiClient } from '@/shared/lib/api-client'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'PARTIAL'
export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
export type LeaveRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export interface AdminAttendanceOverviewPoint {
  absent: number
  date: string
  late: number
  partial: number
  present: number
}

export interface RecentDashboardEmployee {
  createdAt: string
  departmentName: string
  id: string
  initials: string
  jobTitle: string | null
  name: string
  status: EmploymentStatus
}

export interface DepartmentDistributionItem {
  departmentId: string | null
  departmentName: string
  employeeCount: number
  percentage: number
}

export interface PendingLeaveRequestPreviewItem {
  createdAt: string
  employeeName: string
  endDate: string
  id: string
  leaveTypeName: string
  startDate: string
  totalDays: number
}

export interface AdminDashboardSummary {
  attendanceOverview: AdminAttendanceOverviewPoint[]
  departmentDistribution: DepartmentDistributionItem[]
  onLeaveToday: number
  pendingLeaveRequestPreview: PendingLeaveRequestPreviewItem[]
  pendingLeaveRequests: number
  presentToday: number
  recentEmployees: RecentDashboardEmployee[]
  totalEmployees: number
}

export interface TodayAttendanceState {
  clockInAt: string | null
  clockOutAt: string | null
  status: AttendanceStatus
  totalMinutes: number | null
}

export interface EmployeeRecentAttendanceItem extends TodayAttendanceState {
  date: string
  id: string
}

export interface LeaveBalanceSummaryItem {
  allocated: number
  leaveTypeName: string
  remaining: number
  used: number
  year: number
}

export interface EmployeeRecentLeaveRequestItem {
  createdAt: string
  endDate: string
  id: string
  leaveTypeName: string
  startDate: string
  status: LeaveRequestStatus
  totalDays: number
}

export interface LatestPayslipItem {
  fileName: string
  fileSize: number
  id: string
  month: number
  uploadedAt: string
  year: number
}

export interface ProfileSummary {
  departmentName: string
  employeeCode: string
  employeeId: string
  hireDate: string | null
  initials: string
  jobTitle: string | null
  name: string
}

export interface EmployeeDashboardSummary {
  latestPayslips: LatestPayslipItem[]
  leaveBalanceSummary: LeaveBalanceSummaryItem[]
  profileSummary: ProfileSummary
  recentAttendance: EmployeeRecentAttendanceItem[]
  recentLeaveRequests: EmployeeRecentLeaveRequestItem[]
  todayAttendanceState: TodayAttendanceState | null
}

interface DashboardResponse<TData> {
  data: TData
}

export const getAdminDashboardSummary = async () => {
  const response = await apiClient<DashboardResponse<AdminDashboardSummary>>(
    '/dashboard/admin-summary',
  )

  return response.data
}

export const getEmployeeDashboardSummary = async () => {
  const response =
    await apiClient<DashboardResponse<EmployeeDashboardSummary>>(
      '/dashboard/me',
    )

  return response.data
}
