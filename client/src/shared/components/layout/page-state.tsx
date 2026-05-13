import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, LockKeyhole, RefreshCw } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { isApiStatus } from '@/shared/lib/api-errors'
import { cn } from '@/shared/lib/cn'

interface EmptyStateProps {
  className?: string
  description: string
  icon: LucideIcon
  title: string
}

export const EmptyState = ({
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) => (
  <div className={cn('rounded-2xl border border-dashed border-default bg-surface px-6 py-12 text-center shadow-soft', className)}>
    <Icon className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
    <h2 className="mt-4 text-lg font-semibold text-primary">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
  </div>
)

interface ErrorStateProps {
  action?: ReactNode
  className?: string
  description: string
  icon?: LucideIcon
  title: string
}

export const PageErrorState = ({
  action,
  className,
  description,
  icon: Icon = AlertTriangle,
  title,
}: ErrorStateProps) => (
  <section className={cn('rounded-2xl border border-default bg-surface p-6 shadow-card', className)}>
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <h1 className="text-xl font-semibold tracking-normal text-primary">{title}</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </section>
)

export const InlineErrorState = ({
  className,
  description,
  title,
}: Pick<ErrorStateProps, 'className' | 'description' | 'title'>) => (
  <div className={cn('rounded-xl border border-default bg-inset p-6 text-sm text-muted', className)}>
    <p className="font-medium text-primary">{title}</p>
    <p className="mt-1 leading-6">{description}</p>
  </div>
)

interface QueryStateErrorProps {
  description: string
  error: unknown
  title: string
}

export const QueryStateError = ({ description, error, title }: QueryStateErrorProps) => {
  if (isApiStatus(error, 403)) {
    return (
      <UnauthorizedState description="Your account does not have permission to view this information." />
    )
  }

  return <InlineErrorState title={title} description={description} />
}

interface UnauthorizedStateProps {
  className?: string
  description?: string
}

export const UnauthorizedState = ({
  className,
  description = 'Your account does not have access to this area. Contact an admin if this looks wrong.',
}: UnauthorizedStateProps) => (
  <PageErrorState
    className={className}
    description={description}
    icon={LockKeyhole}
    title="You do not have access"
    action={
      <Button asChild variant="outline">
        <Link to="/app/dashboard">Back to dashboard</Link>
      </Button>
    }
  />
)

interface TableSkeletonProps {
  className?: string
  rows?: number
}

export const TableSkeleton = ({ className, rows = 6 }: TableSkeletonProps) => (
  <div className={cn('space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft', className)}>
    {Array.from({ length: rows }, (_item, index) => (
      <Skeleton key={index} className="h-12 w-full rounded-xl" />
    ))}
  </div>
)

export const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 rounded-2xl" />
    <Skeleton className="h-64 rounded-2xl" />
    <Skeleton className="h-64 rounded-2xl" />
  </div>
)

export const RouteErrorBoundary = () => {
  const error = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-5 py-10">
      <div className="w-full max-w-xl">
        <PageErrorState
          title={isNotFound ? 'This page is not available' : 'Something went wrong'}
          description={
            isNotFound
              ? 'The requested route does not exist in Stafflow.'
              : 'The page could not be rendered. Refresh the page or return to the dashboard.'
          }
          action={
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </Button>
              <Button asChild variant="outline">
                <Link to="/app/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          }
        />
      </div>
    </main>
  )
}

export const AppRouteErrorBoundary = () => (
  <div className="space-y-6">
    <PageErrorState
      title="This workspace view could not load"
      description="Refresh the page or return to the dashboard. The error details are hidden to keep Stafflow data safe."
      action={
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      }
    />
  </div>
)
