import { Building2, Plus, Search } from 'lucide-react'
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
import { PaginationControls } from '@/shared/components/data-table/pagination-controls'
import { PageHeader } from '@/shared/components/layout/page-header'
import {
  EmptyState,
  QueryStateError,
  TableSkeleton,
} from '@/shared/components/layout/page-state'
import { getRolePermissions, hasPermission } from '@/shared/lib/permissions'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useDemoMode } from '@/features/auth/hooks/use-auth-config'
import type { Department } from '../api/departments.api'
import { DeleteDepartmentDialog } from '../components/delete-department-dialog'
import { DepartmentFormDialog } from '../components/department-form-dialog'
import { DepartmentsTable } from '../components/departments-table'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '../hooks/use-departments'
import type { DepartmentFormValues } from '../schemas/department-form.schema'

const pageSize = 10

type StatusFilter = 'all' | 'active' | 'inactive'

const getIsActiveFilter = (status: StatusFilter) => {
  if (status === 'active') {
    return true
  }

  if (status === 'inactive') {
    return false
  }

  return undefined
}

const getMutationPayload = (values: DepartmentFormValues) => ({
  description: values.description?.trim() ? values.description.trim() : null,
  isActive: values.isActive,
  name: values.name.trim(),
})

const DepartmentsEmpty = ({ canManage }: { canManage: boolean }) => (
  <EmptyState
    icon={Building2}
    title="No departments found"
    description={
      canManage
        ? 'Create the first department, or adjust the current search and status filters.'
        : 'No departments match the current search and status filters.'
    }
  />
)

export const DepartmentsPage = () => {
  const demoMode = useDemoMode()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null)
  const currentUserQuery = useCurrentUser()
  const permissions = currentUserQuery.data
    ? getRolePermissions(currentUserQuery.data.role)
    : []
  const canManage =
    !demoMode && hasPermission(permissions, 'departments:manage')
  const departmentsQuery = useDepartments({
    isActive: getIsActiveFilter(status),
    page,
    pageSize,
    search: search.trim() || undefined,
  })
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const departments = departmentsQuery.data?.data ?? []
  const pagination = departmentsQuery.data?.meta

  const openCreateDialog = () => {
    setEditingDepartment(null)
    setFormOpen(true)
  }

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department)
    setFormOpen(true)
  }

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department)
    setDeleteOpen(true)
  }

  const handleSubmit = (values: DepartmentFormValues) => {
    const payload = getMutationPayload(values)

    if (editingDepartment) {
      updateDepartment.mutate(
        { id: editingDepartment.id, ...payload },
        {
          onSuccess: () => {
            setFormOpen(false)
            setEditingDepartment(null)
          },
        },
      )
      return
    }

    createDepartment.mutate(payload, {
      onSuccess: () => {
        setFormOpen(false)
        setPage(1)
      },
    })
  }

  const handleDelete = () => {
    if (!deletingDepartment) {
      return
    }

    deleteDepartment.mutate(deletingDepartment.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setDeletingDepartment(null)
      },
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: StatusFilter) => {
    setStatus(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Departments"
        description="Manage the department structure employees will be assigned to."
        actions={
          canManage ? (
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create department
            </Button>
          ) : null
        }
      />

      <section className="space-y-4 overflow-hidden rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              id="departments-search"
              name="departmentsSearch"
              placeholder="Search departments"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => handleStatusChange(value as StatusFilter)}
          >
            <SelectTrigger
              aria-label="Filter departments by status"
              id="departments-status-filter"
              className="w-full lg:w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {departmentsQuery.isLoading ? <TableSkeleton /> : null}
        {departmentsQuery.isError ? (
          <QueryStateError
            error={departmentsQuery.error}
            title="Departments could not be loaded"
            description="Refresh the page or try again later."
          />
        ) : null}
        {departmentsQuery.data && departments.length === 0 ? (
          <DepartmentsEmpty canManage={canManage} />
        ) : null}
        {departments.length > 0 ? (
          <>
            <DepartmentsTable
              canManage={canManage}
              departments={departments}
              onDelete={openDeleteDialog}
              onEdit={openEditDialog}
            />
            <PaginationControls
              itemLabel="departments"
              meta={
                pagination ?? { limit: pageSize, page, total: 0, totalPages: 1 }
              }
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      {canManage ? (
        <DepartmentFormDialog
          department={editingDepartment}
          isSubmitting={
            createDepartment.isPending || updateDepartment.isPending
          }
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
        />
      ) : null}
      {canManage ? (
        <DeleteDepartmentDialog
          department={deletingDepartment}
          isDeleting={deleteDepartment.isPending}
          open={deleteOpen}
          onConfirm={handleDelete}
          onOpenChange={setDeleteOpen}
        />
      ) : null}
    </div>
  )
}
