import { ExternalLink } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface PayslipPreviewDialogProps {
  fileName: string | null
  onOpenChange: (open: boolean) => void
  open: boolean
  previewUrl: string | null
}

export const PayslipPreviewDialog = ({
  fileName,
  onOpenChange,
  open,
  previewUrl,
}: PayslipPreviewDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>{fileName ?? 'Payslip preview'}</DialogTitle>
        <DialogDescription>
          Signed preview links expire shortly after they are created.
        </DialogDescription>
      </DialogHeader>
      <div className="h-[70vh] overflow-hidden rounded-lg border border-default bg-inset">
        {previewUrl ? (
          <iframe
            className="h-full w-full"
            src={previewUrl}
            title={fileName ?? 'Payslip preview'}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Preview is loading.
          </div>
        )}
      </div>
      <DialogFooter>
        {previewUrl ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              window.open(previewUrl, '_blank', 'noopener,noreferrer')
            }
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open in new tab
          </Button>
        ) : null}
        <Button type="button" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
