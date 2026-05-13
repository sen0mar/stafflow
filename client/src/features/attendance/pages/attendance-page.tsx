import { CalendarCheck, Filter, Search } from 'lucide-react'
import { useState } from 'react'
import { DateRangeFilter } from '@/shared/components/data-table/date-range-filter'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { TableToolbar } from '@/shared/components/data-table/table-toolbar'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { PageHeader } from '@/shared/components/layout/page-header'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useDepartments } from '@/features/departments/hooks/use-departments'
import { useEmployees } from '@/features/employees/hooks/use-employees'
import type { AttendanceRecord, AttendanceStatus } from '../api/attendance.api'
import { AdminCorrectionDialog } from '../components/admin-correction-dialog'
import { AttendanceActionConfirmDialog } from '../components/attendance-action-confirm-dialog'
import { toCorrectionPayloadDate } from '../components/attendance-formatters'
import { AttendanceHistoryTable } from '../components/attendance-history-table'
import { ClockInOutCard } from '../components/clock-in-out-card'
import {
  useAttendanceRecords,
  useClockIn,
  useClockOut,
  useSelfAttendanceHistory,
  useSelfTodayAttendance,
  useUpdateAttendanceRecord,
} from '../hooks/use-attendance'
import type { AttendanceCorrectionValues } from '../schemas/attendance-correction.schema'

const pageSize = 10

type StatusFilter = 'all' | AttendanceStatus

const getStatusFilter = (status: StatusFilter) => (status === 'all' ? undefined : status)

const toDateFilter = (value: string, endOfDay = false) => {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`)

  return date.toISOString()
}

const LoadingTable = () => (
  <div className="space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft">
    {Array.from({ length: 6 }, (_item, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
)

const EmptyAttendance = ({ isAdmin }: { isAdmin?: boolean }) => (
  <div className="rounded-2xl border border-dashed border-default bg-surface px-6 py-12 text-center shadow-soft">
    <CalendarCheck className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
    <h2 className="mt-4 text-lg font-semibold text-primary">No attendance records found</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
      {isAdmin
        ? 'Adjust the filters or wait for employees to start recording attendance.'
        : 'Your clock-in and clock-out history will appear here.'}
    </p>
  </div>
)

const EmployeeAttendancePage = () => {
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const status = tableState.getString('status', 'all') as StatusFilter
  const [confirmAction, setConfirmAction] = useState<'clock-in' | 'clock-out' | null>(null)
  const todayQuery = useSelfTodayAttendance()
  const historyQuery = useSelfAttendanceHistory({
    limit: pageSize,
    page,
    status: getStatusFilter(status),
  })
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const records = historyQuery.data?.data ?? []
  const pagination = historyQuery.data?.meta
  const setPage = (nextPage: number) => {
    tableState.updateQuery({ page: nextPage === 1 ? undefined : nextPage })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Self-service"
        title="Attendance"
        description="Clock in, clock out, and review your attendance history."
      />

      <ClockInOutCard
        isClockingIn={clockIn.isPending}
        isClockingOut={clockOut.isPending}
        isLoading={todayQuery.isLoading}
        today={todayQuery.data}
        onClockIn={() => setConfirmAction('clock-in')}
        onClockOut={() => setConfirmAction('clock-out')}
      />

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">History</h2>
            <p className="mt-1 text-sm text-muted">Your recent attendance records.</p>
          </div>
          <FilterSelect
            className="w-full sm:w-44"
            value={status}
            onValueChange={(value) => tableState.updateQuery({ status: value }, { resetPage: true })}
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Present', value: 'PRESENT' },
              { label: 'Partial', value: 'PARTIAL' },
              { label: 'Late', value: 'LATE' },
              { label: 'Absent', value: 'ABSENT' },
            ]}
          />
        </div>

        {historyQuery.isLoading ? <LoadingTable /> : null}
        {historyQuery.isError ? (
          <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
            Attendance history could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {historyQuery.data && records.length === 0 ? <EmptyAttendance /> : null}
        {records.length > 0 ? (
          <>
            <AttendanceHistoryTable records={records} />
            <PaginationControls
              itemLabel="records"
              meta={pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <AttendanceActionConfirmDialog
        action={confirmAction}
        isSubmitting={clockIn.isPending || clockOut.isPending}
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
          }
        }}
        onConfirm={() => {
          if (confirmAction === 'clock-in') {
            clockIn.mutate(undefined, {
              onSettled: () => setConfirmAction(null),
            })
          }

          if (confirmAction === 'clock-out') {
            clockOut.mutate(undefined, {
              onSettled: () => setConfirmAction(null),
            })
          }
        }}
      />
    </div>
  )
}

const AdminAttendancePage = () => {
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const employeeId = tableState.getString('employeeId', 'all')
  const departmentId = tableState.getString('departmentId', 'all')
  const status = tableState.getString('status', 'all') as StatusFilter
  const from = tableState.getDate('from')
  const to = tableState.getDate('to')
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null)
  const attendanceQuery = useAttendanceRecords({
    departmentId: departmentId === 'all' ? undefined : departmentId,
    employeeId: employeeId === 'all' ? undefined : employeeId,
    from: toDateFilter(from),
    limit: pageSize,
    page,
    status: getStatusFilter(status),
    to: toDateFilter(to, true),
  })
  const employeesQuery = useEmployees({
    limit: 100,
    page: 1,
    sort: 'name',
    status: 'ACTIVE',
  })
  const departmentsQuery = useDepartments({
    isActive: true,
    page: 1,
    pageSize: 100,
  })
  const updateAttendance = useUpdateAttendanceRecord()
  const records = attendanceQuery.data?.data ?? []
  const pagination = attendanceQuery.data?.meta

  const setPage = (nextPage: number) => {
    tableState.updateQuery({ page: nextPage === 1 ? undefined : nextPage })
  }

  const openCorrection = (record: AttendanceRecord) => {
    setCorrectingRecord(record)
    setCorrectionOpen(true)
  }

  const handleCorrectionSubmit = (values: AttendanceCorrectionValues) => {
    if (!correctingRecord) {
      return
    }

    updateAttendance.mutate(
      {
        clockInAt: toCorrectionPayloadDate(values.clockInAt),
        clockOutAt: toCorrectionPayloadDate(values.clockOutAt),
        id: correctingRecord.id,
        notes: values.notes?.trim() ? values.notes.trim() : null,
        status: values.status,
      },
      {
        onSuccess: () => {
          setCorrectionOpen(false)
          setCorrectingRecord(null)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Attendance"
        description="Review attendance records, filter by team, and correct records when needed."
      />

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <TableToolbar className="lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr]">
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
            value={departmentId}
            onValueChange={(value) => tableState.updateQuery({ departmentId: value }, { resetPage: true })}
            options={[
              { label: 'All departments', value: 'all' },
              ...(departmentsQuery.data?.data.map((department) => ({ label: department.name, value: department.id })) ?? []),
            ]}
          />
          <FilterSelect
            value={status}
            onValueChange={(value) => tableState.updateQuery({ status: value }, { resetPage: true })}
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Present', value: 'PRESENT' },
              { label: 'Partial', value: 'PARTIAL' },
              { label: 'Late', value: 'LATE' },
              { label: 'Absent', value: 'ABSENT' },
            ]}
          />
          <DateRangeFilter
            from={from}
            to={to}
            onFromChange={(value) => tableState.updateQuery({ from: value }, { resetPage: true })}
            onToChange={(value) => tableState.updateQuery({ to: value }, { resetPage: true })}
          />
        </TableToolbar>

        {attendanceQuery.isLoading ? <LoadingTable /> : null}
        {attendanceQuery.isError ? (
          <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
            Attendance records could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {attendanceQuery.data && records.length === 0 ? <EmptyAttendance isAdmin /> : null}
        {records.length > 0 ? (
          <>
            <AttendanceHistoryTable isAdmin records={records} onCorrect={openCorrection} />
            <PaginationControls
              itemLabel="records"
              meta={pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <AdminCorrectionDialog
        isSubmitting={updateAttendance.isPending}
        open={correctionOpen}
        record={correctingRecord}
        onOpenChange={setCorrectionOpen}
        onSubmit={handleCorrectionSubmit}
      />
    </div>
  )
}

export const AttendancePage = () => {
  const currentUserQuery = useCurrentUser()

  if (currentUserQuery.isLoading) {
    return <LoadingTable />
  }

  if (currentUserQuery.data?.role === 'ADMIN') {
    return <AdminAttendancePage />
  }

  return <EmployeeAttendancePage />
}
