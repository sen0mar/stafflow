import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logout } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.currentUser(), null)
    },
  })
}
