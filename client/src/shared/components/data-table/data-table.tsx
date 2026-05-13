import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { cn } from '@/shared/lib/cn'

export interface DataTableColumn<TItem> {
  className?: string
  header: ReactNode
  id: string
  render: (item: TItem) => ReactNode
}

interface DataTableProps<TItem> {
  columns: DataTableColumn<TItem>[]
  getRowKey: (item: TItem) => string
  items: TItem[]
  wrapperClassName?: string
}

export const DataTable = <TItem,>({
  columns,
  getRowKey,
  items,
  wrapperClassName,
}: DataTableProps<TItem>) => (
  <div
    className={cn(
      'overflow-hidden rounded-2xl border border-default bg-surface p-2 shadow-soft',
      wrapperClassName,
    )}
  >
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={getRowKey(item)}>
            {columns.map((column) => (
              <TableCell key={column.id} className={column.className}>
                {column.render(item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
