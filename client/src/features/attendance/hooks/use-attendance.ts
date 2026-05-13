import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dashboardKeys } from '@/features/dashboard/api/dashboard.keys'
import { getSafeErrorMessage } from '@/shared/lib/api-errors'
import {
  clockIn,
  clockOut,
  getAttendanceRecord,
  getAttendanceRecords,
  getSelfAttendanceHistory,
  getSelfTodayAttendance,
  updateAttendanceRecord,
  type AttendanceListParams,
  type SelfAttendanceListParams,
} from '../api/attendance.api'
import { attendanceKeys } from '../api/attendance.keys'

const invalidateAttendanceViews = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: attendanceKeys.all() }),
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.employeeSummary(),
    }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.adminSummary() }),
  ])
}

export const useSelfTodayAttendance = () =>
  useQuery({
    queryFn: getSelfTodayAttendance,
    queryKey: attendanceKeys.selfToday(),
  })

export const useSelfAttendanceHistory = (params: SelfAttendanceListParams) =>
  useQuery({
    queryFn: () => getSelfAttendanceHistory(params),
    queryKey: attendanceKeys.selfHistory(params),
  })

export const useAttendanceRecords = (
  params: AttendanceListParams,
  enabled = true,
) =>
  useQuery({
    enabled,
    queryFn: () => getAttendanceRecords(params),
    queryKey: attendanceKeys.list(params),
  })

export const useAttendanceRecord = (id: string, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getAttendanceRecord(id),
    queryKey: attendanceKeys.detail(id),
  })

export const useClockIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clockIn,
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Clock-in could not be recorded.'))
    },
    onSuccess: async () => {
      await invalidateAttendanceViews(queryClient)
      toast.success('Clocked in.')
    },
  })
}

export const useClockOut = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clockOut,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Clock-out could not be recorded.'),
      )
    },
    onSuccess: async () => {
      await invalidateAttendanceViews(queryClient)
      toast.success('Clocked out.')
    },
  })
}

export const useUpdateAttendanceRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAttendanceRecord,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Attendance record could not be updated.'),
      )
    },
    onSuccess: async (record) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.detail(record.id),
        }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.self() }),
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.employeeSummary(),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.adminSummary(),
        }),
      ])
      toast.success('Attendance corrected.')
    },
  })
}
