import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface LandingIconWellProps {
  icon: LucideIcon
  className?: string
}

export const LandingIconWell = ({ icon: Icon, className }: LandingIconWellProps) => (
  <span
    className={cn(
      'flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-text shadow-soft',
      className,
    )}
  >
    <Icon className="h-5 w-5" aria-hidden="true" />
  </span>
)
