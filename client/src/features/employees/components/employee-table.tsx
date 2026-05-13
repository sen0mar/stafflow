import { Edit3, Eye, MoreHorizontal, Power, PowerOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DataTable,
  type DataTableColumn,
} from '@/shared/components/data-table/data-table'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { formatDate } from '@/shared/lib/dates'
import type { Employee } from '../api/employees.api'
import { EmployeeStatusBadge } from './employee-status-badge'

interface EmployeeTableProps {
  employees: Employee[]
  onDisable: (employee: Employee) => void
  onEdit: (employee: Employee) => void
  onEnable: (employee: Employee) => void
}

export const EmployeeTable = ({
  employees,
  onDisable,
  onEdit,
  onEnable,
}: EmployeeTableProps) => {
  const columns: DataTableColumn<Employee>[] = [
    {
      header: 'Employee',
      id: 'employee',
      render: (employee) => (
        <div className="min-w-0">
          <p className="font-medium text-primary">{employee.fullName}</p>
          <p className="mt-1 text-xs text-muted">
            {employee.employeeCode} · {employee.jobTitle || 'No job title'}
          </p>
        </div>
      ),
    },
    {
      header: 'Department',
      id: 'department',
      render: (employee) => employee.department?.name ?? 'Unassigned',
    },
    {
      header: 'Status',
      id: 'status',
      render: (employee) => <EmployeeStatusBadge status={employee.status} />,
    },
    {
      header: 'Account',
      id: 'account',
      render: (employee) =>
        employee.account ? (
          <EmployeeStatusBadge
            status={employee.account.status}
            type="account"
          />
        ) : (
          'No account'
        ),
    },
    {
      header: 'Hire date',
      id: 'hireDate',
      render: (employee) =>
        employee.hireDate
          ? formatDate(employee.hireDate, 'MMM d, yyyy')
          : 'Not provided',
    },
    {
      className: 'w-12',
      header: <span className="sr-only">Actions</span>,
      id: 'actions',
      render: (employee) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Open actions for ${employee.fullName}`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/app/employees/${employee.id}`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(employee)}>
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            {employee.status === 'ACTIVE' ? (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDisable(employee)}
              >
                <PowerOff className="h-4 w-4" aria-hidden="true" />
                Disable
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onEnable(employee)}>
                <Power className="h-4 w-4" aria-hidden="true" />
                Enable
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      getRowKey={(employee) => employee.id}
      items={employees}
    />
  )
}
