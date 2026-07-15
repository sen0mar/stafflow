import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { appNavItems } from '@/shared/components/layout/nav-items'
import { Sidebar } from '@/shared/components/layout/sidebar'
import { Topbar } from '@/shared/components/layout/topbar'

export const AppShell = () => {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const currentUserQuery = useCurrentUser()
  const logoutMutation = useLogout()
  const user = currentUserQuery.data
  const visibleNavItems = appNavItems.filter(
    (item) =>
      (!item.adminOnly || user?.role === 'ADMIN') &&
      (!item.requiresEmployeeProfile || Boolean(user?.employee)),
  )

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate('/login', { replace: true })
      },
    })
  }

  return (
    <div className="min-h-screen bg-base text-primary">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr] min-[2200px]:!grid-cols-[320px_1fr]">
        <Sidebar
          email={user?.email}
          isLoggingOut={logoutMutation.isPending}
          isMobileOpen={isSidebarOpen}
          navItems={visibleNavItems}
          role={user?.role}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />
        <div className="min-w-0">
          <Topbar
            email={user?.email}
            role={user?.role}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
          <main className="px-5 py-6 sm:px-6 lg:px-8 2xl:px-10">
            <div className="mx-auto max-w-7xl 2xl:max-w-[1760px] min-[2200px]:!max-w-none">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
