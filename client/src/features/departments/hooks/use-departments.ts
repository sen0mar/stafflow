import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiClientError } from '@/shared/lib/api-client'
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  getDepartments,
  updateDepartment,
  type DepartmentListParams,
} from '../api/departments.api'
import { departmentsKeys } from '../api/departments.keys'

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback

export const useDepartments = (params: DepartmentListParams) =>
  useQuery({
    queryFn: () => getDepartments(params),
    queryKey: departmentsKeys.list(params),
  })

export const useDepartment = (id: string, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getDepartment(id),
    queryKey: departmentsKeys.detail(id),
  })

export const useCreateDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDepartment,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Department could not be created.'))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() })
      toast.success('Department created.')
    },
  })
}

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDepartment,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Department could not be updated.'))
    },
    onSuccess: async (department) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(department.id) }),
      ])
      toast.success('Department updated.')
    },
  })
}

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDepartment,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Department could not be deleted.'))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() })
      toast.success('Department deleted.')
    },
  })
}
