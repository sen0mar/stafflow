import { CalendarDays, Filter, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/page-header'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { TableToolbar } from '@/shared/components/data-table/table-toolbar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  EmptyState as SharedEmptyState,
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
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useEmployees } from '@/features/employees/hooks/use-employees'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import type { LeaveRequest, LeaveRequestStatus, LeaveType } from '../api/leave.api'
import { LeaveRequestForm } from '../components/leave-request-form'
import { LeaveReviewDialog } from '../components/leave-review-dialog'
import { LeaveStatusBadge } from '../components/leave-status-badge'
import { LeaveTypeFormDialog } from '../components/leave-type-form-dialog'
import {
  useApproveLeaveRequest,
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useCreateLeaveType,
  useDeleteLeaveType,
  useLeaveRequests,
  useLeaveTypes,
  useRejectLeaveRequest,
  useSelfLeaveRequests,
  useUpdateLeaveType,
} from '../hooks/use-leave'
import type {
  LeaveRequestFormValues,
  LeaveReviewValues,
  LeaveTypeFormValues,
} from '../schemas/leave-form.schema'

const pageSize = 10

type StatusFilter = 'all' | LeaveRequestStatus
type NoteMode = 'reason' | 'review'

const getStatusFilter = (status: StatusFilter) => (status === 'all' ? undefined : status)
const getVisibleRequests = (requests: LeaveRequest[]) =>
  requests.filter((request) => request.status !== 'CANCELLED')

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value))

const getRequestPayload = (values: LeaveRequestFormValues) => ({
  endDate: values.endDate,
  leaveTypeId: values.leaveTypeId,
  reason: values.reason?.trim() ? values.reason.trim() : null,
  startDate: values.startDate,
})

const getLeaveTypePayload = (values: LeaveTypeFormValues) => ({
  annualAllowance: Number(values.annualAllowance),
  description: values.description?.trim() ? values.description.trim() : null,
  isActive: values.isActive,
  isPaid: values.isPaid,
  name: values.name.trim(),
})

const getPreview = (value: string, maxLength = 72) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value

const EmptyState = ({ text }: { text: string }) => (
  <SharedEmptyState
    icon={CalendarDays}
    title="No leave requests found"
    description={text}
  />
)

const LeaveNotePreview = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) {
    return <span className="text-sm text-muted">No note.</span>
  }

  return (
    <div className="flex max-w-[18rem] items-center gap-2">
      <span className="truncate text-sm text-muted">{getPreview(value)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-brand">
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-fit min-w-56 max-w-[min(18rem,calc(100vw-2rem))] border-default bg-elevated p-3 shadow-card"
        >
          <p className="text-xs font-medium text-primary">{label}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted [overflow-wrap:anywhere]">
            {value}
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const LeaveRequestsTable = ({
  canReview,
  canCancel,
  noteMode,
  requests,
  onApprove,
  onCancel,
  onReject,
}: {
  canCancel?: boolean
  canReview?: boolean
  noteMode: NoteMode
  onApprove?: (request: LeaveRequest) => void
  onCancel?: (request: LeaveRequest) => void
  onReject?: (request: LeaveRequest) => void
  requests: LeaveRequest[]
}) => (
  <div className="rounded-2xl border border-default bg-surface p-2 shadow-soft">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>{noteMode === 'reason' ? 'Reason' : 'Review'}</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div>
                <p className="font-medium text-primary">{request.employee.fullName}</p>
                <p className="text-xs text-muted">{request.employee.department?.name ?? 'No department'}</p>
              </div>
            </TableCell>
            <TableCell>{request.leaveType.name}</TableCell>
            <TableCell>
              {formatDate(request.startDate)} - {formatDate(request.endDate)}
            </TableCell>
            <TableCell className="max-w-[18rem] whitespace-normal">
              <LeaveNotePreview
                label={noteMode === 'reason' ? 'Employee reason' : 'Review note'}
                value={noteMode === 'reason' ? request.reason : request.reviewNote}
              />
            </TableCell>
            <TableCell>{request.totalDays}</TableCell>
            <TableCell>
              <LeaveStatusBadge status={request.status} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                {canReview && ['PENDING', 'REJECTED', 'APPROVED'].includes(request.status) ? (
                  <>
                    {request.status !== 'APPROVED' ? (
                      <Button type="button" size="sm" onClick={() => onApprove?.(request)}>
                        Approve
                      </Button>
                    ) : null}
                    {request.status !== 'REJECTED' ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => onReject?.(request)}>
                        Reject
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {canCancel && request.status === 'PENDING' ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onCancel?.(request)}>
                    Cancel
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

const EmployeeLeavePage = () => {
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const status = tableState.getString('status', 'all') as StatusFilter
  const selfRequestsQuery = useSelfLeaveRequests({
    limit: pageSize,
    page,
    status: getStatusFilter(status),
  })
  const leaveTypesQuery = useLeaveTypes({ isActive: true, limit: 100, page: 1 })
  const createRequest = useCreateLeaveRequest()
  const cancelRequest = useCancelLeaveRequest()
  const requests = getVisibleRequests(selfRequestsQuery.data?.data ?? [])
  const balances = selfRequestsQuery.data?.balances ?? []
  const pagination = selfRequestsQuery.data?.meta
  const setPage = (nextPage: number) => {
    tableState.updateQuery({ page: nextPage === 1 ? undefined : nextPage })
  }

  const handleSubmit = (values: LeaveRequestFormValues) => {
    createRequest.mutate(getRequestPayload(values))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Self-service"
        title="Leave Requests"
        description="Submit time off requests and track approval status."
      />

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div>
          <h2 className="text-lg font-semibold text-primary">Request leave</h2>
          <p className="mt-1 text-sm text-muted">Choose a leave type and date range.</p>
        </div>
        <LeaveRequestForm
          isSubmitting={createRequest.isPending}
          leaveTypes={leaveTypesQuery.data?.data ?? []}
          onSubmit={handleSubmit}
        />
      </section>

      {balances.length > 0 ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {balances.map((balance) => (
            <div key={balance.id} className="rounded-2xl border border-default bg-surface p-4 shadow-soft">
              <p className="text-sm font-medium text-primary">{balance.leaveType.name}</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{balance.remaining}</p>
              <p className="mt-1 text-xs text-muted">
                {balance.used} used of {balance.allocated} days
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">My requests</h2>
            <p className="mt-1 text-sm text-muted">Recent leave request activity.</p>
          </div>
          <FilterSelect
            className="w-full sm:w-44"
            value={status}
            onValueChange={(value) => tableState.updateQuery({ status: value }, { resetPage: true })}
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
            ]}
          />
        </div>

        {selfRequestsQuery.isLoading ? <TableSkeleton /> : null}
        {selfRequestsQuery.isError ? (
          <QueryStateError
            error={selfRequestsQuery.error}
            title="Leave requests could not be loaded"
            description="Refresh the page or try again later."
          />
        ) : null}
        {selfRequestsQuery.data && requests.length === 0 ? <EmptyState text="Your submitted leave requests will appear here." /> : null}
        {requests.length > 0 ? (
          <>
            <LeaveRequestsTable
              canCancel
              noteMode="review"
              requests={requests}
              onCancel={(request) => cancelRequest.mutate(request.id)}
            />
            <PaginationControls
              itemLabel="requests"
              meta={pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>
    </div>
  )
}

const LeaveTypeManagement = () => {
  const [formOpen, setFormOpen] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const leaveTypesQuery = useLeaveTypes({ limit: 100, page: 1 })
  const createLeaveType = useCreateLeaveType()
  const updateLeaveType = useUpdateLeaveType()
  const deleteLeaveType = useDeleteLeaveType()
  const leaveTypes = leaveTypesQuery.data?.data ?? []

  const openCreate = () => {
    setEditingLeaveType(null)
    setFormOpen(true)
  }

  const handleSubmit = (values: LeaveTypeFormValues) => {
    const payload = getLeaveTypePayload(values)

    if (editingLeaveType) {
      updateLeaveType.mutate(
        { id: editingLeaveType.id, ...payload },
        {
          onSuccess: () => {
            setEditingLeaveType(null)
            setFormOpen(false)
          },
        },
      )
      return
    }

    createLeaveType.mutate(payload, {
      onSuccess: () => setFormOpen(false),
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Leave types</h2>
          <p className="mt-1 text-sm text-muted">Manage request categories and allowances.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create type
        </Button>
      </div>
      {leaveTypesQuery.isLoading ? <TableSkeleton /> : null}
      {leaveTypes.length > 0 ? (
        <div className="rounded-2xl border border-default bg-surface p-2 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Allowance</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-primary">{leaveType.name}</p>
                      <p className="text-xs text-muted">{leaveType.description ?? 'No description'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{leaveType.annualAllowance ?? 0} days</TableCell>
                  <TableCell>{leaveType.isPaid ? 'Paid' : 'Unpaid'}</TableCell>
                  <TableCell>{leaveType.isActive ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingLeaveType(leaveType)
                          setFormOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => deleteLeaveType.mutate(leaveType.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <LeaveTypeFormDialog
        isSubmitting={createLeaveType.isPending || updateLeaveType.isPending}
        leaveType={editingLeaveType}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
    </section>
  )
}

const AdminLeavePage = () => {
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const employeeId = tableState.getString('employeeId', 'all')
  const leaveTypeId = tableState.getString('leaveTypeId', 'all')
  const status = tableState.getString('status', 'all') as StatusFilter
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)
  const [reviewRequest, setReviewRequest] = useState<LeaveRequest | null>(null)
  const leaveRequestsQuery = useLeaveRequests({
    employeeId: employeeId === 'all' ? undefined : employeeId,
    leaveTypeId: leaveTypeId === 'all' ? undefined : leaveTypeId,
    limit: pageSize,
    page,
    status: getStatusFilter(status),
  })
  const leaveTypesQuery = useLeaveTypes({ limit: 100, page: 1 })
  const employeesQuery = useEmployees({
    limit: 100,
    page: 1,
    sort: 'name',
    status: 'ACTIVE',
  })
  const approveRequest = useApproveLeaveRequest()
  const rejectRequest = useRejectLeaveRequest()
  const requests = getVisibleRequests(leaveRequestsQuery.data?.data ?? [])
  const pagination = leaveRequestsQuery.data?.meta

  const setPage = (nextPage: number) => {
    tableState.updateQuery({ page: nextPage === 1 ? undefined : nextPage })
  }
  const openReview = (action: 'approve' | 'reject', request: LeaveRequest) => {
    setReviewAction(action)
    setReviewRequest(request)
  }

  const handleReviewSubmit = (values: LeaveReviewValues) => {
    if (!reviewRequest || !reviewAction) {
      return
    }

    const payload = {
      id: reviewRequest.id,
      reviewNote: values.reviewNote?.trim() ? values.reviewNote.trim() : null,
    }
    const options = {
      onSuccess: () => {
        setReviewAction(null)
        setReviewRequest(null)
      },
    }

    if (reviewAction === 'approve') {
      approveRequest.mutate(payload, options)
      return
    }

    rejectRequest.mutate(payload, options)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Leave Requests"
        description="Review employee leave requests, manage leave types, and keep balances simple."
      />

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <TableToolbar className="lg:grid-cols-[1fr_1fr_0.8fr]">
          <FilterSelect
            icon={<Search className="h-4 w-4 text-muted" aria-hidden="true" />}
            value={employeeId}
            onValueChange={(value) => tableState.updateQuery({ employeeId: value }, { resetPage: true })}
            options={[
              { label: 'All employees', value: 'all' },
              ...(employeesQuery.data?.data.map((employee) => ({ label: employee.fullName, value: employee.id })) ?? []),
            ]}
          />
          <FilterSelect
            icon={<Filter className="h-4 w-4 text-muted" aria-hidden="true" />}
            value={leaveTypeId}
            onValueChange={(value) => tableState.updateQuery({ leaveTypeId: value }, { resetPage: true })}
            options={[
              { label: 'All leave types', value: 'all' },
              ...(leaveTypesQuery.data?.data.map((leaveType) => ({ label: leaveType.name, value: leaveType.id })) ?? []),
            ]}
          />
          <FilterSelect
            value={status}
            onValueChange={(value) => tableState.updateQuery({ status: value }, { resetPage: true })}
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
            ]}
          />
        </TableToolbar>

        {leaveRequestsQuery.isLoading ? <TableSkeleton /> : null}
        {leaveRequestsQuery.isError ? (
          <QueryStateError
            error={leaveRequestsQuery.error}
            title="Leave requests could not be loaded"
            description="Refresh the page or try again later."
          />
        ) : null}
        {leaveRequestsQuery.data && requests.length === 0 ? <EmptyState text="Adjust filters or wait for employees to submit requests." /> : null}
        {requests.length > 0 ? (
          <>
            <LeaveRequestsTable
              canReview
              noteMode="reason"
              requests={requests}
              onApprove={(request) => openReview('approve', request)}
              onReject={(request) => openReview('reject', request)}
            />
            <PaginationControls
              itemLabel="requests"
              meta={pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <LeaveTypeManagement />

      <LeaveReviewDialog
        action={reviewAction}
        isSubmitting={approveRequest.isPending || rejectRequest.isPending}
        open={Boolean(reviewAction)}
        request={reviewRequest}
        onOpenChange={(open) => {
          if (!open) {
            setReviewAction(null)
            setReviewRequest(null)
          }
        }}
        onSubmit={handleReviewSubmit}
      />
    </div>
  )
}

export const LeaveRequestsPage = () => {
  const currentUserQuery = useCurrentUser()

  if (currentUserQuery.isLoading) {
    return <TableSkeleton />
  }

  if (currentUserQuery.data?.role === 'ADMIN') {
    return <AdminLeavePage />
  }

  return <EmployeeLeavePage />
}
