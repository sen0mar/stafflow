import { Download, Eye, FileText, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
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
import { useEmployees } from '@/features/employees/hooks/use-employees'
import { getRolePermissions, hasPermission } from '@/shared/lib/permissions'
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

type MonthFilter = 'all' | `${number}`
type YearFilter = 'all' | `${number}`

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

const getMonthValue = (value: MonthFilter) => (value === 'all' ? undefined : Number(value))
const getYearValue = (value: YearFilter) => (value === 'all' ? undefined : Number(value))

const PayslipsLoading = () => (
  <div className="space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft">
    {Array.from({ length: 6 }, (_item, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
)

const PayslipsEmpty = ({ canUpload }: { canUpload: boolean }) => (
  <div className="rounded-2xl border border-dashed border-default bg-surface px-6 py-12 text-center shadow-soft">
    <FileText className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
    <h2 className="mt-4 text-lg font-semibold text-primary">No payslips found</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
      {canUpload
        ? 'Upload a PDF payslip, or adjust the current filters.'
        : 'Your payslips will appear here when an admin uploads them.'}
    </p>
  </div>
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
                <div className="font-medium text-primary">{payslip.employee.fullName}</div>
                <div className="text-xs text-muted">{payslip.employee.employeeCode}</div>
              </TableCell>
            ) : null}
            <TableCell>
              {months[payslip.month - 1]} {payslip.year}
            </TableCell>
            <TableCell>
              <div className="max-w-64 truncate font-medium text-primary">{payslip.fileName}</div>
              <div className="text-xs text-muted">{formatFileSize(payslip.fileSize)}</div>
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
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState<MonthFilter>('all')
  const [year, setYear] = useState<YearFilter>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewPayslip, setPreviewPayslip] = useState<Payslip | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const currentUserQuery = useCurrentUser()
  const permissions = currentUserQuery.data ? getRolePermissions(currentUserQuery.data.role) : []
  const hasCurrentUser = currentUserQuery.isSuccess
  const canReadAny = hasPermission(permissions, 'payslips:read:any')
  const canUpload = hasPermission(permissions, 'payslips:upload')
  const canDelete = hasPermission(permissions, 'payslips:delete')
  const listParams = {
    limit: pageSize,
    month: getMonthValue(month),
    page,
    search: search.trim() || undefined,
    year: getYearValue(year),
  }
  const adminPayslipsQuery = usePayslips(listParams, hasCurrentUser && canReadAny)
  const selfPayslipsQuery = useSelfPayslips(
    {
      limit: pageSize,
      month: getMonthValue(month),
      page,
      year: getYearValue(year),
    },
    hasCurrentUser && !canReadAny,
  )
  const employeesQuery = useEmployees({
    limit: 100,
    page: 1,
    sort: 'name',
    status: 'ACTIVE',
  }, hasCurrentUser && canUpload)
  const uploadPayslip = useUploadPayslip()
  const deletePayslip = useDeletePayslip()
  const downloadPayslip = useDownloadPayslip()
  const previewPayslipMutation = usePreviewPayslip()
  const activeQuery = canReadAny ? adminPayslipsQuery : selfPayslipsQuery
  const payslips = activeQuery.data?.items ?? []
  const pagination = activeQuery.data?.pagination

  const resetToFirstPage = () => setPage(1)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetToFirstPage()
  }

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

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {canReadAny ? (
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <Input
                className="pl-9"
                placeholder="Search employee or file"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>
          ) : (
            <div className="text-sm text-muted">Private payroll documents</div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <Select
              value={month}
              onValueChange={(value) => {
                setMonth(value as MonthFilter)
                resetToFirstPage()
              }}
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {months.map((monthName, index) => (
                  <SelectItem key={monthName} value={String(index + 1)}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={year}
              onValueChange={(value) => {
                setYear(value as YearFilter)
                resetToFirstPage()
              }}
            >
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((yearValue) => (
                  <SelectItem key={yearValue} value={String(yearValue)}>
                    {yearValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeQuery.isLoading || currentUserQuery.isLoading ? <PayslipsLoading /> : null}
        {activeQuery.isError ? (
          <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
            Payslips could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {activeQuery.data && payslips.length === 0 ? <PayslipsEmpty canUpload={canUpload} /> : null}
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
              page={pagination?.page ?? page}
              pageCount={pagination?.pageCount ?? 1}
              total={pagination?.total ?? 0}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <PayslipUploadDialog
        employees={employeesQuery.data?.items ?? []}
        isLoadingEmployees={employeesQuery.isLoading}
        isSubmitting={uploadPayslip.isPending}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={handleUpload}
      />
      <PayslipPreviewDialog
        fileName={previewPayslip?.fileName ?? null}
        open={Boolean(previewPayslip)}
        previewUrl={previewUrl}
        onOpenChange={handlePreviewOpenChange}
      />
    </div>
  )
}
