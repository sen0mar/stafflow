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
import { Textarea } from '@/shared/components/ui/textarea'
import type { Department } from '../api/departments.api'
import {
  departmentFormSchema,
  type DepartmentFormValues,
} from '../schemas/department-form.schema'

interface DepartmentFormDialogProps {
  department?: Department | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: DepartmentFormValues) => void
  open: boolean
}

const getDefaultValues = (
  department?: Department | null,
): DepartmentFormValues => ({
  description: department?.description ?? '',
  isActive: department?.isActive ?? true,
  name: department?.name ?? '',
})

export const DepartmentFormDialog = ({
  department,
  isSubmitting,
  onOpenChange,
  onSubmit,
  open,
}: DepartmentFormDialogProps) => {
  const form = useForm<DepartmentFormValues>({
    defaultValues: getDefaultValues(department),
    resolver: zodResolver(departmentFormSchema),
  })
  const isEditing = Boolean(department)

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(department))
    }
  }, [department, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit department' : 'Create department'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update department details and availability.'
              : 'Add a department employees can be assigned to.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="People Operations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional department notes"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value ? 'active' : 'inactive'}
                    onValueChange={(value) =>
                      field.onChange(value === 'active')
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    : 'Create department'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
