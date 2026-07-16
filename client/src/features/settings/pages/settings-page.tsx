import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  FormSkeleton,
  QueryStateError,
} from '@/shared/components/layout/page-state'
import { AttendanceSettingsForm } from '../components/attendance-settings-form'
import { CompanySettingsForm } from '../components/company-settings-form'
import { LeaveSettingsForm } from '../components/leave-settings-form'
import { SettingsSaveConfirmDialog } from '../components/settings-save-confirm-dialog'
import type { PendingSettingsSave } from '../components/settings-save.types'
import {
  commonTimezones,
  getAttendanceDefaults,
  getCompanyDefaults,
  getLeaveDefaults,
} from '../lib/settings-form-defaults'
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
        <h1 className="text-2xl font-semibold tracking-normal text-primary">
          Settings
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Manage operational attendance and leave defaults alongside clearly
          labeled company and policy metadata.
        </p>
      </div>

      <CompanySettingsForm
        demoMode={demoMode}
        form={companyForm}
        isPending={updateCompanyMutation.isPending}
        onSave={(values) => {
          if (!demoMode) setPendingSave({ type: 'company', values })
        }}
        timezoneOptions={timezoneOptions}
      />

      <AttendanceSettingsForm
        demoMode={demoMode}
        form={attendanceForm}
        isPending={updateAttendanceMutation.isPending}
        onSave={(values) => {
          if (!demoMode) setPendingSave({ type: 'attendance', values })
        }}
      />

      <LeaveSettingsForm
        demoMode={demoMode}
        form={leaveForm}
        isPending={updateLeaveMutation.isPending}
        onSave={(values) => {
          if (!demoMode) setPendingSave({ type: 'leave', values })
        }}
      />
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
