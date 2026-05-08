import {
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  LogOut,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useLogout } from '@/features/auth/hooks/use-logout'

const appNavItems = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/app/employees', icon: UsersRound, adminOnly: true },
  { label: 'Departments', path: '/app/departments', icon: Building2, adminOnly: true },
  { label: 'Attendance', path: '/app/attendance', icon: CalendarCheck },
  { label: 'Leave Requests', path: '/app/leave-requests', icon: ClipboardList },
  { label: 'Payslips', path: '/app/payslips', icon: FileText },
  { label: 'Settings', path: '/app/settings', icon: Settings, adminOnly: true },
  { label: 'Audit Logs', path: '/app/audit-logs', icon: ScrollText, adminOnly: true },
]

export const AppShell = () => {
  const navigate = useNavigate()
  const currentUserQuery = useCurrentUser()
  const logoutMutation = useLogout()
  const user = currentUserQuery.data
  const visibleNavItems = appNavItems.filter((item) => !item.adminOnly || user?.role === 'ADMIN')

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate('/login', { replace: true })
      },
    })
  }

  return (
    <div className="min-h-screen bg-base text-primary">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="flex border-b border-default bg-surface/90 px-4 py-5 shadow-soft lg:border-b-0 lg:border-r">
          <div className="flex min-h-full w-full flex-col">
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
              {visibleNavItems.map(({ label, path, icon: Icon }) => (
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

            <div className="mt-6 border-t border-subtle pt-4 lg:mt-auto">
              <div className="rounded-2xl border border-default bg-elevated p-3">
                <p className="truncate text-sm font-semibold text-primary">{user?.email ?? 'Signed in'}</p>
                <p className="mt-1 text-xs text-muted">{user?.role === 'ADMIN' ? 'Admin workspace' : 'Employee workspace'}</p>
              </div>
              <Button
                className="mt-3 w-full justify-start gap-2"
                disabled={logoutMutation.isPending}
                onClick={handleLogout}
                type="button"
                variant="outline"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          </div>
        </aside>

        <main className="px-5 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
