import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiClientError } from '@/shared/lib/api-client'
import {
  deletePayslip,
  getPayslipDownload,
  getPayslips,
  getSelfPayslips,
  uploadPayslip,
  type PayslipListParams,
  type SelfPayslipListParams,
} from '../api/payslips.api'
import { payslipsKeys } from '../api/payslips.keys'

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback

const invalidatePayslips = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: payslipsKeys.all() })
}

export const usePayslips = (params: PayslipListParams, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getPayslips(params),
    queryKey: payslipsKeys.list(params),
  })

export const useSelfPayslips = (params: SelfPayslipListParams, enabled = true) =>
  useQuery({
    enabled,
    queryFn: () => getSelfPayslips(params),
    queryKey: payslipsKeys.selfList(params),
  })

export const useUploadPayslip = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadPayslip,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Payslip could not be uploaded.'))
    },
    onSuccess: async () => {
      await invalidatePayslips(queryClient)
      toast.success('Payslip uploaded.')
    },
  })
}

export const useDeletePayslip = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePayslip,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Payslip could not be deleted.'))
    },
    onSuccess: async () => {
      await invalidatePayslips(queryClient)
      toast.success('Payslip deleted.')
    },
  })
}

export const useDownloadPayslip = () =>
  useMutation({
    mutationFn: getPayslipDownload,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Payslip download is unavailable.'))
    },
    onSuccess: (download) => {
      window.open(download.url, '_blank', 'noopener,noreferrer')
    },
  })

export const usePreviewPayslip = () =>
  useMutation({
    mutationFn: getPayslipDownload,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Payslip preview is unavailable.'))
    },
  })
