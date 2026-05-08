import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, type LoginInput } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user)
    },
  })
}
