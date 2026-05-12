import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Building2, CalendarClock, FileText, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
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
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Textarea } from '@/shared/components/ui/textarea'
import { cn } from '@/shared/lib/cn'
import type {
  AttendanceSettings,
  CompanySettings,
  LeaveSettings,
} from '../api/settings.api'
import {
  useAttendanceSettings,
  useCompanySettings,
  useLeaveSettings,
  useUpdateAttendanceSettings,
  useUpdateCompanySettings,
  useUpdateLeaveSettings,
} from '../hooks/use-settings'
import {
  attendanceSettingsFormSchema,
  companySettingsFormSchema,
  leaveSettingsFormSchema,
  type AttendanceSettingsFormValues,
  type CompanySettingsFormValues,
  type LeaveSettingsFormValues,
} from '../schemas/settings-form.schema'

const weekdays = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
]

const getCompanyDefaults = (settings?: CompanySettings): CompanySettingsFormValues => ({
  locale: settings?.locale ?? 'en-US',
  name: settings?.name ?? '',
  timezone: settings?.timezone ?? 'UTC',
})

const getAttendanceDefaults = (settings?: AttendanceSettings): AttendanceSettingsFormValues => ({
  allowEmployeeClockIn: settings?.allowEmployeeClockIn ?? true,
  lateGracePeriodMinutes: settings?.lateGracePeriodMinutes ?? 0,
  weeklyWorkingDays: settings?.weeklyWorkingDays ?? [1, 2, 3, 4, 5],
  workdayEnd: settings?.workdayEnd ?? '17:00',
  workdayMinutes: settings?.workdayMinutes ?? 480,
  workdayStart: settings?.workdayStart ?? '09:00',
})

const getLeaveDefaults = (settings?: LeaveSettings): LeaveSettingsFormValues => ({
  allowNegativeBalance: settings?.allowNegativeBalance ?? false,
  defaultAnnualAllowanceDays: settings?.defaultAnnualAllowanceDays ?? 0,
  policyText: settings?.policyText ?? '',
})

const SettingsSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 rounded-2xl" />
    <Skeleton className="h-64 rounded-2xl" />
    <Skeleton className="h-64 rounded-2xl" />
  </div>
)

interface SectionHeaderProps {
  description: string
  icon: LucideIcon
  title: string
}

const SectionHeader = ({ description, icon: Icon, title }: SectionHeaderProps) => (
  <CardHeader>
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-brand-soft p-2 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </div>
    </div>
  </CardHeader>
)

export const SettingsPage = () => {
  const companyQuery = useCompanySettings()
  const attendanceQuery = useAttendanceSettings()
  const leaveQuery = useLeaveSettings()
  const updateCompanyMutation = useUpdateCompanySettings()
  const updateAttendanceMutation = useUpdateAttendanceSettings()
  const updateLeaveMutation = useUpdateLeaveSettings()
  const isLoading = companyQuery.isLoading || attendanceQuery.isLoading || leaveQuery.isLoading
  const hasError = companyQuery.isError || attendanceQuery.isError || leaveQuery.isError
  const demoMode = Boolean(
    companyQuery.data?.demoMode || attendanceQuery.data?.demoMode || leaveQuery.data?.demoMode,
  )
  const timezoneOptions =
    companyQuery.data && !commonTimezones.includes(companyQuery.data.timezone)
      ? [companyQuery.data.timezone, ...commonTimezones]
      : commonTimezones

  const companyForm = useForm<CompanySettingsFormValues>({
    defaultValues: getCompanyDefaults(companyQuery.data),
    resolver: zodResolver(companySettingsFormSchema),
  })
  const attendanceForm = useForm<AttendanceSettingsFormValues>({
    defaultValues: getAttendanceDefaults(attendanceQuery.data),
    resolver: zodResolver(attendanceSettingsFormSchema),
  })
  const leaveForm = useForm<LeaveSettingsFormValues>({
    defaultValues: getLeaveDefaults(leaveQuery.data),
    resolver: zodResolver(leaveSettingsFormSchema),
  })

  useEffect(() => {
    if (companyQuery.data) {
      companyForm.reset(getCompanyDefaults(companyQuery.data))
    }
  }, [companyForm, companyQuery.data])

  useEffect(() => {
    if (attendanceQuery.data) {
      attendanceForm.reset(getAttendanceDefaults(attendanceQuery.data))
    }
  }, [attendanceForm, attendanceQuery.data])

  useEffect(() => {
    if (leaveQuery.data) {
      leaveForm.reset(getLeaveDefaults(leaveQuery.data))
    }
  }, [leaveForm, leaveQuery.data])

  if (isLoading) {
    return <SettingsSkeleton />
  }

  if (hasError) {
    return (
      <Card className="border-default bg-surface">
        <CardHeader>
          <CardTitle>Settings unavailable</CardTitle>
          <CardDescription>Refresh the page or sign in with an admin account.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-brand">Admin settings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-primary">Settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Manage the basic company defaults used across attendance, leave, and employee self-service.
        </p>
      </div>

      {demoMode ? (
        <div className="flex items-start gap-3 rounded-2xl border border-default bg-brand-soft p-4 text-sm text-primary">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div>
            <p className="font-medium">Demo mode is enabled.</p>
            <p className="mt-1 text-muted">
              Settings changes are audited and may be reset with the demo seed data.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="border-default bg-surface">
        <SectionHeader
          description="Set the organization name and regional defaults."
          icon={Building2}
          title="Company"
        />
        <CardContent>
          <Form {...companyForm}>
            <form
              className="grid gap-4 lg:grid-cols-[1fr_1fr_120px_auto] lg:items-end"
              onSubmit={companyForm.handleSubmit((values) => updateCompanyMutation.mutate(values))}
            >
              <FormField
                control={companyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company name</FormLabel>
                    <FormControl>
                      <Input placeholder="Stafflow Demo Company" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timezoneOptions.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locale</FormLabel>
                    <FormControl>
                      <Input placeholder="en-US" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateCompanyMutation.isPending}>
                {updateCompanyMutation.isPending ? 'Saving...' : 'Save company'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-default bg-surface">
        <SectionHeader
          description="Set the standard workday and employee clock-in availability."
          icon={CalendarClock}
          title="Attendance"
        />
        <CardContent>
          <Form {...attendanceForm}>
            <form
              className="space-y-5"
              onSubmit={attendanceForm.handleSubmit((values) => updateAttendanceMutation.mutate(values))}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={attendanceForm.control}
                  name="workdayStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workday start</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={attendanceForm.control}
                  name="workdayEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workday end</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={attendanceForm.control}
                  name="workdayMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workday minutes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={attendanceForm.control}
                  name="lateGracePeriodMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Late grace period</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="240"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={attendanceForm.control}
                  name="allowEmployeeClockIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee clock-in</FormLabel>
                      <Select value={field.value ? 'enabled' : 'disabled'} onValueChange={(value) => field.onChange(value === 'enabled')}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={attendanceForm.control}
                name="weeklyWorkingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly working days</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {weekdays.map((day) => {
                        const selected = field.value.includes(day.value)

                        return (
                          <Button
                            key={day.value}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            className={cn('h-9 min-w-14', selected && 'shadow-glow')}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateAttendanceMutation.isPending}>
                  {updateAttendanceMutation.isPending ? 'Saving...' : 'Save attendance'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-default bg-surface">
        <SectionHeader
          description="Set default leave allowance behavior and the visible policy note."
          icon={FileText}
          title="Leave"
        />
        <CardContent>
          <Form {...leaveForm}>
            <form
              className="space-y-5"
              onSubmit={leaveForm.handleSubmit((values) =>
                updateLeaveMutation.mutate({
                  ...values,
                  policyText: values.policyText.trim().length > 0 ? values.policyText.trim() : null,
                }),
              )}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={leaveForm.control}
                  name="defaultAnnualAllowanceDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default allowance days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="365"
                          step="0.5"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leaveForm.control}
                  name="allowNegativeBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Negative balance</FormLabel>
                      <Select value={field.value ? 'allowed' : 'blocked'} onValueChange={(value) => field.onChange(value === 'allowed')}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="allowed">Allowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={leaveForm.control}
                name="policyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy note</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Basic leave policy and review expectations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateLeaveMutation.isPending}>
                  {updateLeaveMutation.isPending ? 'Saving...' : 'Save leave'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
