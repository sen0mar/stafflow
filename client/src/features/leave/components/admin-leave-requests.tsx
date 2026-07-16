import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/page-header'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { TableToolbar } from '@/shared/components/data-table/table-toolbar'
import {
  QueryStateError,
  TableSkeleton,
} from '@/shared/components/layout/page-state'
import { useDemoMode } from '@/features/auth/hooks/use-auth-config'
import { EmployeeSelector } from '@/features/employees/components/employee-selector'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import { getAllowedQueryValue } from '@/shared/lib/query-values'
import type { LeaveRequest, LeaveRequestStatus } from '../api/leave.api'
import { LeaveReviewDialog } from './leave-review-dialog'
import {
  LeaveRequestsEmptyState,
  LeaveRequestsTable,
} from './leave-requests-table'
import { LeaveTypeManagement } from './leave-type-management'
import { LeaveTypeSelector } from './leave-type-selector'
import {
  useApproveLeaveRequest,
  useLeaveRequests,
  useRejectLeaveRequest,
} from '../hooks/use-leave'
import type { LeaveReviewValues } from '../schemas/leave-form.schema'

const pageSize = 10

type StatusFilter = 'all' | Exclude<LeaveRequestStatus, 'CANCELLED'>
const statusFilterValues = [
  'all',
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const satisfies readonly StatusFilter[]
const getStatusFilter = (status: StatusFilter) =>
  status === 'all' ? undefined : status
const getVisibleRequests = (requests: LeaveRequest[]) =>
  requests.filter((request) => request.status !== 'CANCELLED')

export const AdminLeaveRequests = () => {
  const demoMode = useDemoMode()
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const employeeId = tableState.getString('employeeId', 'all')
  const leaveTypeId = tableState.getString('leaveTypeId', 'all')
  const status = getAllowedQueryValue(
    tableState.getString('status', 'all'),
    statusFilterValues,
    'all',
  )
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    null,
  )
  const [reviewRequest, setReviewRequest] = useState<LeaveRequest | null>(null)
  const leaveRequestsQuery = useLeaveRequests({
    employeeId: employeeId === 'all' ? undefined : employeeId,
    leaveTypeId: leaveTypeId === 'all' ? undefined : leaveTypeId,
    limit: pageSize,
    page,
    status: getStatusFilter(status),
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
        title="Leave Requests"
        description="Review employee leave requests, manage leave types, and keep balances simple."
      />

      <section className="space-y-4 overflow-hidden rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <TableToolbar className="lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
          <EmployeeSelector
            allOption
            ariaLabel="Filter leave requests by employee"
            id="leave-employee-filter"
            value={employeeId}
            onValueChange={(value) =>
              tableState.updateQuery({ employeeId: value }, { resetPage: true })
            }
          />
          <LeaveTypeSelector
            allOption
            ariaLabel="Filter leave requests by type"
            id="leave-type-filter"
            value={leaveTypeId}
            onValueChange={(value) =>
              tableState.updateQuery(
                { leaveTypeId: value },
                { resetPage: true },
              )
            }
          />
          <FilterSelect
            ariaLabel="Filter leave requests by status"
            id="leave-status-filter"
            name="leaveStatus"
            value={status}
            onValueChange={(value) =>
              tableState.updateQuery({ status: value }, { resetPage: true })
            }
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
        {leaveRequestsQuery.data && requests.length === 0 ? (
          <LeaveRequestsEmptyState text="Adjust filters or wait for employees to submit requests." />
        ) : null}
        {requests.length > 0 ? (
          <>
            <LeaveRequestsTable
              canReview={!demoMode}
              noteMode="reason"
              requests={requests}
              onApprove={(request) => openReview('approve', request)}
              onReject={(request) => openReview('reject', request)}
            />
            <PaginationControls
              itemLabel="requests"
              meta={
                pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }
              }
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <LeaveTypeManagement />

      {!demoMode ? (
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
      ) : null}
    </div>
  )
}
