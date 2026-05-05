import { Outlet } from 'react-router-dom'

export const ProtectedRoute = () => {
  // Future auth integration point: call `/auth/me` here and redirect unauthenticated users to `/login`.
  const shouldAllowRoute = true

  if (!shouldAllowRoute) {
    return null
  }

  return <Outlet />
}
