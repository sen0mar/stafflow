import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface TableToolbarProps {
  children: ReactNode
  className?: string
}

export const TableToolbar = ({ children, className }: TableToolbarProps) => (
  <div className={cn('grid gap-3 lg:grid-flow-col lg:auto-cols-fr lg:items-end', className)}>
    {children}
  </div>
)
