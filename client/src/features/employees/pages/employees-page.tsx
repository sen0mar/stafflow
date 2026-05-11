import { Plus, Search, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
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
import { useDepartments } from '@/features/departments/hooks/use-departments'
import type { Employee, EmployeeSort, EmployeeStatus } from '../api/employees.api'
import { EmployeeForm } from '../components/employee-form'
import { EmployeeTable } from '../components/employee-table'
import {
  useCreateEmployee,
  useDisableEmployee,
  useEmployees,
  useUpdateEmployee,
  useUpdateEmployeeStatus,
} from '../hooks/use-employees'
import type { CreateEmployeeFormValues, EmployeeFormValues } from '../schemas/employee-form.schema'

const pageSize = 10
const allValue = 'all'

type StatusFilter = EmployeeStatus | typeof allValue

const toIsoDate = (value?: string) => (value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null)
const getNullableValue = (value?: string | null) => (value && value.trim() ? value.trim() : null)
const getDepartmentValue = (value?: string | null) => (value && value !== 'unassigned' ? value : null)

const EmployeesLoading = () => (
  <div className="space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft">
    {Array.from({ length: 6 }, (_item, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
)

const EmployeesEmpty = () => (
  <div className="rounded-2xl border border-dashed border-default bg-surface px-6 py-12 text-center shadow-soft">
    <UsersRound className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
    <h2 className="mt-4 text-lg font-semibold text-primary">No employees found</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
      Create the first employee, or adjust the current search and filters.
    </p>
  </div>
)

export const EmployeesPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState(allValue)
  const [status, setStatus] = useState<StatusFilter>(allValue)
  const [sort, setSort] = useState<EmployeeSort>('name')
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
  const departmentsQuery = useDepartments({ isActive: true, page: 1, pageSize: 100 })
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const updateEmployeeStatus = useUpdateEmployeeStatus()
  const disableEmployee = useDisableEmployee()
  const employees = employeesQuery.data?.items ?? []
  const pagination = employeesQuery.data?.pagination
  const departments = departmentsQuery.data?.items ?? []

  const openCreateDialog = () => {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  const handleSubmit = (values: CreateEmployeeFormValues | EmployeeFormValues) => {
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
      accountStatus: employee.account?.status === 'DISABLED' ? 'ACTIVE' : employee.account?.status,
      employeeStatus: 'ACTIVE',
      id: employee.id,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

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
              <h2 className="font-semibold text-primary">Invitation ready for {createdInvitation.employeeName}</h2>
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
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              className="pl-9"
              placeholder="Search employees"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
          <Select
            value={departmentId}
            onValueChange={(value) => {
              setDepartmentId(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={allValue}>All departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={allValue}>All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as EmployeeSort)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {employeesQuery.isLoading ? <EmployeesLoading /> : null}
        {employeesQuery.isError ? (
          <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
            Employees could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {employeesQuery.data && employees.length === 0 ? <EmployeesEmpty /> : null}
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
              page={pagination?.page ?? page}
              pageCount={pagination?.pageCount ?? 1}
              total={pagination?.total ?? 0}
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
