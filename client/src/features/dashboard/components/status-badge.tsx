import { cn } from '@/shared/lib/utils'

type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'brand'

interface StatusBadgeProps {
  children: string
  className?: string
  variant?: StatusBadgeVariant
}

const statusBadgeClasses: Record<StatusBadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  neutral: 'bg-subtle text-muted',
  brand: 'bg-brand-soft text-brand-text',
}

export const StatusBadge = ({
  children,
  className,
  variant = 'neutral',
}: StatusBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
      statusBadgeClasses[variant],
      className,
    )}
  >
    {children}
  </span>
)
