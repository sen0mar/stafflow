import { Eye, Filter, ScrollText, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { SearchInput } from '@/shared/components/data-table/search-input'
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
import { getRolePermissions, hasPermission } from '@/shared/lib/permissions'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import type { AuditLog } from '../api/audit-logs.api'
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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const toDateTimeFilter = (value: string, endOfDay = false) => {
  if (!value) {
    return undefined
  }

  return new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString()
}

const trimValue = (value: string) => {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : undefined
}

const humanizeAction = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return 'None'
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value, null, 2)
}

const getChangedFields = (metadata: unknown) =>
  isRecord(metadata) && Array.isArray(metadata.changedFields)
    ? metadata.changedFields.filter((field): field is string => typeof field === 'string')
    : []

const getOldNewMetadata = (metadata: unknown) => {
  if (!isRecord(metadata) || !isRecord(metadata.from) || !isRecord(metadata.to)) {
    return null
  }

  return {
    from: metadata.from,
    to: metadata.to,
  }
}

const AuditLogsLoading = () => (
  <div className="space-y-3 rounded-lg border border-default bg-surface p-4 shadow-soft">
    {Array.from({ length: 6 }, (_item, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
)

const AuditLogsEmpty = () => (
  <div className="rounded-lg border border-dashed border-default bg-surface px-6 py-12 text-center shadow-soft">
    <ScrollText className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
    <h2 className="mt-4 text-lg font-semibold text-primary">No audit logs found</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
      Adjust the filters or perform a sensitive action that creates an audit record.
    </p>
  </div>
)

interface AuditLogDetailsDialogProps {
  auditLog: AuditLog | null
  isLoading: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MetadataPreview = ({ metadata }: { metadata: unknown }) => {
  const oldNew = getOldNewMetadata(metadata)
  const changedFields = getChangedFields(metadata)

  if (!oldNew) {
    return (
      <pre className="max-h-72 overflow-auto rounded-lg bg-inset p-3 text-xs leading-5 text-primary">
        {stringifyValue(metadata)}
      </pre>
    )
  }

  const fields =
    changedFields.length > 0
      ? changedFields
      : Array.from(new Set([...Object.keys(oldNew.from), ...Object.keys(oldNew.to)]))

  return (
    <div className="overflow-hidden rounded-lg border border-default">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Old</TableHead>
            <TableHead>New</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field}>
              <TableCell className="font-medium text-primary">{field}</TableCell>
              <TableCell>
                <code className="whitespace-pre-wrap text-xs text-muted">
                  {stringifyValue(oldNew.from[field])}
                </code>
              </TableCell>
              <TableCell>
                <code className="whitespace-pre-wrap text-xs text-muted">
                  {stringifyValue(oldNew.to[field])}
                </code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const DetailItem = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
    <dd className="mt-1 break-words text-sm text-primary">{value ?? 'None'}</dd>
  </div>
)

const AuditLogDetailsDialog = ({
  auditLog,
  isLoading,
  open,
  onOpenChange,
}: AuditLogDetailsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Audit log details</DialogTitle>
        <DialogDescription>
          Sensitive metadata is redacted before it is stored and displayed.
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {auditLog ? (
        <div className="space-y-5">
          <div className="grid gap-4 rounded-lg border border-default bg-inset p-4 sm:grid-cols-2">
            <DetailItem label="Action" value={humanizeAction(auditLog.action)} />
            <DetailItem label="Created" value={formatDateTime(auditLog.createdAt)} />
            <DetailItem
              label="Actor"
              value={auditLog.actorUser?.email ?? auditLog.actorUserId}
            />
            <DetailItem label="Actor user ID" value={auditLog.actorUserId} />
            <DetailItem label="Entity" value={auditLog.entityType} />
            <DetailItem label="Entity ID" value={auditLog.entityId} />
            <DetailItem label="IP address" value={auditLog.ipAddress} />
            <DetailItem label="User agent" value={auditLog.userAgent} />
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">Metadata</h3>
            <MetadataPreview metadata={auditLog.metadata} />
          </section>
        </div>
      ) : null}
    </DialogContent>
  </Dialog>
)

interface AuditLogsTableProps {
  auditLogs: AuditLog[]
  onView: (auditLog: AuditLog) => void
}

const AuditLogsTable = ({ auditLogs, onView }: AuditLogsTableProps) => (
  <div className="overflow-hidden rounded-lg border border-default bg-surface p-2 shadow-soft">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditLogs.map((auditLog) => (
          <TableRow key={auditLog.id}>
            <TableCell>
              <Badge variant="secondary">{humanizeAction(auditLog.action)}</Badge>
            </TableCell>
            <TableCell>
              <div className="font-medium text-primary">
                {auditLog.actorUser?.email ?? 'System or unauthenticated'}
              </div>
              <div className="text-xs text-muted">{auditLog.actorUserId ?? 'No actor ID'}</div>
            </TableCell>
            <TableCell>
              <div className="font-medium text-primary">{auditLog.entityType}</div>
              <div className="max-w-56 truncate text-xs text-muted">
                {auditLog.entityId ?? 'No entity ID'}
              </div>
            </TableCell>
            <TableCell>{formatDateTime(auditLog.createdAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Button
                  aria-label={`View ${auditLog.action} audit log`}
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => onView(auditLog)}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)

export const AuditLogsPage = () => {
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const actorUserId = tableState.getString('actorUserId')
  const entityType = tableState.getString('entityType', 'all') as EntityTypeFilter
  const entityId = tableState.getString('entityId')
  const action = tableState.getString('action', 'all') as ActionFilter
  const createdAtFrom = tableState.getDate('from')
  const createdAtTo = tableState.getDate('to')
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(null)
  const currentUserQuery = useCurrentUser()
  const permissions = currentUserQuery.data ? getRolePermissions(currentUserQuery.data.role) : []
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
  const selectedAuditLogQuery = useAuditLog(selectedAuditLogId, Boolean(selectedAuditLogId))
  const auditLogs = auditLogsQuery.data?.data ?? []
  const pagination = auditLogsQuery.data?.meta
  const { updateQuery } = tableState

  const setPage = (nextPage: number) => {
    updateQuery({ page: nextPage === 1 ? undefined : nextPage })
  }

  const handleActorSearchChange = useCallback((value: string) => {
    updateQuery({ actorUserId: value.trim() || undefined }, { resetPage: true })
  }, [updateQuery])

  const handleEntitySearchChange = useCallback((value: string) => {
    updateQuery({ entityId: value.trim() || undefined }, { resetPage: true })
  }, [updateQuery])

  if (currentUserQuery.isSuccess && !canReadAuditLogs) {
    return <Navigate to="/app/dashboard" replace />
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
        eyebrow="Admin"
        title="Audit Logs"
        description="Review sensitive business and security activity recorded separately from technical logs."
      />

      <section className="space-y-4 rounded-lg border border-default bg-surface p-4 shadow-soft">
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1fr_0.8fr_0.8fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="audit-actor">Actor user ID</Label>
            <SearchInput
              key={`actor-${actorUserId}`}
              ariaLabel="Actor user ID"
              placeholder="User ID"
              value={actorUserId}
              onDebouncedChange={handleActorSearchChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Entity type</Label>
            <FilterSelect
              value={entityType}
              onValueChange={(value) => tableState.updateQuery({ entityType: value }, { resetPage: true })}
              options={[
                { label: 'All entities', value: 'all' },
                ...entityTypeOptions.map((option) => ({ label: option, value: option })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-entity-id">Entity ID</Label>
            <SearchInput
              key={`entity-${entityId}`}
              ariaLabel="Entity ID"
              placeholder="Entity ID"
              value={entityId}
              onDebouncedChange={handleEntitySearchChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Action</Label>
            <FilterSelect
              icon={<Filter className="h-4 w-4 text-muted" aria-hidden="true" />}
              value={action}
              onValueChange={(value) => tableState.updateQuery({ action: value }, { resetPage: true })}
              options={[
                { label: 'All actions', value: 'all' },
                ...actionOptions.map((option) => ({ label: humanizeAction(option), value: option })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-from">From</Label>
            <Input
              id="audit-from"
              type="date"
              value={createdAtFrom}
              onChange={(event) => tableState.updateQuery({ from: event.target.value }, { resetPage: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-to">To</Label>
            <Input
              id="audit-to"
              type="date"
              value={createdAtTo}
              onChange={(event) => tableState.updateQuery({ to: event.target.value }, { resetPage: true })}
            />
          </div>

          <div className="flex items-end">
            <Button className="w-full gap-2" type="button" variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </div>

        {auditLogsQuery.isLoading || currentUserQuery.isLoading ? <AuditLogsLoading /> : null}
        {auditLogsQuery.isError ? (
          <div className="rounded-lg border border-default bg-inset p-6 text-sm text-muted">
            Audit logs could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {auditLogsQuery.data && auditLogs.length === 0 ? <AuditLogsEmpty /> : null}
        {auditLogs.length > 0 ? (
          <>
            <AuditLogsTable auditLogs={auditLogs} onView={(auditLog) => setSelectedAuditLogId(auditLog.id)} />
            <PaginationControls
              itemLabel="audit logs"
              meta={pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }}
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
