import { Mail, Phone, UserRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatDate } from '@/shared/lib/dates'
import type { Employee } from '../api/employees.api'
import { EmployeeStatusBadge } from './employee-status-badge'

interface EmployeeProfileCardProps {
  employee: Employee
}

const getField = (value: string | null | undefined) => value || 'Not provided'

export const EmployeeProfileCard = ({ employee }: EmployeeProfileCardProps) => (
  <Card className="border-default bg-surface shadow-soft">
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-xl">{employee.fullName}</CardTitle>
            <p className="mt-1 text-sm text-muted">{employee.jobTitle || 'No job title'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <EmployeeStatusBadge status={employee.status} />
          {employee.account ? <EmployeeStatusBadge status={employee.account.status} type="account" /> : null}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-subtle bg-inset p-4">
          <p className="text-xs font-medium uppercase tracking-normal text-muted">Employee code</p>
          <p className="mt-1 font-medium text-primary">{employee.employeeCode}</p>
        </div>
        <div className="rounded-xl border border-subtle bg-inset p-4">
          <p className="text-xs font-medium uppercase tracking-normal text-muted">Department</p>
          <p className="mt-1 font-medium text-primary">{employee.department?.name ?? 'Unassigned'}</p>
        </div>
        <div className="rounded-xl border border-subtle bg-inset p-4">
          <p className="text-xs font-medium uppercase tracking-normal text-muted">Hire date</p>
          <p className="mt-1 font-medium text-primary">
            {employee.hireDate ? formatDate(employee.hireDate, 'MMM d, yyyy') : 'Not provided'}
          </p>
        </div>
        <div className="rounded-xl border border-subtle bg-inset p-4">
          <p className="text-xs font-medium uppercase tracking-normal text-muted">Last updated</p>
          <p className="mt-1 font-medium text-primary">{formatDate(employee.updatedAt, 'MMM d, yyyy')}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="flex items-center gap-2 text-muted">
          <Mail className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">{getField(employee.account?.email)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Phone className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">{getField(employee.phone)}</span>
        </div>
      </div>
    </CardContent>
  </Card>
)
