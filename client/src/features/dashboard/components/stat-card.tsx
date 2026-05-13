import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface StatCardProps {
  detail: string
  icon: LucideIcon
  label: string
  trend?: string
  value: string
}

export const StatCard = ({
  detail,
  icon: Icon,
  label,
  trend,
  value,
}: StatCardProps) => (
  <article className="rounded-2xl border border-default bg-elevated p-4 shadow-soft">
    <div className="flex items-start justify-between gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      {trend ? (
        <span
          className={cn(
            'rounded-full bg-brand-dim px-2.5 py-1 text-xs font-medium text-brand-text',
          )}
        >
          {trend}
        </span>
      ) : null}
    </div>
    <p className="mt-4 text-sm font-medium text-muted">{label}</p>
    <p className="mt-1 text-3xl font-semibold tracking-normal text-primary">
      {value}
    </p>
    <p className="mt-2 text-xs text-faint">{detail}</p>
  </article>
)
