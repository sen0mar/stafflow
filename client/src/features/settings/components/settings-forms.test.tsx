import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { AttendanceSettingsForm } from './attendance-settings-form'
import { CompanySettingsForm } from './company-settings-form'
import { LeaveSettingsForm } from './leave-settings-form'
import { SettingsSaveConfirmDialog } from './settings-save-confirm-dialog'
import type {
  AttendanceSettingsFormValues,
  CompanySettingsFormValues,
  LeaveSettingsFormValues,
} from '../schemas/settings-form.schema'

const SettingsFormsHarness = ({
  onCompanySave,
}: {
  onCompanySave: (values: CompanySettingsFormValues) => void
}) => {
  const company = useForm<CompanySettingsFormValues>({
    defaultValues: { locale: 'en-US', name: 'Stafflow', timezone: 'UTC' },
  })
  const attendance = useForm<AttendanceSettingsFormValues>({
    defaultValues: {
      allowEmployeeClockIn: true,
      lateGracePeriodMinutes: 10,
      weeklyWorkingDays: [1, 2, 3, 4, 5],
      workdayEnd: '17:00',
      workdayMinutes: 480,
      workdayStart: '09:00',
    },
  })
  const leave = useForm<LeaveSettingsFormValues>({
    defaultValues: {
      allowNegativeBalance: false,
      defaultAnnualAllowanceDays: 20,
      policyText: '',
    },
  })

  return (
    <>
      <CompanySettingsForm
        demoMode={false}
        form={company}
        isPending={false}
        onSave={onCompanySave}
        timezoneOptions={['UTC']}
      />
      <AttendanceSettingsForm
        demoMode={false}
        form={attendance}
        isPending={false}
        onSave={vi.fn()}
      />
      <LeaveSettingsForm
        demoMode={false}
        form={leave}
        isPending={false}
        onSave={vi.fn()}
      />
    </>
  )
}

describe('settings forms and confirmation', () => {
  it('keeps the three independent form sections and company submission', async () => {
    const onCompanySave = vi.fn()
    render(<SettingsFormsHarness onCompanySave={onCompanySave} />)

    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Attendance')).toBeInTheDocument()
    expect(screen.getByText('Leave')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save company' }))
    expect(onCompanySave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Stafflow', timezone: 'UTC' }),
      expect.anything(),
    )
  })

  it('preserves save confirmation content and confirmation action', async () => {
    const onConfirm = vi.fn()
    render(
      <SettingsSaveConfirmDialog
        isSubmitting={false}
        pendingSave={{
          type: 'leave',
          values: {
            allowNegativeBalance: false,
            defaultAnnualAllowanceDays: 20,
            policyText: '',
          },
        }}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Save leave settings?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save leave' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
