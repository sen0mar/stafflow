import type { LucideIcon } from 'lucide-react'

interface RoutePlaceholderProps {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}

export const RoutePlaceholder = ({
  eyebrow,
  title,
  description,
  icon: Icon,
}: RoutePlaceholderProps) => (
  <section className="rounded-2xl border border-default bg-surface p-6 shadow-card">
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <p className="text-sm font-medium text-brand-text">{eyebrow}</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-normal text-primary">{title}</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
  </section>
)
