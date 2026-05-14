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
import type { Department } from '@/features/departments/api/departments.api'
import type { Employee } from '../api/employees.api'
import {
  createEmployeeFormSchema,
  employeeFormSchema,
  type CreateEmployeeFormValues,
  type EmployeeFormValues,
} from '../schemas/employee-form.schema'

interface EmployeeFormProps {
  departments: Department[]
  employee?: Employee | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateEmployeeFormValues | EmployeeFormValues) => void
  open: boolean
}

const unassignedDepartmentValue = 'unassigned'

const getDateInputValue = (value?: string | null) =>
  value ? value.slice(0, 10) : ''

const getDefaultValues = (
  employee?: Employee | null,
): EmployeeFormValues | CreateEmployeeFormValues => ({
  departmentId: employee?.departmentId ?? unassignedDepartmentValue,
  email: employee?.account?.email ?? '',
  employeeCode: employee?.employeeCode ?? '',
  firstName: employee?.firstName ?? '',
  hireDate: getDateInputValue(employee?.hireDate),
  jobTitle: employee?.jobTitle ?? '',
  lastName: employee?.lastName ?? '',
  phone: employee?.phone ?? '',
})

export const EmployeeForm = ({
  departments,
  employee,
  isSubmitting,
  onOpenChange,
  onSubmit,
  open,
}: EmployeeFormProps) => {
  const isEditing = Boolean(employee)
  const form = useForm<CreateEmployeeFormValues | EmployeeFormValues>({
    defaultValues: getDefaultValues(employee),
    resolver: zodResolver(
      isEditing ? employeeFormSchema : createEmployeeFormSchema,
    ),
  })

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(employee))
    }
  }, [employee, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit employee' : 'Create employee'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update profile and assignment details.'
              : 'Create an employee profile and invited account.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="employeeCode"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Employee code</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        placeholder="EMP-001"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="email"
                        disabled={isEditing}
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value || unassignedDepartmentValue}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={unassignedDepartmentValue}>
                          Unassigned
                        </SelectItem>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Hire date</FormLabel>
                    <FormControl>
                      <Input type="date" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Job title</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="organization-title"
                        placeholder="Operations Associate"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Save changes'
                    : 'Create employee'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
