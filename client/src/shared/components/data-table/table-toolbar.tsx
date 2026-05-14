import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface TableToolbarProps {
  children: ReactNode
  className?: string
}

export const TableToolbar = ({ children, className }: TableToolbarProps) => (
  <div
    className={cn(
      'grid min-w-0 gap-3 [&>*]:min-w-0 lg:grid-flow-col lg:auto-cols-fr lg:items-end',
      className,
    )}
  >
    {children}
  </div>
)
