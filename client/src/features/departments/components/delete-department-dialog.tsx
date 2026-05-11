import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import type { Department } from '../api/departments.api'

interface DeleteDepartmentDialogProps {
  department: Department | null
  isDeleting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const DeleteDepartmentDialog = ({
  department,
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
}: DeleteDepartmentDialogProps) => {
  const hasEmployees = (department?.employeeCount ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <DialogTitle>Delete department</DialogTitle>
          </div>
          <DialogDescription>
            {hasEmployees
              ? 'Departments with assigned employees cannot be deleted. Mark this department inactive instead.'
              : `Delete ${department?.name ?? 'this department'} permanently? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting || hasEmployees} onClick={onConfirm}>
            {isDeleting ? 'Deleting...' : 'Delete department'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
