import {
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'

const appNavItems = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/app/employees', icon: UsersRound },
  { label: 'Departments', path: '/app/departments', icon: Building2 },
  { label: 'Attendance', path: '/app/attendance', icon: CalendarCheck },
  { label: 'Leave Requests', path: '/app/leave-requests', icon: ClipboardList },
  { label: 'Payslips', path: '/app/payslips', icon: FileText },
  { label: 'Settings', path: '/app/settings', icon: Settings },
  { label: 'Audit Logs', path: '/app/audit-logs', icon: ScrollText },
]

export const AppShell = () => (
  <div className="min-h-screen bg-base text-primary">
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-default bg-surface/90 px-4 py-5 shadow-soft lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-primary-foreground shadow-glow">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Stafflow</p>
            <p className="text-xs text-muted">Employee operations</p>
          </div>
        </div>

        <nav className="grid gap-1" aria-label="App navigation">
          {appNavItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-brand-dim hover:text-primary',
                  isActive && 'bg-brand-soft text-brand-text',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="px-5 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
)
