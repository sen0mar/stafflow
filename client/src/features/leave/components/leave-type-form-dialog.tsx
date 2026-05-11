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
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import type { LeaveType } from '../api/leave.api'
import { leaveTypeFormSchema, type LeaveTypeFormValues } from '../schemas/leave-form.schema'

interface LeaveTypeFormDialogProps {
  isSubmitting: boolean
  leaveType?: LeaveType | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LeaveTypeFormValues) => void
  open: boolean
}

const getDefaultValues = (leaveType?: LeaveType | null): LeaveTypeFormValues => ({
  annualAllowance: String(leaveType?.annualAllowance ?? 0),
  description: leaveType?.description ?? '',
  isActive: leaveType?.isActive ?? true,
  isPaid: leaveType?.isPaid ?? true,
  name: leaveType?.name ?? '',
})

export const LeaveTypeFormDialog = ({
  isSubmitting,
  leaveType,
  onOpenChange,
  onSubmit,
  open,
}: LeaveTypeFormDialogProps) => {
  const form = useForm<LeaveTypeFormValues>({
    defaultValues: getDefaultValues(leaveType),
    resolver: zodResolver(leaveTypeFormSchema),
  })
  const isEditing = Boolean(leaveType)

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(leaveType))
    }
  }, [form, leaveType, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit leave type' : 'Create leave type'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update allowance, payment status, and availability.' : 'Add a request type employees can select.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Annual leave" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="annualAllowance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowance</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment</FormLabel>
                    <Select value={field.value ? 'paid' : 'unpaid'} onValueChange={(value) => field.onChange(value === 'paid')}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value ? 'active' : 'inactive'} onValueChange={(value) => field.onChange(value === 'active')}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional leave policy note" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create leave type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
