import { previewNavItems, leaveRequestPreviews, metrics } from './landing-data'
import { AttendancePreviewChart } from './attendance-preview-chart'
import { LandingBrandMark } from './landing-brand-mark'
import { LandingIconWell } from './landing-icon-well'
import { Avatar, AvatarBadge, AvatarFallback } from '@/shared/components/ui/avatar'
import { cn } from '@/shared/lib/utils'

export const DashboardPreview = () => (
  <section
    aria-label="Dashboard preview"
    className="relative rounded-3xl border border-strong bg-hero-glow bg-overlay p-3 shadow-card backdrop-blur xl:p-4"
  >
    <div className="grid overflow-hidden rounded-[1.25rem] border border-default bg-surface lg:grid-cols-[170px_1fr]">
      <aside className="hidden border-r border-default bg-inset p-5 lg:block">
        <LandingBrandMark compact />
        <nav className="mt-8 space-y-2">
          {previewNavItems.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted',
                label === 'Dashboard' && 'bg-brand-soft text-brand-text',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-primary sm:text-2xl">Dashboard</h2>
            <p className="mt-1 text-xs font-medium text-muted">Overview of your organization</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-default bg-elevated px-2 py-1 shadow-soft">
            <Avatar size="sm" className="overflow-visible bg-brand-soft ring-2 ring-brand-soft">
              <AvatarFallback className="bg-brand-soft text-[10px] font-semibold text-brand-text">
                AD
              </AvatarFallback>
              <AvatarBadge className="bg-success ring-elevated" />
            </Avatar>
            <span className="hidden text-xs font-medium text-secondary sm:inline">Admin</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-default bg-elevated p-3 shadow-soft">
              <LandingIconWell icon={metric.icon} className="h-9 w-9 rounded-xl" />
              <p className="mt-3 text-[11px] font-medium text-muted">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold text-primary">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-default bg-elevated p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Attendance Overview</h3>
              <span className="rounded-xl border border-default px-2 py-1 text-[11px] text-muted">Last 7 Days</span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-secondary" aria-hidden="true" />
                Absent
              </span>
            </div>
            <AttendancePreviewChart />
          </div>

          <div className="rounded-2xl border border-default bg-elevated p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Leave Requests</h3>
              <span className="text-xs font-medium text-brand-text">View All</span>
            </div>
            <div className="mt-4 space-y-3">
              {leaveRequestPreviews.map((request) => (
                <div key={request.name} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="overflow-visible bg-brand-soft ring-2 ring-brand-soft">
                      <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand-text">
                        {request.initials}
                      </AvatarFallback>
                      <AvatarBadge className="bg-success ring-elevated" />
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-primary">{request.name}</p>
                      <p className="truncate text-[11px] text-muted">Annual Leave</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-medium text-brand-text">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)
