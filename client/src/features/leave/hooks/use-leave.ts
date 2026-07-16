import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dashboardKeys } from '@/features/dashboard/api/dashboard.keys'
import { getSafeErrorMessage } from '@/shared/lib/api-errors'
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  createLeaveType,
  deleteLeaveType,
  getLeaveRequest,
  getLeaveType,
  getLeaveRequests,
  getLeaveTypes,
  getSelfLeaveRequests,
  rejectLeaveRequest,
  updateLeaveType,
  type LeaveRequestListParams,
  type LeaveTypeListParams,
  type SelfLeaveRequestListParams,
} from '../api/leave.api'
import { leaveKeys } from '../api/leave.keys'

const invalidateLeaveViews = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: leaveKeys.all() }),
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.employeeSummary(),
    }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.adminSummary() }),
  ])
}

export const useLeaveTypes = (params: LeaveTypeListParams) =>
  useQuery({
    queryFn: () => getLeaveTypes(params),
    queryKey: leaveKeys.leaveTypeList(params),
  })

export const useLeaveType = (id: string, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getLeaveType(id),
    queryKey: leaveKeys.leaveTypeDetail(id),
  })

export const useSelfLeaveRequests = (params: SelfLeaveRequestListParams) =>
  useQuery({
    queryFn: () => getSelfLeaveRequests(params),
    queryKey: leaveKeys.selfRequestList(params),
  })

export const useLeaveRequests = (params: LeaveRequestListParams) =>
  useQuery({
    queryFn: () => getLeaveRequests(params),
    queryKey: leaveKeys.requestList(params),
  })

export const useLeaveRequest = (id: string, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getLeaveRequest(id),
    queryKey: leaveKeys.requestDetail(id),
  })

export const useCreateLeaveType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLeaveType,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Leave type could not be created.'),
      )
    },
    onSuccess: async () => {
      await invalidateLeaveViews(queryClient)
      toast.success('Leave type created.')
    },
  })
}

export const useUpdateLeaveType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateLeaveType,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Leave type could not be updated.'),
      )
    },
    onSuccess: async () => {
      await invalidateLeaveViews(queryClient)
      toast.success('Leave type updated.')
    },
  })
}

export const useDeleteLeaveType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteLeaveType,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Leave type could not be deleted.'),
      )
    },
    onSuccess: async () => {
      await invalidateLeaveViews(queryClient)
      toast.success('Leave type deleted.')
    },
  })
}

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLeaveRequest,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Leave request could not be submitted.'),
      )
    },
    onSuccess: async () => {
      await invalidateLeaveViews(queryClient)
      toast.success('Leave request submitted.')
    },
  })
}

export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelLeaveRequest,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Leave request could not be cancelled.'),
      )
    },
    onSuccess: async () => {
      await invalidateLeaveViews(queryClient)
      toast.success('Leave request cancelled.')
    },
  })
}

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveLeaveRequest,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Leave request could not be approved.'),
      )
    },
    onSuccess: async (leaveRequest) => {
      await Promise.all([
        invalidateLeaveViews(queryClient),
        queryClient.invalidateQueries({
          queryKey: leaveKeys.requestDetail(leaveRequest.id),
        }),
      ])
      toast.success('Leave request approved.')
    },
  })
}

export const useRejectLeaveRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectLeaveRequest,
    onError: (error) => {
      toast.error(
        getSafeErrorMessage(error, 'Leave request could not be rejected.'),
      )
    },
    onSuccess: async (leaveRequest) => {
      await Promise.all([
        invalidateLeaveViews(queryClient),
        queryClient.invalidateQueries({
          queryKey: leaveKeys.requestDetail(leaveRequest.id),
        }),
      ])
      toast.success('Leave request rejected.')
    },
  })
}
