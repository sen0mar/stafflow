import { CalendarCheck, Clock3, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatDate } from '@/shared/lib/dates'
import type { AttendanceRecord } from '../api/attendance.api'
import { AttendanceStatusBadge } from './attendance-status-badge'
import { formatMinutes } from './attendance-formatters'

interface ClockInOutCardProps {
  isClockingIn: boolean
  isClockingOut: boolean
  isLoading: boolean
  onClockIn: () => void
  onClockOut: () => void
  readOnly?: boolean
  today: AttendanceRecord | null | undefined
}

export const ClockInOutCard = ({
  isClockingIn,
  isClockingOut,
  isLoading,
  onClockIn,
  onClockOut,
  readOnly = false,
  today,
}: ClockInOutCardProps) => {
  const hasActiveClockIn = Boolean(today?.clockInAt && !today.clockOutAt)
  const hasCompletedRecord = Boolean(today?.clockInAt && today.clockOutAt)

  return (
    <section className="rounded-2xl border border-default bg-surface p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Today
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-primary">
            {today ? 'Attendance in progress' : 'Ready to start'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {today?.clockInAt
              ? `Clocked in ${formatDate(today.clockInAt, 'p')}`
              : 'No clock-in has been recorded for today.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isLoading ? <Skeleton className="h-10 w-36" /> : null}
          {!isLoading && today ? (
            <AttendanceStatusBadge status={today.status} />
          ) : null}
          <Button
            type="button"
            disabled={
              isLoading ||
              isClockingIn ||
              isClockingOut ||
              hasActiveClockIn ||
              hasCompletedRecord ||
              readOnly
            }
            onClick={onClockIn}
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {isClockingIn ? 'Clocking in...' : 'Clock in'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              isLoading ||
              isClockingIn ||
              isClockingOut ||
              !hasActiveClockIn ||
              readOnly
            }
            onClick={onClockOut}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {isClockingOut ? 'Clocking out...' : 'Clock out'}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-subtle bg-inset p-3">
          <p className="text-xs font-medium text-muted">Clock in</p>
          <p className="mt-1 text-sm font-semibold text-primary">
            {today?.clockInAt
              ? formatDate(today.clockInAt, 'p')
              : 'Not recorded'}
          </p>
        </div>
        <div className="rounded-xl border border-subtle bg-inset p-3">
          <p className="text-xs font-medium text-muted">Clock out</p>
          <p className="mt-1 text-sm font-semibold text-primary">
            {today?.clockOutAt
              ? formatDate(today.clockOutAt, 'p')
              : 'Not recorded'}
          </p>
        </div>
        <div className="rounded-xl border border-subtle bg-inset p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Hours
          </div>
          <p className="mt-1 text-sm font-semibold text-primary">
            {formatMinutes(today?.totalMinutes ?? null)}
          </p>
        </div>
      </div>
    </section>
  )
}
