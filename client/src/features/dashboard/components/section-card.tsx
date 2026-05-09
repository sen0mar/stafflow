import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface SectionCardProps {
  action?: ReactNode
  children: ReactNode
  className?: string
  description?: string
  title: string
}

export const SectionCard = ({ action, children, className, description, title }: SectionCardProps) => (
  <section className={cn('rounded-2xl border border-default bg-elevated p-5 shadow-soft', className)}>
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </section>
)
