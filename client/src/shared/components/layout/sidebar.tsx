import { BarChart3, LogOut, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import type { AppNavItem } from '@/shared/components/layout/nav-items'

interface SidebarProps {
  email?: string
  isLoggingOut?: boolean
  isMobileOpen?: boolean
  navItems: AppNavItem[]
  role?: string
  onCloseMobile?: () => void
  onLogout: () => void
}

interface SidebarContentProps extends SidebarProps {
  showCloseButton?: boolean
}

const SidebarContent = ({
  email,
  isLoggingOut = false,
  navItems,
  role,
  showCloseButton = false,
  onCloseMobile,
  onLogout,
}: SidebarContentProps) => (
  <div className="flex min-h-full w-full flex-col">
    <div className="mb-6 flex items-center justify-between gap-3 px-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">Stafflow</p>
          <p className="truncate text-xs text-muted">Employee operations</p>
        </div>
      </div>
      {showCloseButton ? (
        <Button
          aria-label="Close navigation"
          className="lg:hidden"
          onClick={onCloseMobile}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>

    <nav className="grid gap-1" aria-label="App navigation">
      {navItems.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onCloseMobile}
          className={({ isActive }: { isActive: boolean }) =>
            cn(
              'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-brand-dim hover:text-primary',
              isActive && 'bg-brand-soft text-brand-text shadow-soft before:absolute before:left-0 before:h-7 before:w-1 before:rounded-full before:bg-brand',
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
        <p className="truncate text-sm font-semibold text-primary">{email ?? 'Signed in'}</p>
        <p className="mt-1 text-xs text-muted">{role === 'ADMIN' ? 'Admin workspace' : 'Employee workspace'}</p>
      </div>
      <Button
        className="mt-3 w-full justify-start gap-2"
        disabled={isLoggingOut}
        onClick={onLogout}
        type="button"
        variant="outline"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {isLoggingOut ? 'Signing out...' : 'Sign out'}
      </Button>
    </div>
  </div>
)

export const Sidebar = (props: SidebarProps) => (
  <>
    <aside className="sticky top-0 hidden h-screen border-r border-default bg-surface/90 px-4 py-5 shadow-soft lg:flex" aria-label="Application sidebar">
      <SidebarContent {...props} />
    </aside>
    <div
      className={cn(
        'fixed inset-0 z-40 bg-base/70 backdrop-blur-sm transition lg:hidden',
        props.isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden="true"
      onClick={props.onCloseMobile}
    />
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[292px] border-r border-default bg-surface/95 px-4 py-5 shadow-card transition-transform duration-200 lg:hidden',
        props.isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
      aria-hidden={!props.isMobileOpen}
      aria-label="Application sidebar"
    >
      <SidebarContent {...props} showCloseButton />
    </aside>
  </>
)
