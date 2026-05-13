import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSafeErrorMessage } from '@/shared/lib/api-errors'
import {
  createEmployee,
  disableEmployee,
  getEmployee,
  getEmployees,
  getSelfEmployee,
  updateEmployee,
  updateEmployeeStatus,
  updateSelfProfile,
  type EmployeeListParams,
} from '../api/employees.api'
import { employeesKeys } from '../api/employees.keys'

export const useEmployees = (params: EmployeeListParams, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getEmployees(params),
    queryKey: employeesKeys.list(params),
  })

export const useEmployee = (id: string, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getEmployee(id),
    queryKey: employeesKeys.detail(id),
  })

export const useSelfEmployee = () =>
  useQuery({
    queryFn: getSelfEmployee,
    queryKey: employeesKeys.self(),
  })

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEmployee,
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Employee could not be created.'))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeesKeys.lists() })
      toast.success('Employee created.')
    },
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEmployee,
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Employee could not be updated.'))
    },
    onSuccess: async (employee) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeesKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: employeesKeys.detail(employee.id),
        }),
        queryClient.invalidateQueries({ queryKey: employeesKeys.self() }),
      ])
      toast.success('Employee updated.')
    },
  })
}

export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEmployeeStatus,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Employee status could not be updated.'),
      )
    },
    onSuccess: async (employee) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeesKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: employeesKeys.detail(employee.id),
        }),
      ])
      toast.success('Employee status updated.')
    },
  })
}

export const useDisableEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: disableEmployee,
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Employee could not be disabled.'))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeesKeys.lists() })
      toast.success('Employee disabled.')
    },
  })
}

export const useUpdateSelfProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSelfProfile,
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Profile could not be updated.'))
    },
    onSuccess: async (employee) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeesKeys.self() }),
        queryClient.invalidateQueries({
          queryKey: employeesKeys.detail(employee.id),
        }),
      ])
      toast.success('Profile updated.')
    },
  })
}
