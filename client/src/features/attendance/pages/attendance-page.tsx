import { CalendarCheck, Filter, Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { PageHeader } from '@/shared/components/layout/page-header'
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
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [confirmAction, setConfirmAction] = useState<'clock-in' | 'clock-out' | null>(null)
  const todayQuery = useSelfTodayAttendance()
  const historyQuery = useSelfAttendanceHistory({
    limit: pageSize,
    page,
    status: getStatusFilter(status),
  })
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const records = historyQuery.data?.items ?? []
  const pagination = historyQuery.data?.pagination

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
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PRESENT">Present</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="ABSENT">Absent</SelectItem>
            </SelectContent>
          </Select>
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
              page={pagination?.page ?? page}
              pageCount={pagination?.pageCount ?? 1}
              total={pagination?.total ?? 0}
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
  const [page, setPage] = useState(1)
  const [employeeId, setEmployeeId] = useState('all')
  const [departmentId, setDepartmentId] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
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
  const records = attendanceQuery.data?.items ?? []
  const pagination = attendanceQuery.data?.pagination

  const resetPage = () => setPage(1)

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
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr]">
          <Select
            value={employeeId}
            onValueChange={(value) => {
              setEmployeeId(value)
              resetPage()
            }}
          >
            <SelectTrigger className="w-full">
              <Search className="h-4 w-4 text-muted" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employeesQuery.data?.items.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={departmentId}
            onValueChange={(value) => {
              setDepartmentId(value)
              resetPage()
            }}
          >
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 text-muted" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentsQuery.data?.items.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter)
              resetPage()
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PRESENT">Present</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="ABSENT">Absent</SelectItem>
            </SelectContent>
          </Select>
          <Input
            aria-label="From date"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value)
              resetPage()
            }}
          />
          <Input
            aria-label="To date"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value)
              resetPage()
            }}
          />
        </div>

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
              page={pagination?.page ?? page}
              pageCount={pagination?.pageCount ?? 1}
              total={pagination?.total ?? 0}
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
