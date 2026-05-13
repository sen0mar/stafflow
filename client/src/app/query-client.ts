import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authKeys } from '@/features/auth/api/auth.keys'
import { subscribeToUnauthorized } from '@/shared/lib/auth-events'

let isHandlingUnauthorized = false

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
})

subscribeToUnauthorized(() => {
  queryClient.setQueryData(authKeys.currentUser(), null)
  queryClient.cancelQueries()

  if (isHandlingUnauthorized || !window.location.pathname.startsWith('/app')) {
    return
  }

  isHandlingUnauthorized = true
  toast.error('Your session expired. Please sign in again.')
  window.location.assign(`/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`)
})
