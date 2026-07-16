import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { LeaveTypeSelector } from './leave-type-selector'
import {
  leaveRequestFormSchema,
  MAX_LEAVE_REQUEST_CALENDAR_DAYS,
  type LeaveRequestFormValues,
} from '../schemas/leave-form.schema'

interface LeaveRequestFormProps {
  isSubmitting: boolean
  onSubmit: (values: LeaveRequestFormValues) => void
}

const defaultValues: LeaveRequestFormValues = {
  endDate: '',
  leaveTypeId: '',
  reason: '',
  startDate: '',
}

export const LeaveRequestForm = ({
  isSubmitting,
  onSubmit,
}: LeaveRequestFormProps) => {
  const form = useForm<LeaveRequestFormValues>({
    defaultValues,
    resolver: zodResolver(leaveRequestFormSchema),
  })

  return (
    <Form {...form}>
      <form
        className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={form.handleSubmit((values) => {
          onSubmit(values)
          form.reset(defaultValues)
        })}
      >
        <FormField
          control={form.control}
          name="leaveTypeId"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>Leave type</FormLabel>
              <FormControl>
                <LeaveTypeSelector
                  activeOnly
                  ariaLabel="Select leave type"
                  id="leave-request-type"
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input type="date" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input type="date" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit request'}
          </Button>
        </div>
        <p className="text-xs text-muted lg:col-span-4">
          Requests must stay within one calendar year and may cover up to{' '}
          {MAX_LEAVE_REQUEST_CALENDAR_DAYS} days. Every date in the range
          counts, including weekends and holidays.
        </p>
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem className="lg:col-span-4">
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional note for the approver"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
