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
import type { AttendanceRecord } from '../api/attendance.api'
import {
  attendanceCorrectionSchema,
  type AttendanceCorrectionValues,
} from '../schemas/attendance-correction.schema'

interface AdminCorrectionDialogProps {
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AttendanceCorrectionValues) => void
  open: boolean
  record?: AttendanceRecord | null
}

const toDateTimeLocalValue = (value: string | null) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60_000

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

const getDefaultValues = (record?: AttendanceRecord | null): AttendanceCorrectionValues => ({
  clockInAt: toDateTimeLocalValue(record?.clockInAt ?? null),
  clockOutAt: toDateTimeLocalValue(record?.clockOutAt ?? null),
  notes: record?.notes ?? '',
  status: record?.status ?? 'PRESENT',
})

export const AdminCorrectionDialog = ({
  isSubmitting,
  onOpenChange,
  onSubmit,
  open,
  record,
}: AdminCorrectionDialogProps) => {
  const form = useForm<AttendanceCorrectionValues>({
    defaultValues: getDefaultValues(record),
    resolver: zodResolver(attendanceCorrectionSchema),
  })

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(record))
    }
  }, [form, open, record])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Correct attendance</DialogTitle>
          <DialogDescription>
            {record ? `Update ${record.employee.fullName}'s attendance record.` : 'Update attendance details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="clockInAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock in</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clockOutAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock out</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional correction note" rows={3} {...field} />
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
                {isSubmitting ? 'Saving...' : 'Save correction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
