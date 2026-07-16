import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  Inbox,
  UserRound,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { PageHeader } from '@/shared/components/layout/page-header'
import { formatDate } from '@/shared/lib/dates'
import { AttendanceChart } from './attendance-chart'
import { DashboardError, DashboardLoading } from './dashboard-query-state'
import { EmptyState } from './empty-state'
import { SectionCard } from './section-card'
import { StatCard } from './stat-card'
import { StatusBadge } from './status-badge'
import {
  formatDashboardDateRange,
  formatDashboardStatus,
  getLeavePriority,
} from '../lib/dashboard-formatters'
import { useAdminDashboardSummary } from '../hooks/use-admin-dashboard-summary'
import type { EmploymentStatus } from '../api/dashboard.api'

const employeeStatusVariant: Record<
  EmploymentStatus,
  'success' | 'warning' | 'error'
> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TERMINATED: 'error',
}

export const AdminDashboard = () => {
  const dashboardQuery = useAdminDashboardSummary()
  const summary = dashboardQuery.data
  const pendingLeaveRequestPreview = summary
    ? [...summary.pendingLeaveRequestPreview].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime() ||
          first.startDate.localeCompare(second.startDate),
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
      {dashboardQuery.isError ? (
        <DashboardError error={dashboardQuery.error} />
      ) : null}
      {summary ? (
        <>
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Dashboard metrics"
          >
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
              action={
                <span className="rounded-xl border border-default px-2.5 py-1 text-xs text-muted">
                  Last 7 Days
                </span>
              }
            >
              <div className="mb-1 flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full bg-brand"
                    aria-hidden="true"
                  />
                  Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full bg-chart-secondary"
                    aria-hidden="true"
                  />
                  Absent
                </span>
              </div>
              <AttendanceChart data={summary.attendanceOverview} />
            </SectionCard>

            <SectionCard
              title="Leave Requests"
              description="Latest pending requests awaiting action."
            >
              {pendingLeaveRequestPreview.length > 0 ? (
                <div className="space-y-3">
                  {pendingLeaveRequestPreview.map((request) => {
                    const priority = getLeavePriority(request.startDate)

                    return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">
                            {request.employeeName}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {request.leaveTypeName} ·{' '}
                            {formatDashboardDateRange(
                              request.startDate,
                              request.endDate,
                            )}
                          </p>
                          <p className="mt-1 truncate text-xs text-faint">
                            Requested {formatDate(request.createdAt, 'MMM d')}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {priority ? (
                            <StatusBadge variant={priority.variant}>
                              {priority.label}
                            </StatusBadge>
                          ) : null}
                          <StatusBadge variant="warning">{`${request.totalDays}d`}</StatusBadge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="No pending requests"
                  description="New leave requests will appear here."
                />
              )}
            </SectionCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.9fr_0.7fr_0.7fr]">
            <SectionCard
              title="Recent Employees"
              description="New and recently created employee records."
            >
              {summary.recentEmployees.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="bg-brand-soft">
                          <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand-text">
                            {employee.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">
                            {employee.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {employee.jobTitle ?? 'No role'} ·{' '}
                            {employee.departmentName}
                          </p>
                        </div>
                      </div>
                      <StatusBadge
                        variant={employeeStatusVariant[employee.status]}
                      >
                        {formatDashboardStatus(employee.status)}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={UserRound}
                  title="No employees yet"
                  description="Recently created employees will appear here."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Departments"
              description="Current employee distribution."
            >
              {summary.departmentDistribution.length > 0 ? (
                <div className="space-y-4">
                  {summary.departmentDistribution.map((department) => (
                    <div key={department.departmentId ?? 'unassigned'}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-primary">
                          {department.departmentName}
                        </span>
                        <span className="text-muted">
                          {department.employeeCount}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-inset">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${department.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="No departments"
                  description="Department distribution will appear here."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Today Snapshot"
              description="Quick operational status."
            >
              <div className="grid gap-3">
                <div className="rounded-xl border border-subtle bg-inset p-3">
                  <p className="text-xs font-medium text-muted">
                    Attendance coverage
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    {attendanceRate}%
                  </p>
                </div>
                <div className="rounded-xl border border-subtle bg-inset p-3">
                  <p className="text-xs font-medium text-muted">
                    Pending leave queue
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    {summary.pendingLeaveRequests}
                  </p>
                </div>
              </div>
            </SectionCard>
          </section>
        </>
      ) : null}
    </div>
  )
}
