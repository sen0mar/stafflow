import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ApiClientError } from '@/shared/lib/api-client'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { Skeleton } from '@/shared/components/ui/skeleton'

export const ProtectedRoute = () => {
  const location = useLocation()
  const currentUserQuery = useCurrentUser()

  if (currentUserQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base px-5">
        <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-card">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (
    currentUserQuery.isError &&
    currentUserQuery.error instanceof ApiClientError &&
    currentUserQuery.error.status === 401
  ) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
