import {
  Banknote,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  Inbox,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { PageHeader } from '@/shared/components/layout/page-header'
import { formatBinaryFileSize } from '@/shared/lib/file-size'
import { formatDate, formatDateOnly } from '@/shared/lib/dates'
import { DashboardError, DashboardLoading } from './dashboard-query-state'
import { EmptyState } from './empty-state'
import { SectionCard } from './section-card'
import { StatCard } from './stat-card'
import { StatusBadge } from './status-badge'
import {
  formatDashboardDateRange,
  formatDashboardMinutes,
  formatDashboardStatus,
} from '../lib/dashboard-formatters'
import { useEmployeeDashboardSummary } from '../hooks/use-employee-dashboard-summary'
import type {
  AttendanceStatus,
  EmployeeRecentAttendanceItem,
  LeaveRequestStatus,
} from '../api/dashboard.api'

const leaveStatusVariant: Record<
  LeaveRequestStatus,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  APPROVED: 'success',
  CANCELLED: 'neutral',
  PENDING: 'warning',
  REJECTED: 'error',
}

const attendanceStatusVariant: Record<
  AttendanceStatus,
  'success' | 'warning' | 'info' | 'neutral'
> = {
  ABSENT: 'neutral',
  LATE: 'warning',
  PARTIAL: 'info',
  PRESENT: 'success',
}

const AttendanceRecordPreview = ({
  record,
}: {
  record: EmployeeRecentAttendanceItem
}) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3">
    <div>
      <p className="text-sm font-semibold text-primary">
        {formatDateOnly(record.date, 'MMM d, yyyy')}
      </p>
      <p className="mt-1 text-xs text-muted">
        {formatDashboardMinutes(record.totalMinutes)}
      </p>
    </div>
    <StatusBadge variant={attendanceStatusVariant[record.status]}>
      {formatDashboardStatus(record.status)}
    </StatusBadge>
  </div>
)

export const EmployeeDashboard = () => {
  const dashboardQuery = useEmployeeDashboardSummary()
  const summary = dashboardQuery.data
  const visibleAttendance = summary?.recentAttendance.slice(0, 3) ?? []
  const additionalAttendance = summary?.recentAttendance.slice(3) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employee dashboard"
        title={
          summary ? `Welcome, ${summary.profileSummary.name}` : 'Dashboard'
        }
        description="Review your attendance, leave, profile, and recent payslip activity."
      />

      {dashboardQuery.isLoading ? <DashboardLoading /> : null}
      {dashboardQuery.isError ? (
        <DashboardError error={dashboardQuery.error} />
      ) : null}
      {summary ? (
        <>
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Self-service dashboard metrics"
          >
            <StatCard
              detail={
                summary.todayAttendanceState?.clockInAt
                  ? `Clocked in ${formatDate(summary.todayAttendanceState.clockInAt, 'p')}`
                  : 'No clock-in recorded'
              }
              icon={CalendarCheck}
              label="Today"
              trend={
                summary.todayAttendanceState
                  ? formatDashboardStatus(summary.todayAttendanceState.status)
                  : 'Not started'
              }
              value={
                summary.todayAttendanceState
                  ? formatDashboardStatus(summary.todayAttendanceState.status)
                  : 'No record'
              }
            />
            <StatCard
              detail="Recorded work time today"
              icon={Clock3}
              label="Hours"
              value={formatDashboardMinutes(
                summary.todayAttendanceState?.totalMinutes ?? null,
              )}
            />
            <StatCard
              detail="Total remaining leave days"
              icon={CalendarDays}
              label="Leave Balance"
              value={String(
                summary.leaveBalanceSummary.reduce(
                  (total, item) => total + item.remaining,
                  0,
                ),
              )}
            />
            <StatCard
              detail={summary.profileSummary.departmentName}
              icon={BriefcaseBusiness}
              label="Role"
              value={summary.profileSummary.jobTitle ?? 'Employee'}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Recent Attendance"
              description="Your latest attendance records."
            >
              {summary.recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {visibleAttendance.map((record) => (
                    <AttendanceRecordPreview key={record.id} record={record} />
                  ))}
                  {additionalAttendance.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="w-full justify-between"
                          type="button"
                          variant="outline"
                        >
                          Show all dates
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="max-h-72 w-[min(24rem,calc(100vw-2rem))] overflow-y-auto border-default bg-elevated p-2 shadow-card"
                      >
                        <div className="space-y-2">
                          {additionalAttendance.map((record) => (
                            <AttendanceRecordPreview
                              key={record.id}
                              record={record}
                            />
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  title="No attendance yet"
                  description="Your recent attendance will appear here."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Leave Balances"
              description="Current year balances by leave type."
            >
              {summary.leaveBalanceSummary.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.leaveBalanceSummary.map((balance) => (
                    <div
                      key={`${balance.leaveTypeName}-${balance.year}`}
                      className="rounded-xl border border-subtle bg-inset p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-primary">
                          {balance.leaveTypeName}
                        </p>
                        <span className="text-sm font-semibold text-brand-text">
                          {balance.remaining}d
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        {balance.used} used of {balance.allocated} allocated
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-subtle">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{
                            width: `${balance.allocated > 0 ? Math.min(100, (balance.used / balance.allocated) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="No balances"
                  description="Leave balances will appear once assigned."
                />
              )}
            </SectionCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <SectionCard
              title="Recent Leave Requests"
              description="Your latest submitted requests."
            >
              {summary.recentLeaveRequests.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentLeaveRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">
                          {request.leaveTypeName}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {formatDashboardDateRange(
                            request.startDate,
                            request.endDate,
                          )}
                        </p>
                      </div>
                      <StatusBadge variant={leaveStatusVariant[request.status]}>
                        {formatDashboardStatus(request.status)}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="No requests"
                  description="Submitted leave requests will appear here."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Latest Payslips"
              description="Recent payslip metadata."
            >
              {summary.latestPayslips.length > 0 ? (
                <div className="space-y-3">
                  {summary.latestPayslips.map((payslip) => (
                    <div
                      key={payslip.id}
                      className="rounded-xl border border-subtle bg-inset p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-brand-soft p-2 text-brand-text">
                          <Banknote className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">
                            {formatDate(
                              new Date(payslip.year, payslip.month - 1),
                              'MMMM yyyy',
                            )}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {payslip.fileName} ·{' '}
                            {formatBinaryFileSize(payslip.fileSize)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No payslips"
                  description="Recent payslip records will appear here."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Profile Summary"
              description="Your core employee record."
            >
              <div className="flex items-center gap-3 rounded-xl border border-subtle bg-inset p-3">
                <Avatar className="bg-brand-soft">
                  <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand-text">
                    {summary.profileSummary.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">
                    {summary.profileSummary.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {summary.profileSummary.employeeCode} ·{' '}
                    {summary.profileSummary.departmentName}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 text-sm">
                <div className="flex justify-between gap-3 rounded-xl border border-subtle bg-inset px-3 py-2">
                  <span className="text-muted">Hire date</span>
                  <span className="font-medium text-primary">
                    {summary.profileSummary.hireDate
                      ? formatDateOnly(
                          summary.profileSummary.hireDate,
                          'MMM d, yyyy',
                        )
                      : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-xl border border-subtle bg-inset px-3 py-2">
                  <span className="text-muted">Department</span>
                  <span className="font-medium text-primary">
                    {summary.profileSummary.departmentName}
                  </span>
                </div>
              </div>
            </SectionCard>
          </section>
        </>
      ) : null}
    </div>
  )
}
