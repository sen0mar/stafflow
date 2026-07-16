import type { UseFormReturn } from 'react-hook-form'
import { Building2 } from 'lucide-react'
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
import type { CompanySettingsFormValues } from '../schemas/settings-form.schema'
import { SettingsSectionHeader } from './settings-section-header'

interface CompanySettingsFormProps {
  demoMode: boolean
  form: UseFormReturn<CompanySettingsFormValues>
  isPending: boolean
  onSave: (values: CompanySettingsFormValues) => void
  timezoneOptions: string[]
}

export const CompanySettingsForm = ({
  demoMode,
  form: companyForm,
  isPending,
  onSave,
  timezoneOptions,
}: CompanySettingsFormProps) => (
  <Card className="overflow-hidden border-default bg-surface">
    <SettingsSectionHeader
      description="Timezone drives company-day behavior. Name and locale are stored metadata, not global branding or localization controls."
      icon={Building2}
      title="Company"
    />
    <CardContent>
      <Form {...companyForm}>
        <form
          className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
          onSubmit={companyForm.handleSubmit(onSave)}
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
                  Stored for company records; this does not rename the Stafflow
                  interface.
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
                  Sets attendance calendar days, schedules, and dated employee
                  status changes.
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
                  Stored for future use; this does not currently localize dates,
                  numbers, or interface text.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={demoMode || isPending}>
            {isPending ? 'Saving...' : 'Save company'}
          </Button>
        </form>
      </Form>
    </CardContent>
  </Card>
)
