import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { PaginationMeta } from '@/shared/types/pagination'

const bulkSkipSize = 10

interface PaginationControlsProps {
  itemLabel: string
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

const clampPage = (page: number, pageCount: number) =>
  Math.min(Math.max(page, 1), Math.max(pageCount, 1))

export const PaginationControls = ({
  itemLabel,
  meta,
  onPageChange,
}: PaginationControlsProps) => {
  const currentPage = clampPage(meta.page, meta.totalPages)
  const safePageCount = Math.max(meta.totalPages, 1)
  const canMoveBackward = currentPage > 1
  const canMoveForward = currentPage < safePageCount
  const previousBulkPage = clampPage(currentPage - bulkSkipSize, safePageCount)
  const nextBulkPage = clampPage(currentPage + bulkSkipSize, safePageCount)

  return (
    <div className="flex flex-col gap-3 border-t border-subtle pt-4 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-muted">
        Page {currentPage} of {safePageCount} · {meta.total} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          disabled={!canMoveBackward}
          aria-label="Go to first page"
          title="First page"
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 font-mono text-xs"
          disabled={!canMoveBackward}
          aria-label={`Go back ${bulkSkipSize} pages`}
          title={`Back ${bulkSkipSize} pages`}
          onClick={() => onPageChange(previousBulkPage)}
        >
          -{bulkSkipSize}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          disabled={!canMoveBackward}
          aria-label="Go to previous page"
          title="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          disabled={!canMoveForward}
          aria-label="Go to next page"
          title="Next page"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 font-mono text-xs"
          disabled={!canMoveForward}
          aria-label={`Skip ahead ${bulkSkipSize} pages`}
          title={`Forward ${bulkSkipSize} pages`}
          onClick={() => onPageChange(nextBulkPage)}
        >
          +{bulkSkipSize}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          disabled={!canMoveForward}
          aria-label="Go to last page"
          title="Last page"
          onClick={() => onPageChange(safePageCount)}
        >
          <ChevronsRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
