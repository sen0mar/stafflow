import type { UseFormReturn } from 'react-hook-form'
import { FileText } from 'lucide-react'
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
import { Textarea } from '@/shared/components/ui/textarea'
import type { LeaveSettingsFormValues } from '../schemas/settings-form.schema'
import { SettingsSectionHeader } from './settings-section-header'

interface LeaveSettingsFormProps {
  demoMode: boolean
  form: UseFormReturn<LeaveSettingsFormValues>
  isPending: boolean
  onSave: (values: LeaveSettingsFormValues) => void
}

export const LeaveSettingsForm = ({
  demoMode,
  form: leaveForm,
  isPending,
  onSave,
}: LeaveSettingsFormProps) => (
  <Card className="overflow-hidden border-default bg-surface">
    <SettingsSectionHeader
      description="Allowance controls affect leave balance approval. The policy note is stored admin metadata and is not published to employees."
      icon={FileText}
      title="Leave"
    />
    <CardContent>
      <Form {...leaveForm}>
        <form className="space-y-5" onSubmit={leaveForm.handleSubmit(onSave)}>
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
            <Button type="submit" disabled={demoMode || isPending}>
              {isPending ? 'Saving...' : 'Save leave'}
            </Button>
          </div>
        </form>
      </Form>
    </CardContent>
  </Card>
)
