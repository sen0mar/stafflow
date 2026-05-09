import {
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  Inbox,
  UserRound,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { PageHeader } from '@/shared/components/layout/page-header'
import { formatDate } from '@/shared/lib/dates'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { AttendanceChart } from '../components/attendance-chart'
import { EmptyState } from '../components/empty-state'
import { SectionCard } from '../components/section-card'
import { StatCard } from '../components/stat-card'
import { StatusBadge } from '../components/status-badge'
import { SectionCardSkeleton, StatCardSkeleton } from '../components/loading-skeletons'
import { useAdminDashboardSummary } from '../hooks/use-admin-dashboard-summary'
import { useEmployeeDashboardSummary } from '../hooks/use-employee-dashboard-summary'
import type { AttendanceStatus, EmployeeRecentAttendanceItem, EmploymentStatus, LeaveRequestStatus } from '../api/dashboard.api'

const leaveStatusVariant: Record<LeaveRequestStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  APPROVED: 'success',
  CANCELLED: 'neutral',
  PENDING: 'warning',
  REJECTED: 'error',
}

const attendanceStatusVariant: Record<AttendanceStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  ABSENT: 'neutral',
  LATE: 'warning',
  PARTIAL: 'info',
  PRESENT: 'success',
}

const employeeStatusVariant: Record<EmploymentStatus, 'success' | 'warning' | 'error'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TERMINATED: 'error',
}

const formatStatus = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

const formatDateRange = (startDate: string, endDate: string) => {
  const start = formatDate(startDate, 'MMM d')
  const end = formatDate(endDate, 'MMM d')

  return start === end ? start : `${start} - ${end}`
}

const formatMinutes = (minutes: number | null) => {
  if (minutes === null) {
    return 'Not recorded'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getDaysUntil = (date: string) => {
  const start = new Date(date)
  const today = new Date()
  const startOfLeaveDate = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  return Math.ceil((startOfLeaveDate - startOfToday) / 86_400_000)
}

const getLeavePriority = (startDate: string) => {
  const daysUntil = getDaysUntil(startDate)

  if (daysUntil <= 1) {
    return { label: 'Urgent', variant: 'error' as const }
  }

  if (daysUntil <= 3) {
    return { label: 'Soon', variant: 'warning' as const }
  }

  if (daysUntil <= 7) {
    return { label: 'Upcoming', variant: 'info' as const }
  }

  return null
}

const DashboardLoading = () => (
  <div className="space-y-6">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard metrics">
      {Array.from({ length: 4 }, (_item, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </section>
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <SectionCardSkeleton />
      <SectionCardSkeleton />
    </section>
    <section className="grid gap-6 lg:grid-cols-3">
      <SectionCardSkeleton />
      <SectionCardSkeleton />
      <SectionCardSkeleton />
    </section>
  </div>
)

const DashboardError = () => (
  <SectionCard title="Dashboard unavailable" description="The dashboard summary could not be loaded.">
    <EmptyState
      icon={Inbox}
      title="Unable to load dashboard"
      description="Please refresh the page or try again after a moment."
    />
  </SectionCard>
)

const AttendanceRecordPreview = ({ record }: { record: EmployeeRecentAttendanceItem }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3">
    <div>
      <p className="text-sm font-semibold text-primary">{formatDate(record.date, 'MMM d, yyyy')}</p>
      <p className="mt-1 text-xs text-muted">{formatMinutes(record.totalMinutes)}</p>
    </div>
    <StatusBadge variant={attendanceStatusVariant[record.status]}>{formatStatus(record.status)}</StatusBadge>
  </div>
)

const AdminDashboard = () => {
  const dashboardQuery = useAdminDashboardSummary()
  const summary = dashboardQuery.data
  const pendingLeaveRequestPreview = summary
    ? [...summary.pendingLeaveRequestPreview].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime() ||
          new Date(first.startDate).getTime() - new Date(second.startDate).getTime(),
      )
    : []
  const attendanceRate =
    summary && summary.totalEmployees > 0
      ? Math.round((summary.presentToday / summary.totalEmployees) * 100)
      : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Dashboard"
        description="Monitor attendance, leave activity, employee movement, and team distribution."
        actions={[
          <Button key="add-employee" type="button">
            <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
            Add employee
          </Button>,
          <Button key="upload-payslip" type="button" variant="outline">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Upload payslip
          </Button>,
        ]}
      />

      {dashboardQuery.isLoading ? <DashboardLoading /> : null}
      {dashboardQuery.isError ? <DashboardError /> : null}
      {summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard metrics">
            <StatCard
              detail="Active employee records"
              icon={UsersRound}
              label="Total Employees"
              trend="Live"
              value={String(summary.totalEmployees)}
            />
            <StatCard
              detail={`${attendanceRate}% attendance rate`}
              icon={CalendarCheck}
              label="Present Today"
              trend="Today"
              value={String(summary.presentToday)}
            />
            <StatCard
              detail="Approved leave covering today"
              icon={CalendarDays}
              label="On Leave Today"
              trend="Today"
              value={String(summary.onLeaveToday)}
            />
            <StatCard
              detail="Awaiting admin review"
              icon={Clock3}
              label="Pending Requests"
              trend="Review"
              value={String(summary.pendingLeaveRequests)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <SectionCard
              title="Attendance Overview"
              description="Present and absent trend across the last seven days."
              action={<span className="rounded-xl border border-default px-2.5 py-1 text-xs text-muted">Last 7 Days</span>}
            >
              <div className="mb-1 flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                  Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-chart-secondary" aria-hidden="true" />
                  Absent
                </span>
              </div>
              <AttendanceChart data={summary.attendanceOverview} />
            </SectionCard>

            <SectionCard title="Leave Requests" description="Latest pending requests awaiting action.">
              {pendingLeaveRequestPreview.length > 0 ? (
                <div className="space-y-3">
                  {pendingLeaveRequestPreview.map((request) => {
                    const priority = getLeavePriority(request.startDate)

                    return (
                      <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">{request.employeeName}</p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {request.leaveTypeName} · {formatDateRange(request.startDate, request.endDate)}
                          </p>
                          <p className="mt-1 truncate text-xs text-faint">Requested {formatDate(request.createdAt, 'MMM d')}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {priority ? <StatusBadge variant={priority.variant}>{priority.label}</StatusBadge> : null}
                          <StatusBadge variant="warning">{`${request.totalDays}d`}</StatusBadge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState icon={Inbox} title="No pending requests" description="New leave requests will appear here." />
              )}
            </SectionCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.9fr_0.7fr_0.7fr]">
            <SectionCard title="Recent Employees" description="New and recently created employee records.">
              {summary.recentEmployees.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="bg-brand-soft">
                          <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand-text">
                            {employee.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">{employee.name}</p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {employee.jobTitle ?? 'No role'} · {employee.departmentName}
                          </p>
                        </div>
                      </div>
                      <StatusBadge variant={employeeStatusVariant[employee.status]}>{formatStatus(employee.status)}</StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={UserRound} title="No employees yet" description="Recently created employees will appear here." />
              )}
            </SectionCard>

            <SectionCard title="Departments" description="Current employee distribution.">
              {summary.departmentDistribution.length > 0 ? (
                <div className="space-y-4">
                  {summary.departmentDistribution.map((department) => (
                    <div key={department.departmentId ?? 'unassigned'}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-primary">{department.departmentName}</span>
                        <span className="text-muted">{department.employeeCount}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-inset">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${department.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Building2} title="No departments" description="Department distribution will appear here." />
              )}
            </SectionCard>

            <SectionCard title="Today Snapshot" description="Quick operational status.">
              <div className="grid gap-3">
                <div className="rounded-xl border border-subtle bg-inset p-3">
                  <p className="text-xs font-medium text-muted">Attendance coverage</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">{attendanceRate}%</p>
                </div>
                <div className="rounded-xl border border-subtle bg-inset p-3">
                  <p className="text-xs font-medium text-muted">Pending leave queue</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">{summary.pendingLeaveRequests}</p>
                </div>
              </div>
            </SectionCard>
          </section>
        </>
      ) : null}
    </div>
  )
}

const EmployeeDashboard = () => {
  const dashboardQuery = useEmployeeDashboardSummary()
  const summary = dashboardQuery.data
  const visibleAttendance = summary?.recentAttendance.slice(0, 3) ?? []
  const additionalAttendance = summary?.recentAttendance.slice(3) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employee dashboard"
        title={summary ? `Welcome, ${summary.profileSummary.name}` : 'Dashboard'}
        description="Review your attendance, leave, profile, and recent payslip activity."
      />

      {dashboardQuery.isLoading ? <DashboardLoading /> : null}
      {dashboardQuery.isError ? <DashboardError /> : null}
      {summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Self-service dashboard metrics">
            <StatCard
              detail={summary.todayAttendanceState?.clockInAt ? `Clocked in ${formatDate(summary.todayAttendanceState.clockInAt, 'p')}` : 'No clock-in recorded'}
              icon={CalendarCheck}
              label="Today"
              trend={summary.todayAttendanceState ? formatStatus(summary.todayAttendanceState.status) : 'Not started'}
              value={summary.todayAttendanceState ? formatStatus(summary.todayAttendanceState.status) : 'No record'}
            />
            <StatCard
              detail="Recorded work time today"
              icon={Clock3}
              label="Hours"
              value={formatMinutes(summary.todayAttendanceState?.totalMinutes ?? null)}
            />
            <StatCard
              detail="Total remaining leave days"
              icon={CalendarDays}
              label="Leave Balance"
              value={String(summary.leaveBalanceSummary.reduce((total, item) => total + item.remaining, 0))}
            />
            <StatCard
              detail={summary.profileSummary.departmentName}
              icon={BriefcaseBusiness}
              label="Role"
              value={summary.profileSummary.jobTitle ?? 'Employee'}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard title="Recent Attendance" description="Your latest attendance records.">
              {summary.recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {visibleAttendance.map((record) => (
                    <AttendanceRecordPreview key={record.id} record={record} />
                  ))}
                  {additionalAttendance.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full justify-between" type="button" variant="outline">
                          Show all dates
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="max-h-72 w-[min(24rem,calc(100vw-2rem))] overflow-y-auto border-default bg-elevated p-2 shadow-card">
                        <div className="space-y-2">
                          {additionalAttendance.map((record) => (
                            <AttendanceRecordPreview key={record.id} record={record} />
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              ) : (
                <EmptyState icon={CalendarCheck} title="No attendance yet" description="Your recent attendance will appear here." />
              )}
            </SectionCard>

            <SectionCard title="Leave Balances" description="Current year balances by leave type.">
              {summary.leaveBalanceSummary.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.leaveBalanceSummary.map((balance) => (
                    <div key={`${balance.leaveTypeName}-${balance.year}`} className="rounded-xl border border-subtle bg-inset p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-primary">{balance.leaveTypeName}</p>
                        <span className="text-sm font-semibold text-brand-text">{balance.remaining}d</span>
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        {balance.used} used of {balance.allocated} allocated
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-subtle">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${balance.allocated > 0 ? Math.min(100, (balance.used / balance.allocated) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CalendarDays} title="No balances" description="Leave balances will appear once assigned." />
              )}
            </SectionCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <SectionCard title="Recent Leave Requests" description="Your latest submitted requests.">
              {summary.recentLeaveRequests.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentLeaveRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{request.leaveTypeName}</p>
                        <p className="mt-1 truncate text-xs text-muted">{formatDateRange(request.startDate, request.endDate)}</p>
                      </div>
                      <StatusBadge variant={leaveStatusVariant[request.status]}>{formatStatus(request.status)}</StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Inbox} title="No requests" description="Submitted leave requests will appear here." />
              )}
            </SectionCard>

            <SectionCard title="Latest Payslips" description="Recent payslip metadata.">
              {summary.latestPayslips.length > 0 ? (
                <div className="space-y-3">
                  {summary.latestPayslips.map((payslip) => (
                    <div key={payslip.id} className="rounded-xl border border-subtle bg-inset p-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-brand-soft p-2 text-brand-text">
                          <Banknote className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">{formatDate(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')}</p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {payslip.fileName} · {formatFileSize(payslip.fileSize)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={FileText} title="No payslips" description="Recent payslip records will appear here." />
              )}
            </SectionCard>

            <SectionCard title="Profile Summary" description="Your core employee record.">
              <div className="flex items-center gap-3 rounded-xl border border-subtle bg-inset p-3">
                <Avatar className="bg-brand-soft">
                  <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand-text">
                    {summary.profileSummary.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">{summary.profileSummary.name}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {summary.profileSummary.employeeCode} · {summary.profileSummary.departmentName}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 text-sm">
                <div className="flex justify-between gap-3 rounded-xl border border-subtle bg-inset px-3 py-2">
                  <span className="text-muted">Hire date</span>
                  <span className="font-medium text-primary">
                    {summary.profileSummary.hireDate ? formatDate(summary.profileSummary.hireDate, 'MMM d, yyyy') : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-xl border border-subtle bg-inset px-3 py-2">
                  <span className="text-muted">Department</span>
                  <span className="font-medium text-primary">{summary.profileSummary.departmentName}</span>
                </div>
              </div>
            </SectionCard>
          </section>
        </>
      ) : null}
    </div>
  )
}

export const DashboardPage = () => {
  const currentUserQuery = useCurrentUser()

  return currentUserQuery.data?.role === 'ADMIN' ? <AdminDashboard /> : <EmployeeDashboard />
}
