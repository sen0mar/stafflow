import { useQuery } from '@tanstack/react-query'
import { getAuthConfig } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useAuthConfig = () =>
  useQuery({
    queryFn: getAuthConfig,
    queryKey: authKeys.config(),
    staleTime: Number.POSITIVE_INFINITY,
  })

export const useDemoMode = () => useAuthConfig().data?.demoMode ?? false
