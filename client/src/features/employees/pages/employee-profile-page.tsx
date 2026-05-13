import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useEffect } from 'react'
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
import { Skeleton } from '@/shared/components/ui/skeleton'
import { PageHeader } from '@/shared/components/layout/page-header'
import { EmployeeProfileCard } from '../components/employee-profile-card'
import { useSelfEmployee, useUpdateSelfProfile } from '../hooks/use-employees'
import {
  selfProfileFormSchema,
  type SelfProfileFormValues,
} from '../schemas/employee-form.schema'

export const EmployeeProfilePage = () => {
  const selfEmployeeQuery = useSelfEmployee()
  const updateProfile = useUpdateSelfProfile()
  const employee = selfEmployeeQuery.data
  const form = useForm<SelfProfileFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
    resolver: zodResolver(selfProfileFormSchema),
  })

  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone ?? '',
      })
    }
  }, [employee, form])

  const handleSubmit = (values: SelfProfileFormValues) => {
    updateProfile.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone?.trim() ? values.phone.trim() : null,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Self service"
        title="Profile"
        description="View your employee profile and update allowed personal details."
      />

      {selfEmployeeQuery.isLoading ? (
        <div className="space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {selfEmployeeQuery.isError ? (
        <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
          Your profile could not be loaded.
        </div>
      ) : null}

      {employee ? (
        <>
          <EmployeeProfileCard employee={employee} />
          <section className="rounded-2xl border border-default bg-surface p-4 shadow-soft">
            <h2 className="font-semibold text-primary">Editable profile</h2>
            <Form {...form}>
              <form
                className="mt-4 grid gap-4 md:grid-cols-2"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    {updateProfile.isPending ? 'Saving...' : 'Save profile'}
                  </Button>
                </div>
              </form>
            </Form>
          </section>
        </>
      ) : null}
    </div>
  )
}
