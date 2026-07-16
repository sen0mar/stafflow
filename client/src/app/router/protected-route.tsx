import { RefreshCw } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ApiClientError } from '@/shared/lib/api-client'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { PageErrorState } from '@/shared/components/layout/page-state'
import { Button } from '@/shared/components/ui/button'
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

  if (currentUserQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 py-10">
        <div className="w-full max-w-xl">
          <PageErrorState
            title="We could not confirm your session"
            description="Stafflow could not reach the session service. Your sign-in state has not been changed. Check your connection and try again."
            action={
              <Button
                disabled={currentUserQuery.isFetching}
                type="button"
                onClick={() => void currentUserQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {currentUserQuery.isFetching ? 'Trying again...' : 'Try again'}
              </Button>
            }
          />
        </div>
      </main>
    )
  }

  if (currentUserQuery.data === null) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!currentUserQuery.data) {
    return null
  }

  return <Outlet />
}
