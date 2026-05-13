import { Menu } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ThemeToggle } from '@/shared/components/ui/theme-toggle'

interface TopbarProps {
  email?: string
  role?: string
  onOpenSidebar: () => void
}

export const Topbar = ({ email, role, onOpenSidebar }: TopbarProps) => (
  <header className="sticky top-0 z-30 border-b border-default bg-overlay px-5 py-3 backdrop-blur sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          aria-label="Open navigation"
          className="lg:hidden"
          onClick={onOpenSidebar}
          size="icon"
          type="button"
          variant="outline"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">
            Stafflow workspace
          </p>
          <p className="truncate text-xs text-muted">
            {role === 'ADMIN' ? 'Admin controls' : 'Self-service tools'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-52 truncate text-sm font-medium text-primary">
            {email ?? 'Signed in'}
          </p>
          <p className="text-xs text-muted">{role ?? 'USER'}</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  </header>
)
