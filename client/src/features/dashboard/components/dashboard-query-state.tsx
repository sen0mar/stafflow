import { QueryStateError } from '@/shared/components/layout/page-state'
import { SectionCardSkeleton, StatCardSkeleton } from './loading-skeletons'

export const DashboardLoading = () => (
  <div className="space-y-6">
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Loading dashboard metrics"
    >
      {Array.from({ length: 4 }, (_item, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </section>
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <SectionCardSkeleton />
      <SectionCardSkeleton />
    </section>
    <section className="grid gap-6 lg:grid-cols-3">
      <SectionCardSkeleton />
      <SectionCardSkeleton />
      <SectionCardSkeleton />
    </section>
  </div>
)

export const DashboardError = ({ error }: { error: unknown }) => (
  <QueryStateError
    error={error}
    title="Dashboard unavailable"
    description="The dashboard summary could not be loaded. Please refresh the page or try again after a moment."
  />
)
