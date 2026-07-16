import { Plus, UsersRound } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
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
import { getAllowedQueryValue } from '@/shared/lib/query-values'
import { useDepartments } from '@/features/departments/hooks/use-departments'
import { useDemoMode } from '@/features/auth/hooks/use-auth-config'
import type {
  Employee,
  EmployeeInvitation,
  EmployeeSort,
  EmployeeStatus,
} from '../api/employees.api'
import { EmployeeForm } from '../components/employee-form'
import { EmployeeInvitationsPanel } from '../components/employee-invitations-panel'
import { EmployeeTable } from '../components/employee-table'
import {
  useCreateEmployee,
  useDisableEmployee,
  useEmployeeInvitations,
  useEmployees,
  useRegenerateEmployeeInvitation,
  useUpdateEmployee,
  useUpdateEmployeeStatus,
} from '../hooks/use-employees'
import type {
  CreateEmployeeFormValues,
  EmployeeFormValues,
} from '../schemas/employee-form.schema'
import { getInvitationSetupUrl } from '../lib/invitation-links'

const pageSize = 10
const allValue = 'all'

type StatusFilter = EmployeeStatus | typeof allValue
const statusFilterValues = [
  allValue,
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
] as const satisfies readonly StatusFilter[]
const employeeSortValues = [
  'name',
  'newest',
  'oldest',
  'department',
  'status',
] as const satisfies readonly EmployeeSort[]

const getNullableValue = (value?: string | null) =>
  value && value.trim() ? value.trim() : null
const getDepartmentValue = (value?: string | null) =>
  value && value !== 'unassigned' ? value : null

export const EmployeesPage = () => {
  const demoMode = useDemoMode()
  const tableState = useTableQueryState()
  const page = tableState.getNumber('page', 1)
  const search = tableState.getString('search')
  const departmentId = tableState.getString('departmentId', allValue)
  const status = getAllowedQueryValue(
    tableState.getString('status', allValue),
    statusFilterValues,
    allValue,
  )
  const sort = getAllowedQueryValue(
    tableState.getString('sort', 'name'),
    employeeSortValues,
    'name',
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [setupUrlsByEmployeeId, setSetupUrlsByEmployeeId] = useState<
    Record<string, string>
  >({})
  const [copiedInvitationEmployeeId, setCopiedInvitationEmployeeId] = useState<
    string | null
  >(null)
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
  const employeeInvitationsQuery = useEmployeeInvitations()
  const updateEmployee = useUpdateEmployee()
  const regenerateInvitation = useRegenerateEmployeeInvitation()
  const updateEmployeeStatus = useUpdateEmployeeStatus()
  const disableEmployee = useDisableEmployee()
  const employees = employeesQuery.data?.data ?? []
  const pendingInvitations = useMemo(() => {
    const invitations = employeeInvitationsQuery.data ?? []

    return [...invitations].sort((first, second) =>
      first.employeeName.localeCompare(second.employeeName),
    )
  }, [employeeInvitationsQuery.data])
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
      hireDate: values.hireDate || null,
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
          const setupUrl = getInvitationSetupUrl(result.invitation.token)
          setFormOpen(false)
          setPage(1)
          setSetupUrlsByEmployeeId((current) => ({
            ...current,
            [result.employee.id]: setupUrl,
          }))
          setCopiedInvitationEmployeeId(null)
        },
      },
    )
  }

  const handleGenerateInvitationUrl = (invitation: EmployeeInvitation) => {
    const existingUrl = setupUrlsByEmployeeId[invitation.employeeId]

    if (existingUrl) {
      void handleCopyInvitationUrl(invitation.employeeId, existingUrl)
      return
    }

    regenerateInvitation.mutate(invitation.employeeId, {
      onSuccess: (result) => {
        const setupUrl = getInvitationSetupUrl(result.invitation.token)

        setSetupUrlsByEmployeeId((current) => ({
          ...current,
          [result.employee.employeeId]: setupUrl,
        }))
        void handleCopyInvitationUrl(result.employee.employeeId, setupUrl)
      },
    })
  }

  const handleCopyInvitationUrl = async (
    employeeId: string,
    setupUrl: string,
  ) => {
    try {
      await navigator.clipboard.writeText(setupUrl)
      setCopiedInvitationEmployeeId(employeeId)
      window.setTimeout(() => {
        setCopiedInvitationEmployeeId((current) =>
          current === employeeId ? null : current,
        )
      }, 2000)
    } catch {
      setCopiedInvitationEmployeeId(null)
    }
  }

  const handleDismissOneTimeUrl = (employeeId: string) => {
    setSetupUrlsByEmployeeId((current) => {
      const next = { ...current }

      delete next[employeeId]

      return next
    })
    setCopiedInvitationEmployeeId((current) =>
      current === employeeId ? null : current,
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
          !demoMode ? (
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create employee
            </Button>
          ) : null
        }
      />

      {!demoMode ? (
        <EmployeeInvitationsPanel
          copiedEmployeeId={copiedInvitationEmployeeId}
          generatingEmployeeId={
            regenerateInvitation.isPending
              ? (regenerateInvitation.variables ?? null)
              : null
          }
          hasError={employeeInvitationsQuery.isError}
          invitations={pendingInvitations}
          setupUrlsByEmployeeId={setupUrlsByEmployeeId}
          onDismissLink={handleDismissOneTimeUrl}
          onGenerateLink={handleGenerateInvitationUrl}
        />
      ) : null}

      <section className="space-y-4 overflow-hidden rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <TableToolbar className="lg:grid-cols-[minmax(0,1fr)_180px_180px_160px]">
          <SearchInput
            key={search}
            id="employees-search"
            name="employeesSearch"
            placeholder="Search employees"
            value={search}
            onDebouncedChange={handleSearchChange}
          />
          <FilterSelect
            ariaLabel="Filter employees by department"
            id="employees-department-filter"
            name="employeesDepartment"
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
            ariaLabel="Filter employees by status"
            id="employees-status-filter"
            name="employeesStatus"
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
            ariaLabel="Sort employees"
            id="employees-sort"
            name="employeesSort"
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
              canManage={!demoMode}
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

      {!demoMode ? (
        <EmployeeForm
          departments={departments}
          employee={editingEmployee}
          isSubmitting={createEmployee.isPending || updateEmployee.isPending}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}
