import { LogIn, LogOut } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface AttendanceActionConfirmDialogProps {
  action: 'clock-in' | 'clock-out' | null
  isSubmitting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

const actionContent = {
  'clock-in': {
    buttonLabel: 'Confirm clock in',
    description: 'This will record your clock-in time using the current server time.',
    icon: LogIn,
    title: 'Clock in now?',
  },
  'clock-out': {
    buttonLabel: 'Confirm clock out',
    description: 'This will record your clock-out time and close today’s active attendance record.',
    icon: LogOut,
    title: 'Clock out now?',
  },
}

export const AttendanceActionConfirmDialog = ({
  action,
  isSubmitting,
  onConfirm,
  onOpenChange,
  open,
}: AttendanceActionConfirmDialogProps) => {
  const content = action ? actionContent[action] : actionContent['clock-in']
  const Icon = content.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Saving...' : content.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
