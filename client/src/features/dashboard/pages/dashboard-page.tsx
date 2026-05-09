import { CalendarDays, Inbox } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { PageHeader } from '@/shared/components/layout/page-header'
import { AttendanceChart } from '../components/attendance-chart'
import { dashboardActions, dashboardStats, departmentShares, leaveRequests, recentEmployees } from '../components/dashboard-data'
import { EmptyState } from '../components/empty-state'
import { SectionCard } from '../components/section-card'
import { StatCard } from '../components/stat-card'
import { StatusBadge } from '../components/status-badge'

const leaveStatusVariant = {
  Approved: 'success',
  'In Review': 'info',
  Pending: 'warning',
} as const

const employeeStatusVariant = {
  Active: 'success',
  Onboarding: 'brand',
} as const

export const DashboardPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Admin dashboard"
      title="Dashboard"
      description="Monitor attendance, leave activity, employee movement, and team distribution from one reusable shell."
      actions={dashboardActions.map(({ label, icon: Icon }) => (
        <Button key={label} type="button" variant={label === 'Add employee' ? 'default' : 'outline'}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </Button>
      ))}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard metrics">
      {dashboardStats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
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
        <AttendanceChart />
      </SectionCard>

      <SectionCard title="Leave Requests" description="Latest requests awaiting action or review.">
        <div className="space-y-3">
          {leaveRequests.map((request) => (
            <div key={`${request.employee}-${request.date}`} className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{request.employee}</p>
                <p className="mt-1 truncate text-xs text-muted">
                  {request.type} · {request.date}
                </p>
              </div>
              <StatusBadge variant={leaveStatusVariant[request.status]}>{request.status}</StatusBadge>
            </div>
          ))}
        </div>
      </SectionCard>
    </section>

    <section className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.9fr_0.7fr_0.7fr]">
      <SectionCard title="Recent Employees" description="New and recently updated employee records." className="xl:col-span-1">
        <div className="space-y-3">
          {recentEmployees.map((employee) => (
            <div key={employee.name} className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-inset p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="bg-brand-soft">
                  <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand-text">
                    {employee.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">{employee.name}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {employee.role} · {employee.department}
                  </p>
                </div>
              </div>
              <StatusBadge variant={employeeStatusVariant[employee.status]}>{employee.status}</StatusBadge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Departments" description="Current employee distribution.">
        <div className="space-y-4">
          {departmentShares.map((department) => (
            <div key={department.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-primary">{department.label}</span>
                <span className="text-muted">{department.count}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-inset">
                <div className={`${department.width} h-full rounded-full bg-brand`} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Upcoming" description="Reusable empty state for quieter panels.">
        <EmptyState
          icon={CalendarDays}
          title="No reviews scheduled"
          description="Performance and compliance reminders will appear here once those workflows are added."
        />
      </SectionCard>
    </section>

    <div className="sr-only">
      <EmptyState icon={Inbox} title="No dashboard data" description="Fallback state for future dashboard API loading." />
    </div>
  </div>
)
