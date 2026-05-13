import { Plus, UsersRound } from 'lucide-react'
import { useCallback, useState } from 'react'
import { FilterSelect } from '@/shared/components/data-table/filter-select'
import { Button } from '@/shared/components/ui/button'
import { SearchInput } from '@/shared/components/data-table/search-input'
import { TableToolbar } from '@/shared/components/data-table/table-toolbar'
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { PageHeader } from '@/shared/components/layout/page-header'
import {
  EmptyState,
  QueryStateError,
  TableSkeleton,
} from '@/shared/components/layout/page-state'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'
import { useDepartments } from '@/features/departments/hooks/use-departments'
import type {
  Employee,
  EmployeeSort,
  EmployeeStatus,
} from '../api/employees.api'
import { EmployeeForm } from '../components/employee-form'
import { EmployeeTable } from '../components/employee-table'
import {
  useCreateEmployee,
  useDisableEmployee,
  useEmployees,
  useUpdateEmployee,
  useUpdateEmployeeStatus,
} from '../hooks/use-employees'
import type {
  CreateEmployeeFormValues,
  EmployeeFormValues,
} from '../schemas/employee-form.schema'

const pageSize = 10
const allValue = 'all'

type StatusFilter = EmployeeStatus | typeof allValue

const toIsoDate = (value?: string) =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null
const getNullableValue = (value?: string | null) =>
  value && value.trim() ? value.trim() : null
const getDepartmentValue = (value?: string | null) =>
  value && value !== 'unassigned' ? value : null

export const EmployeesPage = () => {
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const search = tableState.getString('search')
  const departmentId = tableState.getString('departmentId', allValue)
  const status = tableState.getString('status', allValue) as StatusFilter
  const sort = tableState.getString('sort', 'name') as EmployeeSort
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [createdInvitation, setCreatedInvitation] = useState<{
    employeeName: string
    expiresAt: string
    token: string
  } | null>(null)
  const employeesQuery = useEmployees({
    departmentId: departmentId === allValue ? undefined : departmentId,
    limit: pageSize,
    page,
    search: search.trim() || undefined,
    sort,
    status: status === allValue ? undefined : status,
  })
  const departmentsQuery = useDepartments({
    isActive: true,
    page: 1,
    pageSize: 100,
  })
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const updateEmployeeStatus = useUpdateEmployeeStatus()
  const disableEmployee = useDisableEmployee()
  const employees = employeesQuery.data?.data ?? []
  const pagination = employeesQuery.data?.meta
  const departments = departmentsQuery.data?.data ?? []
  const { updateQuery } = tableState
  const setPage = useCallback(
    (nextPage: number) => {
      updateQuery({ page: nextPage === 1 ? undefined : nextPage })
    },
    [updateQuery],
  )

  const openCreateDialog = () => {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  const handleSubmit = (
    values: CreateEmployeeFormValues | EmployeeFormValues,
  ) => {
    const payload = {
      departmentId: getDepartmentValue(values.departmentId),
      employeeCode: values.employeeCode.trim(),
      firstName: values.firstName.trim(),
      hireDate: toIsoDate(values.hireDate),
      jobTitle: getNullableValue(values.jobTitle),
      lastName: values.lastName.trim(),
      phone: getNullableValue(values.phone),
    }

    if (editingEmployee) {
      updateEmployee.mutate(
        { id: editingEmployee.id, ...payload },
        {
          onSuccess: () => {
            setFormOpen(false)
            setEditingEmployee(null)
          },
        },
      )
      return
    }

    createEmployee.mutate(
      {
        ...payload,
        email: values.email?.trim() ?? '',
      },
      {
        onSuccess: (result) => {
          setFormOpen(false)
          setPage(1)
          setCreatedInvitation({
            employeeName: result.employee.fullName,
            expiresAt: result.invitation.expiresAt,
            token: result.invitation.token,
          })
        },
      },
    )
  }

  const handleDisable = (employee: Employee) => {
    disableEmployee.mutate(employee.id)
  }

  const handleEnable = (employee: Employee) => {
    updateEmployeeStatus.mutate({
      accountStatus:
        employee.account?.status === 'DISABLED'
          ? 'ACTIVE'
          : employee.account?.status,
      employeeStatus: 'ACTIVE',
      id: employee.id,
    })
  }

  const handleSearchChange = useCallback(
    (value: string) => {
      updateQuery({ search: value.trim() || undefined }, { resetPage: true })
    },
    [updateQuery],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Employees"
        description="Manage employee profiles, department assignments, account status, and invitations."
        actions={
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create employee
          </Button>
        }
      />

      {createdInvitation ? (
        <section className="rounded-2xl border border-default bg-brand-soft p-4 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-primary">
                Invitation ready for {createdInvitation.employeeName}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Share this setup token through a secure channel. It expires on{' '}
                {new Date(createdInvitation.expiresAt).toLocaleDateString()}.
              </p>
            </div>
            <code className="overflow-auto rounded-xl border border-default bg-inset px-3 py-2 text-sm text-primary">
              {createdInvitation.token}
            </code>
          </div>
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <TableToolbar className="lg:grid-cols-[minmax(0,1fr)_180px_180px_160px]">
          <SearchInput
            key={search}
            placeholder="Search employees"
            value={search}
            onDebouncedChange={handleSearchChange}
          />
          <FilterSelect
            value={departmentId}
            onValueChange={(value) =>
              tableState.updateQuery(
                { departmentId: value },
                { resetPage: true },
              )
            }
            options={[
              { label: 'All departments', value: allValue },
              ...departments.map((department) => ({
                label: department.name,
                value: department.id,
              })),
            ]}
          />
          <FilterSelect
            value={status}
            onValueChange={(value) =>
              tableState.updateQuery({ status: value }, { resetPage: true })
            }
            options={[
              { label: 'All statuses', value: allValue },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
              { label: 'Terminated', value: 'TERMINATED' },
            ]}
          />
          <FilterSelect
            value={sort}
            onValueChange={(value) =>
              tableState.updateQuery(
                { sort: value === 'name' ? undefined : value },
                { resetPage: true },
              )
            }
            options={[
              { label: 'Name', value: 'name' },
              { label: 'Newest', value: 'newest' },
              { label: 'Oldest', value: 'oldest' },
              { label: 'Department', value: 'department' },
              { label: 'Status', value: 'status' },
            ]}
          />
        </TableToolbar>

        {employeesQuery.isLoading ? <TableSkeleton /> : null}
        {employeesQuery.isError ? (
          <QueryStateError
            error={employeesQuery.error}
            title="Employees could not be loaded"
            description="Refresh the page or try again later."
          />
        ) : null}
        {employeesQuery.data && employees.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No employees found"
            description="Create the first employee, or adjust the current search and filters."
          />
        ) : null}
        {employees.length > 0 ? (
          <>
            <EmployeeTable
              employees={employees}
              onDisable={handleDisable}
              onEdit={openEditDialog}
              onEnable={handleEnable}
            />
            <PaginationControls
              itemLabel="employees"
              meta={
                pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }
              }
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <EmployeeForm
        departments={departments}
        employee={editingEmployee}
        isSubmitting={createEmployee.isPending || updateEmployee.isPending}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
