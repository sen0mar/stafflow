import { Download, Eye, FileText, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { SearchInput } from '@/shared/components/data-table/search-input'
import { Button } from '@/shared/components/ui/button'
import {
  EmptyState,
  QueryStateError,
  TableSkeleton,
} from '@/shared/components/layout/page-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { PageHeader } from '@/shared/components/layout/page-header'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useDemoMode } from '@/features/auth/hooks/use-auth-config'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import { getRolePermissions, hasPermission } from '@/shared/lib/permissions'
import { getAllowedQueryValue } from '@/shared/lib/query-values'
import type { Payslip } from '../api/payslips.api'
import { PayslipPreviewDialog } from '../components/payslip-preview-dialog'
import { PayslipUploadDialog } from '../components/payslip-upload-dialog'
import {
  useDeletePayslip,
  useDownloadPayslip,
  usePayslips,
  usePreviewPayslip,
  useSelfPayslips,
  useUploadPayslip,
} from '../hooks/use-payslips'
import type { PayslipUploadValues } from '../schemas/payslip-upload.schema'

const pageSize = 10
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 8 }, (_item, index) => currentYear - index)
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const monthFilterValues = [
  'all',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
] as const
const yearFilterValues = ['all', ...years.map(String)]

type MonthFilter = (typeof monthFilterValues)[number]
type YearFilter = string

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

const getMonthValue = (value: MonthFilter) =>
  value === 'all' ? undefined : Number(value)
const getYearValue = (value: YearFilter) =>
  value === 'all' ? undefined : Number(value)

const PayslipsEmpty = ({ canUpload }: { canUpload: boolean }) => (
  <EmptyState
    icon={FileText}
    title="No payslips found"
    description={
      canUpload
        ? 'Upload a PDF payslip, or adjust the current filters.'
        : 'Your payslips will appear here when an admin uploads them.'
    }
  />
)

interface PayslipsTableProps {
  canDelete: boolean
  isDeleting: boolean
  isDownloading: boolean
  isPreviewing: boolean
  isAdminView: boolean
  onDelete: (payslip: Payslip) => void
  onDownload: (payslip: Payslip) => void
  onPreview: (payslip: Payslip) => void
  payslips: Payslip[]
}

const PayslipsTable = ({
  canDelete,
  isDeleting,
  isDownloading,
  isPreviewing,
  isAdminView,
  onDelete,
  onDownload,
  onPreview,
  payslips,
}: PayslipsTableProps) => (
  <div className="rounded-2xl border border-default bg-surface p-2 shadow-soft">
    <Table>
      <TableHeader>
        <TableRow>
          {isAdminView ? <TableHead>Employee</TableHead> : null}
          <TableHead>Period</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payslips.map((payslip) => (
          <TableRow key={payslip.id}>
            {isAdminView ? (
              <TableCell>
                <div className="font-medium text-primary">
                  {payslip.employee.fullName}
                </div>
                <div className="text-xs text-muted">
                  {payslip.employee.employeeCode}
                </div>
              </TableCell>
            ) : null}
            <TableCell>
              {months[payslip.month - 1]} {payslip.year}
            </TableCell>
            <TableCell>
              <div className="max-w-64 truncate font-medium text-primary">
                {payslip.fileName}
              </div>
              <div className="text-xs text-muted">
                {formatFileSize(payslip.fileSize)}
              </div>
            </TableCell>
            <TableCell>{formatDate(payslip.uploadedAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  aria-label={`Preview ${payslip.fileName}`}
                  disabled={isPreviewing}
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => onPreview(payslip)}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  aria-label={`Download ${payslip.fileName}`}
                  disabled={isDownloading}
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => onDownload(payslip)}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                </Button>
                {canDelete ? (
                  <Button
                    aria-label={`Delete ${payslip.fileName}`}
                    disabled={isDeleting}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={() => onDelete(payslip)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)

export const PayslipsPage = () => {
  const demoMode = useDemoMode()
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const search = tableState.getString('search')
  const month = getAllowedQueryValue(
    tableState.getString('month', 'all'),
    monthFilterValues,
    'all',
  )
  const year = getAllowedQueryValue(
    tableState.getString('year', 'all'),
    yearFilterValues,
    'all',
  )
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewPayslip, setPreviewPayslip] = useState<Payslip | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const currentUserQuery = useCurrentUser()
  const permissions = currentUserQuery.data
    ? getRolePermissions(currentUserQuery.data.role)
    : []
  const hasCurrentUser = currentUserQuery.isSuccess
  const canReadAny = hasPermission(permissions, 'payslips:read:any')
  const canUpload = !demoMode && hasPermission(permissions, 'payslips:upload')
  const canDelete = !demoMode && hasPermission(permissions, 'payslips:delete')
  const listParams = {
    limit: pageSize,
    month: getMonthValue(month),
    page,
    search: search.trim() || undefined,
    year: getYearValue(year),
  }
  const adminPayslipsQuery = usePayslips(
    listParams,
    hasCurrentUser && canReadAny,
  )
  const selfPayslipsQuery = useSelfPayslips(
    {
      limit: pageSize,
      month: getMonthValue(month),
      page,
      year: getYearValue(year),
    },
    hasCurrentUser && !canReadAny,
  )
  const uploadPayslip = useUploadPayslip()
  const deletePayslip = useDeletePayslip()
  const downloadPayslip = useDownloadPayslip()
  const previewPayslipMutation = usePreviewPayslip()
  const activeQuery = canReadAny ? adminPayslipsQuery : selfPayslipsQuery
  const payslips = activeQuery.data?.data ?? []
  const pagination = activeQuery.data?.meta
  const { updateQuery } = tableState

  const setPage = (nextPage: number) => {
    updateQuery({ page: nextPage === 1 ? undefined : nextPage })
  }

  const handleSearchChange = useCallback(
    (value: string) => {
      updateQuery({ search: value.trim() || undefined }, { resetPage: true })
    },
    [updateQuery],
  )

  const handleUpload = (values: PayslipUploadValues) => {
    uploadPayslip.mutate(values, {
      onSuccess: () => {
        setUploadOpen(false)
        setPage(1)
      },
    })
  }

  const handleDelete = (payslip: Payslip) => {
    if (!window.confirm(`Delete ${payslip.fileName}?`)) {
      return
    }

    deletePayslip.mutate(payslip.id)
  }

  const handlePreview = (payslip: Payslip) => {
    setPreviewPayslip(payslip)
    setPreviewUrl(null)
    previewPayslipMutation.mutate(payslip.id, {
      onSuccess: (download) => {
        setPreviewUrl(download.url)
      },
    })
  }

  const handlePreviewOpenChange = (open: boolean) => {
    if (!open) {
      setPreviewPayslip(null)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={canReadAny ? 'Payroll files' : 'Self service'}
        title="Payslips"
        description={
          canReadAny
            ? 'Upload, replace, and manage private employee payslip PDFs.'
            : 'View and download your private payslip PDFs.'
        }
        actions={
          canUpload ? (
            <Button type="button" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Upload payslip
            </Button>
          ) : null
        }
      />

      <section className="space-y-4 overflow-hidden rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {canReadAny ? (
            <div className="min-w-0 w-full lg:max-w-sm">
              <SearchInput
                key={search}
                id="payslips-search"
                name="payslipsSearch"
                placeholder="Search employee or file"
                value={search}
                onDebouncedChange={handleSearchChange}
              />
            </div>
          ) : (
            <div className="text-sm text-muted">Private payroll documents</div>
          )}
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:flex">
            <FilterSelect
              ariaLabel="Filter payslips by month"
              className="w-full lg:w-40"
              id="payslips-month-filter"
              name="payslipsMonth"
              value={month}
              onValueChange={(value) =>
                tableState.updateQuery({ month: value }, { resetPage: true })
              }
              options={[
                { label: 'All months', value: 'all' },
                ...months.map((monthName, index) => ({
                  label: monthName,
                  value: String(index + 1),
                })),
              ]}
            />
            <FilterSelect
              ariaLabel="Filter payslips by year"
              className="w-full lg:w-36"
              id="payslips-year-filter"
              name="payslipsYear"
              value={year}
              onValueChange={(value) =>
                tableState.updateQuery({ year: value }, { resetPage: true })
              }
              options={[
                { label: 'All years', value: 'all' },
                ...years.map((yearValue) => ({
                  label: yearValue,
                  value: String(yearValue),
                })),
              ]}
            />
          </div>
        </div>

        {activeQuery.isLoading || currentUserQuery.isLoading ? (
          <TableSkeleton />
        ) : null}
        {activeQuery.isError ? (
          <QueryStateError
            error={activeQuery.error}
            title="Payslips could not be loaded"
            description="Refresh the page or try again later."
          />
        ) : null}
        {activeQuery.data && payslips.length === 0 ? (
          <PayslipsEmpty canUpload={canUpload} />
        ) : null}
        {payslips.length > 0 ? (
          <>
            <PayslipsTable
              canDelete={canDelete}
              isAdminView={canReadAny}
              isDeleting={deletePayslip.isPending}
              isDownloading={downloadPayslip.isPending}
              isPreviewing={previewPayslipMutation.isPending}
              payslips={payslips}
              onDelete={handleDelete}
              onDownload={(payslip) => downloadPayslip.mutate(payslip.id)}
              onPreview={handlePreview}
            />
            <PaginationControls
              itemLabel="payslips"
              meta={
                pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }
              }
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      {!demoMode ? (
        <PayslipUploadDialog
          isSubmitting={uploadPayslip.isPending}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onSubmit={handleUpload}
        />
      ) : null}
      <PayslipPreviewDialog
        fileName={previewPayslip?.fileName ?? null}
        open={Boolean(previewPayslip)}
        previewUrl={previewUrl}
        onOpenChange={handlePreviewOpenChange}
      />
    </div>
  )
}
