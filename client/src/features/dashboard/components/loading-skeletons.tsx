import { Skeleton } from '@/shared/components/ui/skeleton'

export const StatCardSkeleton = () => (
  <div className="rounded-2xl border border-default bg-elevated p-4 shadow-soft">
    <Skeleton className="h-11 w-11 rounded-xl" />
    <Skeleton className="mt-4 h-4 w-28" />
    <Skeleton className="mt-3 h-8 w-20" />
    <Skeleton className="mt-3 h-3 w-32" />
  </div>
)

export const SectionCardSkeleton = () => (
  <div className="rounded-2xl border border-default bg-elevated p-5 shadow-soft">
    <Skeleton className="h-5 w-36" />
    <Skeleton className="mt-2 h-4 w-48" />
    <div className="mt-6 space-y-3">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  </div>
)
