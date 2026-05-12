import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiClientError } from '@/shared/lib/api-client'
import {
  getAttendanceSettings,
  getCompanySettings,
  getLeaveSettings,
  updateAttendanceSettings,
  updateCompanySettings,
  updateLeaveSettings,
} from '../api/settings.api'
import { settingsKeys } from '../api/settings.keys'

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback

export const useCompanySettings = () =>
  useQuery({
    queryFn: getCompanySettings,
    queryKey: settingsKeys.company(),
  })

export const useAttendanceSettings = () =>
  useQuery({
    queryFn: getAttendanceSettings,
    queryKey: settingsKeys.attendance(),
  })

export const useLeaveSettings = () =>
  useQuery({
    queryFn: getLeaveSettings,
    queryKey: settingsKeys.leave(),
  })

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCompanySettings,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Company settings could not be saved.'))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.company() })
      toast.success('Company settings saved.')
    },
  })
}

export const useUpdateAttendanceSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAttendanceSettings,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Attendance settings could not be saved.'))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.attendance() })
      toast.success('Attendance settings saved.')
    },
  })
}

export const useUpdateLeaveSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateLeaveSettings,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Leave settings could not be saved.'))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.leave() })
      toast.success('Leave settings saved.')
    },
  })
}
