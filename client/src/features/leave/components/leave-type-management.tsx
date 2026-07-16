import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { TableSkeleton } from '@/shared/components/layout/page-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { useDemoMode } from '@/features/auth/hooks/use-auth-config'
import type { LeaveType } from '../api/leave.api'
import { LeaveTypeFormDialog } from './leave-type-form-dialog'
import {
  useCreateLeaveType,
  useDeleteLeaveType,
  useLeaveTypes,
  useUpdateLeaveType,
} from '../hooks/use-leave'
import type { LeaveTypeFormValues } from '../schemas/leave-form.schema'

const getLeaveTypePayload = (values: LeaveTypeFormValues) => ({
  annualAllowance: Number(values.annualAllowance),
  description: values.description?.trim() ? values.description.trim() : null,
  isActive: values.isActive,
  isPaid: values.isPaid,
  name: values.name.trim(),
})

export const LeaveTypeManagement = () => {
  const demoMode = useDemoMode()
  const [formOpen, setFormOpen] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(
    null,
  )
  const leaveTypesQuery = useLeaveTypes({ limit: 100, page: 1 })
  const createLeaveType = useCreateLeaveType()
  const updateLeaveType = useUpdateLeaveType()
  const deleteLeaveType = useDeleteLeaveType()
  const leaveTypes = leaveTypesQuery.data?.data ?? []

  const openCreate = () => {
    setEditingLeaveType(null)
    setFormOpen(true)
  }

  const handleSubmit = (values: LeaveTypeFormValues) => {
    const payload = getLeaveTypePayload(values)

    if (editingLeaveType) {
      updateLeaveType.mutate(
        { id: editingLeaveType.id, ...payload },
        {
          onSuccess: () => {
            setEditingLeaveType(null)
            setFormOpen(false)
          },
        },
      )
      return
    }

    createLeaveType.mutate(payload, {
      onSuccess: () => setFormOpen(false),
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Leave types</h2>
          <p className="mt-1 text-sm text-muted">
            Manage request categories and allowances.
          </p>
        </div>
        {!demoMode ? (
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create type
          </Button>
        ) : null}
      </div>
      {leaveTypesQuery.isLoading ? <TableSkeleton /> : null}
      {leaveTypes.length > 0 ? (
        <div className="rounded-2xl border border-default bg-surface p-2 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Allowance</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                {!demoMode ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  {!demoMode ? (
                    <TableCell>
                      <div>
                        <p className="font-medium text-primary">
                          {leaveType.name}
                        </p>
                        <p className="text-xs text-muted">
                          {leaveType.description ?? 'No description'}
                        </p>
                      </div>
                    </TableCell>
                  ) : null}
                  <TableCell>{leaveType.annualAllowance ?? 0} days</TableCell>
                  <TableCell>{leaveType.isPaid ? 'Paid' : 'Unpaid'}</TableCell>
                  <TableCell>
                    {leaveType.isActive ? 'Active' : 'Inactive'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingLeaveType(leaveType)
                          setFormOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => deleteLeaveType.mutate(leaveType.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      {!demoMode ? (
        <LeaveTypeFormDialog
          isSubmitting={createLeaveType.isPending || updateLeaveType.isPending}
          leaveType={editingLeaveType}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  )
}
