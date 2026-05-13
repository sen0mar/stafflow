import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/shared/lib/utils'

type ContentCardProps = ComponentPropsWithoutRef<'section'>

export const ContentCard = ({
  className,
  children,
  ...props
}: ContentCardProps) => (
  <section
    className={cn(
      'rounded-2xl border border-default bg-elevated p-5 shadow-soft',
      className,
    )}
    {...props}
  >
    {children}
  </section>
)
