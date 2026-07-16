import {
  apiClient,
  clearApiCsrfToken,
  setApiCsrfToken,
} from '@/shared/lib/api-client'

export type AuthRole = 'ADMIN' | 'EMPLOYEE'
export type AuthStatus = 'ACTIVE' | 'DISABLED' | 'INVITED'

export interface AuthEmployee {
  id: string
  firstName: string
  lastName: string
}

export interface AuthUser {
  id: string
  email: string
  role: AuthRole
  status: AuthStatus
  employee: AuthEmployee | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface AcceptInvitationInput {
  password: string
  token: string
}

interface AuthResponse {
  data: {
    csrfToken?: string
    user: AuthUser
  }
}

interface LogoutResponse {
  data: {
    success: true
  }
}

interface AuthConfigResponse {
  data: {
    demoMode: boolean
  }
}

export const getAuthConfig = async () => {
  const response = await apiClient<AuthConfigResponse>('/auth/config', {
    skipUnauthorizedHandler: true,
  })

  return response.data
}

export const getCurrentUser = async () => {
  const response = await apiClient<AuthResponse>('/auth/me')
  setApiCsrfToken(response.data.csrfToken)

  return response.data.user
}

export const login = async (input: LoginInput) => {
  const response = await apiClient<AuthResponse>('/auth/login', {
    body: {
      email: input.email,
      password: input.password,
    },
    method: 'POST',
    skipUnauthorizedHandler: true,
  })
  setApiCsrfToken(response.data.csrfToken)

  return response.data.user
}

export const acceptInvitation = async (input: AcceptInvitationInput) => {
  const response = await apiClient<AuthResponse>('/auth/invitations/accept', {
    body: {
      password: input.password,
      token: input.token,
    },
    method: 'POST',
    skipUnauthorizedHandler: true,
  })
  clearApiCsrfToken()

  return response.data.user
}

export const logout = async () => {
  const response = await apiClient<LogoutResponse>('/auth/logout', {
    method: 'POST',
  })
  clearApiCsrfToken()

  return response.data
}
