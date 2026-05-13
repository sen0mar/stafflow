import { Skeleton } from '@/shared/components/ui/skeleton'

export const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-base px-5">
    <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-card">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
    </div>
  </div>
)
