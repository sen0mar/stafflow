import type { LucideIcon } from 'lucide-react'

interface RoutePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

export const RoutePlaceholder = ({
  title,
  description,
  icon: Icon,
}: RoutePlaceholderProps) => (
  <section className="rounded-2xl border border-default bg-surface p-6 shadow-card">
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <h1 className="text-2xl font-semibold tracking-normal text-primary">
      {title}
    </h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
  </section>
)
