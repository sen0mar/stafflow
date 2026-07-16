import { Filter, ScrollText, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { SearchInput } from '@/shared/components/data-table/search-input'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  EmptyState,
  QueryStateError,
  TableSkeleton,
  UnauthorizedState,
} from '@/shared/components/layout/page-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { getRolePermissions, hasPermission } from '@/shared/lib/permissions'
import { getAllowedQueryValue } from '@/shared/lib/query-values'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import { AuditLogDetailsDialog } from '../components/audit-log-details-dialog'
import { humanizeAuditAction } from '../lib/audit-formatters'
import { AuditLogsTable } from '../components/audit-logs-table'
import { useAuditLog, useAuditLogs } from '../hooks/use-audit-logs'

const pageSize = 10

const actionOptions = [
  'EMPLOYEE_CREATED',
  'EMPLOYEE_UPDATED',
  'EMPLOYEE_DISABLED',
  'EMPLOYEE_ENABLED',
  'USER_ROLE_CHANGED',
  'USER_STATUS_CHANGED',
  'ATTENDANCE_CORRECTED',
  'LEAVE_REQUEST_APPROVED',
  'LEAVE_REQUEST_REJECTED',
  'LEAVE_REQUEST_APPROVAL_REVERSED',
  'PAYSLIP_UPLOADED',
  'PAYSLIP_REPLACED',
  'PAYSLIP_DELETED',
  'SETTINGS_COMPANY_UPDATED',
  'SETTINGS_ATTENDANCE_UPDATED',
  'SETTINGS_LEAVE_UPDATED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_COMPLETED',
] as const

const entityTypeOptions = [
  'Employee',
  'User',
  'AttendanceRecord',
  'LeaveRequest',
  'Payslip',
  'CompanySettings',
  'AttendanceSettings',
  'LeaveSettings',
  'Department',
  'LeaveType',
] as const

type ActionFilter = 'all' | (typeof actionOptions)[number]
type EntityTypeFilter = 'all' | (typeof entityTypeOptions)[number]
const actionFilterOptions = ['all', ...actionOptions] as const
const entityTypeFilterOptions = ['all', ...entityTypeOptions] as const

const toDateTimeFilter = (value: string, endOfDay = false) => {
  if (!value) return undefined
  return new Date(
    `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`,
  ).toISOString()
}
const trimValue = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const AuditLogsLoading = () => <TableSkeleton />
const AuditLogsEmpty = () => (
  <EmptyState
    icon={ScrollText}
    title="No audit logs found"
    description="Adjust the filters or perform a sensitive action that creates an audit record."
  />
)

export const AuditLogsPage = () => {
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const actorUserId = tableState.getString('actorUserId')
  const entityType: EntityTypeFilter = getAllowedQueryValue(
    tableState.getString('entityType', 'all'),
    entityTypeFilterOptions,
    'all',
  )
  const entityId = tableState.getString('entityId')
  const action: ActionFilter = getAllowedQueryValue(
    tableState.getString('action', 'all'),
    actionFilterOptions,
    'all',
  )
  const createdAtFrom = tableState.getDate('from')
  const createdAtTo = tableState.getDate('to')
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(
    null,
  )
  const currentUserQuery = useCurrentUser()
  const permissions = currentUserQuery.data
    ? getRolePermissions(currentUserQuery.data.role)
    : []
  const canReadAuditLogs = hasPermission(permissions, 'auditLogs:read')
  const auditLogsQuery = useAuditLogs(
    {
      action: action === 'all' ? undefined : action,
      actorUserId: trimValue(actorUserId),
      createdAtFrom: toDateTimeFilter(createdAtFrom),
      createdAtTo: toDateTimeFilter(createdAtTo, true),
      entityId: trimValue(entityId),
      entityType: entityType === 'all' ? undefined : entityType,
      limit: pageSize,
      page,
    },
    currentUserQuery.isSuccess && canReadAuditLogs,
  )
  const selectedAuditLogQuery = useAuditLog(
    selectedAuditLogId,
    Boolean(selectedAuditLogId),
  )
  const auditLogs = auditLogsQuery.data?.data ?? []
  const pagination = auditLogsQuery.data?.meta
  const { updateQuery } = tableState

  const setPage = (nextPage: number) => {
    updateQuery({ page: nextPage === 1 ? undefined : nextPage })
  }

  const handleActorSearchChange = useCallback(
    (value: string) => {
      updateQuery(
        { actorUserId: value.trim() || undefined },
        { resetPage: true },
      )
    },
    [updateQuery],
  )

  const handleEntitySearchChange = useCallback(
    (value: string) => {
      updateQuery({ entityId: value.trim() || undefined }, { resetPage: true })
    },
    [updateQuery],
  )

  if (currentUserQuery.isSuccess && !canReadAuditLogs) {
    return (
      <UnauthorizedState description="Audit logs are available to admins only." />
    )
  }

  const clearFilters = () => {
    updateQuery({
      action: undefined,
      actorUserId: undefined,
      entityId: undefined,
      entityType: undefined,
      from: undefined,
      page: undefined,
      to: undefined,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Review sensitive business and security activity recorded separately from technical logs."
      />

      <section className="space-y-4 overflow-hidden rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="grid min-w-0 gap-3 [&>*]:min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
          <div className="space-y-2">
            <Label htmlFor="audit-actor">Actor user ID</Label>
            <SearchInput
              ariaLabel="Actor user ID"
              hasVisibleLabel
              id="audit-actor"
              name="auditActorUserId"
              placeholder="User ID"
              value={actorUserId}
              onDebouncedChange={handleActorSearchChange}
            />
          </div>

          <div className="space-y-2">
            <Label id="audit-entity-type-label">Entity type</Label>
            <FilterSelect
              ariaLabelledby="audit-entity-type-label"
              id="audit-entity-type"
              name="auditEntityType"
              value={entityType}
              onValueChange={(value) =>
                tableState.updateQuery(
                  { entityType: value },
                  { resetPage: true },
                )
              }
              options={[
                { label: 'All entities', value: 'all' },
                ...entityTypeOptions.map((option) => ({
                  label: option,
                  value: option,
                })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-entity-id">Entity ID</Label>
            <SearchInput
              ariaLabel="Entity ID"
              hasVisibleLabel
              id="audit-entity-id"
              name="auditEntityId"
              placeholder="Entity ID"
              value={entityId}
              onDebouncedChange={handleEntitySearchChange}
            />
          </div>

          <div className="space-y-2">
            <Label id="audit-action-label">Action</Label>
            <FilterSelect
              ariaLabelledby="audit-action-label"
              icon={
                <Filter className="h-4 w-4 text-muted" aria-hidden="true" />
              }
              id="audit-action"
              name="auditAction"
              value={action}
              onValueChange={(value) =>
                tableState.updateQuery({ action: value }, { resetPage: true })
              }
              options={[
                { label: 'All actions', value: 'all' },
                ...actionOptions.map((option) => ({
                  label: humanizeAuditAction(option),
                  value: option,
                })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-from">From</Label>
            <Input
              autoComplete="off"
              id="audit-from"
              name="auditCreatedFrom"
              type="date"
              value={createdAtFrom}
              onChange={(event) =>
                tableState.updateQuery(
                  { from: event.target.value },
                  { resetPage: true },
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-to">To</Label>
            <Input
              autoComplete="off"
              id="audit-to"
              name="auditCreatedTo"
              type="date"
              value={createdAtTo}
              onChange={(event) =>
                tableState.updateQuery(
                  { to: event.target.value },
                  { resetPage: true },
                )
              }
            />
          </div>

          <div className="flex items-end">
            <Button
              className="w-full gap-2"
              type="button"
              variant="outline"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </div>

        {auditLogsQuery.isLoading || currentUserQuery.isLoading ? (
          <AuditLogsLoading />
        ) : null}
        {auditLogsQuery.isError ? (
          <QueryStateError
            error={auditLogsQuery.error}
            title="Audit logs could not be loaded"
            description="Refresh the page or try again later."
          />
        ) : null}
        {auditLogsQuery.data && auditLogs.length === 0 ? (
          <AuditLogsEmpty />
        ) : null}
        {auditLogs.length > 0 ? (
          <>
            <AuditLogsTable
              auditLogs={auditLogs}
              onView={(auditLog) => setSelectedAuditLogId(auditLog.id)}
            />
            <PaginationControls
              itemLabel="audit logs"
              meta={
                pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }
              }
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <AuditLogDetailsDialog
        auditLog={selectedAuditLogQuery.data ?? null}
        isLoading={selectedAuditLogQuery.isLoading}
        open={Boolean(selectedAuditLogId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAuditLogId(null)
          }
        }}
      />
    </div>
  )
}
