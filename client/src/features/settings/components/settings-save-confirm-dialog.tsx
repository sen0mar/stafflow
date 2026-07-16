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
import type { PendingSettingsSave } from './settings-save.types'

const confirmationContent = {
  attendance: {
    buttonLabel: 'Save attendance',
    description:
      'These controls change employee self clock availability and attendance classification.',
    title: 'Save attendance settings?',
  },
  company: {
    buttonLabel: 'Save company',
    description:
      'This updates stored company metadata and the operational timezone. It does not rename or localize the Stafflow interface.',
    title: 'Save company settings?',
  },
  leave: {
    buttonLabel: 'Save leave',
    description:
      'This updates leave balance defaults and the admin-only policy metadata note.',
    title: 'Save leave settings?',
  },
} satisfies Record<
  PendingSettingsSave['type'],
  { buttonLabel: string; description: string; title: string }
>

interface SettingsSaveConfirmDialogProps {
  isSubmitting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  pendingSave: PendingSettingsSave | null
}

export const SettingsSaveConfirmDialog = ({
  isSubmitting,
  onConfirm,
  onOpenChange,
  pendingSave,
}: SettingsSaveConfirmDialogProps) => {
  const content = pendingSave
    ? confirmationContent[pendingSave.type]
    : confirmationContent.company

  return (
    <Dialog open={Boolean(pendingSave)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
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
