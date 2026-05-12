import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
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
import type { Employee } from '@/features/employees/api/employees.api'
import {
  maxPayslipUploadBytes,
  payslipUploadSchema,
  type PayslipUploadValues,
} from '../schemas/payslip-upload.schema'

interface PayslipUploadDialogProps {
  employees: Employee[]
  isLoadingEmployees: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PayslipUploadValues) => void
  open: boolean
}

const currentYear = new Date().getFullYear()
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const defaultValues: Partial<PayslipUploadValues> = {
  employeeId: '',
  month: new Date().getMonth() + 1,
  year: currentYear,
}

export const PayslipUploadDialog = ({
  employees,
  isLoadingEmployees,
  isSubmitting,
  onOpenChange,
  onSubmit,
  open,
}: PayslipUploadDialogProps) => {
  const form = useForm<PayslipUploadValues>({
    defaultValues,
    resolver: zodResolver(payslipUploadSchema),
  })

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues)
    }
  }, [form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload payslip</DialogTitle>
          <DialogDescription>
            Add a private PDF payslip for an employee and payroll period.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select
                    disabled={isLoadingEmployees}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isLoadingEmployees ? 'Loading employees' : 'Select employee'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.fullName} · {employee.employeeCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={month} value={String(index + 1)}>
                            {month}
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        max={2100}
                        min={2000}
                        type="number"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, ref } }) => (
                <FormItem>
                  <FormLabel>PDF file</FormLabel>
                  <FormControl>
                    <Input
                      accept="application/pdf,.pdf"
                      ref={ref}
                      type="file"
                      onChange={(event) => onChange(event.target.files?.[0])}
                    />
                  </FormControl>
                  <p className="text-xs text-muted">
                    Maximum size: {Math.round(maxPayslipUploadBytes / 1024 / 1024)} MB.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Uploading...' : 'Upload payslip'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
