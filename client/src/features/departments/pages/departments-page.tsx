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
import { Skeleton } from '@/shared/components/ui/skeleton'
import { PageHeader } from '@/shared/components/layout/page-header'
import { getRolePermissions, hasPermission } from '@/shared/lib/permissions'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
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

const DepartmentsLoading = () => (
  <div className="space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft">
    {Array.from({ length: 6 }, (_item, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
)

const DepartmentsEmpty = ({ canManage }: { canManage: boolean }) => (
  <div className="rounded-2xl border border-dashed border-default bg-surface px-6 py-12 text-center shadow-soft">
    <Building2 className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
    <h2 className="mt-4 text-lg font-semibold text-primary">No departments found</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
      {canManage
        ? 'Create the first department, or adjust the current search and status filters.'
        : 'No departments match the current search and status filters.'}
    </p>
  </div>
)

export const DepartmentsPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null)
  const currentUserQuery = useCurrentUser()
  const permissions = currentUserQuery.data ? getRolePermissions(currentUserQuery.data.role) : []
  const canManage = hasPermission(permissions, 'departments:manage')
  const departmentsQuery = useDepartments({
    isActive: getIsActiveFilter(status),
    page,
    pageSize,
    search: search.trim() || undefined,
  })
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const departments = departmentsQuery.data?.items ?? []
  const pagination = departmentsQuery.data?.pagination

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

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              className="pl-9"
              placeholder="Search departments"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(value) => handleStatusChange(value as StatusFilter)}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {departmentsQuery.isLoading ? <DepartmentsLoading /> : null}
        {departmentsQuery.isError ? (
          <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
            Departments could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {departmentsQuery.data && departments.length === 0 ? <DepartmentsEmpty canManage={canManage} /> : null}
        {departments.length > 0 ? (
          <>
            <DepartmentsTable
              canManage={canManage}
              departments={departments}
              onDelete={openDeleteDialog}
              onEdit={openEditDialog}
            />
            <div className="flex flex-col gap-3 border-t border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Page {pagination?.page ?? page} of {pagination?.pageCount ?? 1} · {pagination?.total ?? 0} departments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!pagination || page >= pagination.pageCount}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <DepartmentFormDialog
        department={editingDepartment}
        isSubmitting={createDepartment.isPending || updateDepartment.isPending}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <DeleteDepartmentDialog
        department={deletingDepartment}
        isDeleting={deleteDepartment.isPending}
        open={deleteOpen}
        onConfirm={handleDelete}
        onOpenChange={setDeleteOpen}
      />
    </div>
  )
}
