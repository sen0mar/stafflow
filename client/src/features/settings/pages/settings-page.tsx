import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
import {
  FormSkeleton,
  QueryStateError,
} from '@/shared/components/layout/page-state'
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

const getCompanyDefaults = (
  settings?: CompanySettings,
): CompanySettingsFormValues => ({
  locale: settings?.locale ?? 'en-US',
  name: settings?.name ?? '',
  timezone: settings?.timezone ?? 'UTC',
})

const getAttendanceDefaults = (
  settings?: AttendanceSettings,
): AttendanceSettingsFormValues => ({
  allowEmployeeClockIn: settings?.allowEmployeeClockIn ?? true,
  lateGracePeriodMinutes: settings?.lateGracePeriodMinutes ?? 0,
  weeklyWorkingDays: settings?.weeklyWorkingDays ?? [1, 2, 3, 4, 5],
  workdayEnd: settings?.workdayEnd ?? '17:00',
  workdayMinutes: settings?.workdayMinutes ?? 480,
  workdayStart: settings?.workdayStart ?? '09:00',
})

const getLeaveDefaults = (
  settings?: LeaveSettings,
): LeaveSettingsFormValues => ({
  allowNegativeBalance: settings?.allowNegativeBalance ?? false,
  defaultAnnualAllowanceDays: settings?.defaultAnnualAllowanceDays ?? 0,
  policyText: settings?.policyText ?? '',
})

type PendingSettingsSave =
  | {
      type: 'company'
      values: CompanySettingsFormValues
    }
  | {
      type: 'attendance'
      values: AttendanceSettingsFormValues
    }
  | {
      type: 'leave'
      values: LeaveSettingsFormValues
    }

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
  {
    buttonLabel: string
    description: string
    title: string
  }
>

interface SettingsSaveConfirmDialogProps {
  isSubmitting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  pendingSave: PendingSettingsSave | null
}

const SettingsSaveConfirmDialog = ({
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

interface SectionHeaderProps {
  description: string
  icon: LucideIcon
  title: string
}

const SectionHeader = ({
  description,
  icon: Icon,
  title,
}: SectionHeaderProps) => (
  <CardHeader>
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-brand-soft p-2 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
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
  const [pendingSave, setPendingSave] = useState<PendingSettingsSave | null>(
    null,
  )
  const isLoading =
    companyQuery.isLoading || attendanceQuery.isLoading || leaveQuery.isLoading
  const hasError =
    companyQuery.isError || attendanceQuery.isError || leaveQuery.isError
  const firstError =
    companyQuery.error ?? attendanceQuery.error ?? leaveQuery.error
  const demoMode = Boolean(
    companyQuery.data?.demoMode ||
    attendanceQuery.data?.demoMode ||
    leaveQuery.data?.demoMode,
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
  const isConfirmingSave =
    updateCompanyMutation.isPending ||
    updateAttendanceMutation.isPending ||
    updateLeaveMutation.isPending

  const handleConfirmSave = () => {
    if (!pendingSave || demoMode) {
      return
    }

    if (pendingSave.type === 'company') {
      updateCompanyMutation.mutate(pendingSave.values, {
        onSuccess: () => setPendingSave(null),
      })

      return
    }

    if (pendingSave.type === 'attendance') {
      updateAttendanceMutation.mutate(pendingSave.values, {
        onSuccess: () => setPendingSave(null),
      })

      return
    }

    updateLeaveMutation.mutate(
      {
        ...pendingSave.values,
        policyText:
          pendingSave.values.policyText.trim().length > 0
            ? pendingSave.values.policyText.trim()
            : null,
      },
      {
        onSuccess: () => setPendingSave(null),
      },
    )
  }

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
    return <FormSkeleton />
  }

  if (hasError) {
    return (
      <QueryStateError
        error={firstError}
        title="Settings unavailable"
        description="Refresh the page or sign in with an admin account."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-brand">Admin settings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-primary">
          Settings
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Manage operational attendance and leave defaults alongside clearly
          labeled company and policy metadata.
        </p>
      </div>

      <Card className="overflow-hidden border-default bg-surface">
        <SectionHeader
          description="Timezone drives company-day behavior. Name and locale are stored metadata, not global branding or localization controls."
          icon={Building2}
          title="Company"
        />
        <CardContent>
          <Form {...companyForm}>
            <form
              className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
              onSubmit={companyForm.handleSubmit((values) => {
                if (!demoMode) {
                  setPendingSave({ type: 'company', values })
                }
              })}
            >
              <FormField
                control={companyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Company name (metadata)</FormLabel>
                    <FormControl>
                      <Input placeholder="Stafflow Demo Company" {...field} />
                    </FormControl>
                    <FormDescription>
                      Stored for company records; this does not rename the
                      Stafflow interface.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="min-w-0">
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
                    <FormDescription>
                      Sets attendance calendar days, schedules, and dated
                      employee status changes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="locale"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Locale (metadata)</FormLabel>
                    <FormControl>
                      <Input placeholder="en-US" {...field} />
                    </FormControl>
                    <FormDescription>
                      Stored for future use; this does not currently localize
                      dates, numbers, or interface text.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={demoMode || updateCompanyMutation.isPending}
              >
                {updateCompanyMutation.isPending ? 'Saving...' : 'Save company'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-default bg-surface">
        <SectionHeader
          description="These controls are enforced for employee self clock actions and their resulting attendance status."
          icon={CalendarClock}
          title="Attendance"
        />
        <CardContent>
          <Form {...attendanceForm}>
            <form
              className="space-y-5"
              onSubmit={attendanceForm.handleSubmit((values) => {
                if (!demoMode) {
                  setPendingSave({ type: 'attendance', values })
                }
              })}
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
                        Clock-ins after this time plus the grace period are
                        late.
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
                        Disabling blocks new employee clock-ins but still lets
                        an active clock-in be closed.
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
                                ? field.value.filter(
                                    (value) => value !== day.value,
                                  )
                                : [...field.value, day.value].sort(
                                    (a, b) => a - b,
                                  )

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
                <Button
                  type="submit"
                  disabled={demoMode || updateAttendanceMutation.isPending}
                >
                  {updateAttendanceMutation.isPending
                    ? 'Saving...'
                    : 'Save attendance'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-default bg-surface">
        <SectionHeader
          description="Allowance controls affect leave balance approval. The policy note is stored admin metadata and is not published to employees."
          icon={FileText}
          title="Leave"
        />
        <CardContent>
          <Form {...leaveForm}>
            <form
              className="space-y-5"
              onSubmit={leaveForm.handleSubmit((values) => {
                if (!demoMode) {
                  setPendingSave({ type: 'leave', values })
                }
              })}
            >
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <FormField
                  control={leaveForm.control}
                  name="defaultAnnualAllowanceDays"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Default allowance days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="365"
                          step="0.5"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Used when an approved request's leave type has no annual
                        allowance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leaveForm.control}
                  name="allowNegativeBalance"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Negative balance</FormLabel>
                      <Select
                        value={field.value ? 'allowed' : 'blocked'}
                        onValueChange={(value) =>
                          field.onChange(value === 'allowed')
                        }
                      >
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
                      <FormDescription>
                        Controls whether approval may reduce the employee's
                        remaining leave below zero.
                      </FormDescription>
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
                    <FormLabel>Policy note (metadata)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Basic leave policy and review expectations"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Stored with leave settings for admins; it is not shown in
                      employee leave screens.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={demoMode || updateLeaveMutation.isPending}
                >
                  {updateLeaveMutation.isPending ? 'Saving...' : 'Save leave'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <SettingsSaveConfirmDialog
        isSubmitting={isConfirmingSave}
        pendingSave={pendingSave}
        onConfirm={handleConfirmSave}
        onOpenChange={(open) => {
          if (!open && !isConfirmingSave) {
            setPendingSave(null)
          }
        }}
      />
    </div>
  )
}
