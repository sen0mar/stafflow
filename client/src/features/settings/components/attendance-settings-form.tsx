import type { UseFormReturn } from 'react-hook-form'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
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
import { cn } from '@/shared/lib/cn'
import type { AttendanceSettingsFormValues } from '../schemas/settings-form.schema'
import { SettingsSectionHeader } from './settings-section-header'

const weekdays = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

interface AttendanceSettingsFormProps {
  demoMode: boolean
  form: UseFormReturn<AttendanceSettingsFormValues>
  isPending: boolean
  onSave: (values: AttendanceSettingsFormValues) => void
}

export const AttendanceSettingsForm = ({
  demoMode,
  form: attendanceForm,
  isPending,
  onSave,
}: AttendanceSettingsFormProps) => (
  <Card className="overflow-hidden border-default bg-surface">
    <SettingsSectionHeader
      description="These controls are enforced for employee self clock actions and their resulting attendance status."
      icon={CalendarClock}
      title="Attendance"
    />
    <CardContent>
      <Form {...attendanceForm}>
        <form
          className="space-y-5"
          onSubmit={attendanceForm.handleSubmit(onSave)}
        >
          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <FormField
              control={attendanceForm.control}
              name="workdayStart"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Workday start</FormLabel>
                  <FormControl>
                    <Input type="time" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>
                    Clock-ins after this time plus the grace period are late.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={attendanceForm.control}
              name="workdayEnd"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Workday end</FormLabel>
                  <FormControl>
                    <Input type="time" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>
                    Clocking out before this time produces a partial day.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={attendanceForm.control}
              name="workdayMinutes"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Workday minutes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Fewer elapsed minutes produces a partial day.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <FormField
              control={attendanceForm.control}
              name="lateGracePeriodMinutes"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Late grace period</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="240"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Added to the scheduled start before a clock-in is late.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={attendanceForm.control}
              name="allowEmployeeClockIn"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Employee clock-in</FormLabel>
                  <Select
                    value={field.value ? 'enabled' : 'disabled'}
                    onValueChange={(value) =>
                      field.onChange(value === 'enabled')
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Disabling blocks new employee clock-ins but still lets an
                    active clock-in be closed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={attendanceForm.control}
            name="weeklyWorkingDays"
            render={({ field }) => (
              <FormItem className="min-w-0">
                <FormLabel>Weekly working days</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((day) => {
                    const selected = field.value.includes(day.value)

                    return (
                      <Button
                        key={day.value}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        className={cn(
                          'h-9 min-w-14',
                          selected && 'shadow-glow',
                        )}
                        onClick={() => {
                          const nextValue = selected
                            ? field.value.filter((value) => value !== day.value)
                            : [...field.value, day.value].sort((a, b) => a - b)

                          field.onChange(nextValue)
                        }}
                      >
                        {day.label}
                      </Button>
                    )
                  })}
                </div>
                <FormDescription>
                  Employee self clock actions are blocked on unselected
                  company-local weekdays.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={demoMode || isPending}>
              {isPending ? 'Saving...' : 'Save attendance'}
            </Button>
          </div>
        </form>
      </Form>
    </CardContent>
  </Card>
)
