# Domain Policies

For balance/audit transaction guarantees see [data and storage](data-and-storage.md#database-changes-and-atomicity); self-service identity checks follow [security](security.md#roles-and-authorization).

## Leave Request Date Policy

For the simple MVP, leave duration is the inclusive count of calendar dates from
the start date through the end date. Weekends and holidays are included; the MVP
does not maintain a business-day or holiday calendar. A request must start and
end in the same UTC calendar year and may span at most 365 inclusive calendar
days. This keeps each approved request attributable to one annual balance and
prevents a duration outside the supported product and database bounds from
reaching Prisma.

## Calendar Date and Timestamp Contracts

Calendar values use PostgreSQL `date` columns and `YYYY-MM-DD` API strings:
`Employee.hireDate`, `Employee.terminationDate`, `AttendanceRecord.date`,
`LeaveRequest.startDate`, and `LeaveRequest.endDate`. Server and client code
must parse and format these through explicit date-only helpers; a bare
`YYYY-MM-DD` must never be passed through browser-local `Date` conversion.

All other Prisma `DateTime` fields are instants and use ISO timestamps,
including authentication/session lifecycle times, clock-in/out times,
created/updated/reviewed/uploaded/deleted times, and audit-log timestamps.
Attendance date filters accept inclusive date-only bounds. The current
attendance date is derived from the company IANA timezone and then persisted as
the resulting calendar date; Section 11 schedule, status, and concurrency
behavior remains instant-based and unchanged.

## Attendance Self Clock Policy

Employee self clock actions use the company IANA timezone for the attendance
calendar date, weekday, scheduled start, and scheduled end. The linked employee
must be active, and the local weekday must be included in
`weeklyWorkingDays`. `allowEmployeeClockIn` controls new self clock-ins; it does
not prevent an already clocked-in employee from closing that record.

Automatic self attendance uses the precedence `PARTIAL` over `LATE` over
`PRESENT`. Clock-in is `LATE` only when it occurs after `workdayStart` plus
`lateGracePeriodMinutes`. At clock-out, a record is `PARTIAL` when its elapsed
minutes are below `workdayMinutes` or clock-out occurs before `workdayEnd`;
otherwise its prior `LATE` state is preserved, and the remaining result is
`PRESENT`. The MVP supports same-day schedules only; overnight shifts and
holiday calendars remain out of scope.

The existing unique employee/date constraint is the clock-in concurrency
boundary and duplicate inserts map to HTTP 409. Clock-out conditionally updates
only a record whose `clockOutAt` is still null and requires exactly one updated
row, so stale or concurrent repeats also map to HTTP 409 without overwriting the
first committed time.
