import { PageHeader } from '@/shared/components/layout/page-header'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import {
  QueryStateError,
  TableSkeleton,
} from '@/shared/components/layout/page-state'
import { useDemoMode } from '@/features/auth/hooks/use-auth-config'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import { getAllowedQueryValue } from '@/shared/lib/query-values'
import type { LeaveRequest, LeaveRequestStatus } from '../api/leave.api'
import { LeaveRequestForm } from './leave-request-form'
import {
  LeaveRequestsEmptyState,
  LeaveRequestsTable,
} from './leave-requests-table'
import {
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useSelfLeaveRequests,
} from '../hooks/use-leave'
import type { LeaveRequestFormValues } from '../schemas/leave-form.schema'

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
const getRequestPayload = (values: LeaveRequestFormValues) => ({
  endDate: values.endDate,
  leaveTypeId: values.leaveTypeId,
  reason: values.reason?.trim() ? values.reason.trim() : null,
  startDate: values.startDate,
})

export const EmployeeLeaveRequests = () => {
  const demoMode = useDemoMode()
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const status = getAllowedQueryValue(
    tableState.getString('status', 'all'),
    statusFilterValues,
    'all',
  )
  const selfRequestsQuery = useSelfLeaveRequests({
    limit: pageSize,
    page,
    status: getStatusFilter(status),
  })
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

      {!demoMode ? (
        <section className="space-y-4 overflow-hidden rounded-2xl border border-default bg-surface p-4 shadow-soft">
          <div>
            <h2 className="text-lg font-semibold text-primary">
              Request leave
            </h2>
            <p className="mt-1 text-sm text-muted">
              Choose a leave type and date range.
            </p>
          </div>
          <LeaveRequestForm
            isSubmitting={createRequest.isPending}
            onSubmit={handleSubmit}
          />
        </section>
      ) : null}

      {balances.length > 0 ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {balances.map((balance) => (
            <div
              key={balance.id}
              className="rounded-2xl border border-default bg-surface p-4 shadow-soft"
            >
              <p className="text-sm font-medium text-primary">
                {balance.leaveType.name}
              </p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {balance.remaining}
              </p>
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
            <p className="mt-1 text-sm text-muted">
              Recent leave request activity.
            </p>
          </div>
          <FilterSelect
            ariaLabel="Filter my leave requests by status"
            className="w-full sm:w-44"
            id="self-leave-status-filter"
            name="selfLeaveStatus"
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
        </div>

        {selfRequestsQuery.isLoading ? <TableSkeleton /> : null}
        {selfRequestsQuery.isError ? (
          <QueryStateError
            error={selfRequestsQuery.error}
            title="Leave requests could not be loaded"
            description="Refresh the page or try again later."
          />
        ) : null}
        {selfRequestsQuery.data && requests.length === 0 ? (
          <LeaveRequestsEmptyState text="Your submitted leave requests will appear here." />
        ) : null}
        {requests.length > 0 ? (
          <>
            <LeaveRequestsTable
              canCancel={!demoMode}
              noteMode="review"
              requests={requests}
              onCancel={(request) => cancelRequest.mutate(request.id)}
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
    </div>
  )
}
