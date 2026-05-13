import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Textarea } from '@/shared/components/ui/textarea'
import type { LeaveRequest } from '../api/leave.api'
import {
  leaveReviewSchema,
  type LeaveReviewValues,
} from '../schemas/leave-form.schema'

interface LeaveReviewDialogProps {
  action: 'approve' | 'reject' | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LeaveReviewValues) => void
  open: boolean
  request?: LeaveRequest | null
}

export const LeaveReviewDialog = ({
  action,
  isSubmitting,
  onOpenChange,
  onSubmit,
  open,
  request,
}: LeaveReviewDialogProps) => {
  const form = useForm<LeaveReviewValues>({
    defaultValues: { reviewNote: '' },
    resolver: zodResolver(leaveReviewSchema),
  })
  const isRejecting = action === 'reject'

  useEffect(() => {
    if (open) {
      form.reset({ reviewNote: '' })
    }
  }, [form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRejecting ? 'Reject leave request' : 'Approve leave request'}
          </DialogTitle>
          <DialogDescription>
            {request
              ? `${isRejecting ? 'Reject' : 'Approve'} ${request.employee.fullName}'s ${request.leaveType.name.toLowerCase()} request.`
              : 'Review this leave request.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="reviewNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional note for the employee"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={isRejecting ? 'destructive' : 'default'}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Saving...'
                  : isRejecting
                    ? 'Reject request'
                    : 'Approve request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
