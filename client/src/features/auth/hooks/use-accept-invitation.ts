import { useMutation, useQueryClient } from '@tanstack/react-query'
import { acceptInvitation, type AcceptInvitationInput } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AcceptInvitationInput) => acceptInvitation(input),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.currentUser() })
    },
  })
}
