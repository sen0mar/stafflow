import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useCurrentUser = () =>
  useQuery({
    queryFn: getCurrentUser,
    queryKey: authKeys.currentUser(),
    retry: false,
  })
