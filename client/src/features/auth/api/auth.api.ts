import { apiClient, clearApiCsrfToken, setApiCsrfToken } from '@/shared/lib/api-client'

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
  })
  setApiCsrfToken(response.data.csrfToken)

  return response.data.user
}

export const logout = async () => {
  const response = await apiClient<LogoutResponse>('/auth/logout', {
    method: 'POST',
  })
  clearApiCsrfToken()

  return response.data
}
