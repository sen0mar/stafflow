import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  description: string
  icon: LucideIcon
  title: string
}

export const EmptyState = ({ description, icon: Icon, title }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-default bg-inset px-6 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-base font-semibold text-primary">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
  </div>
)
