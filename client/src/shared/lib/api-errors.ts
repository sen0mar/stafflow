import { ApiClientError } from './api-client'

const genericErrorMessage = 'Something went wrong. Please try again.'
const forbiddenMessage = 'You do not have permission to do that.'

const safeClientStatuses = new Set([400, 404, 409, 422, 429])

export const isApiStatus = (error: unknown, status: number) =>
  error instanceof ApiClientError && error.status === status

export const getSafeErrorMessage = (error: unknown, fallback = genericErrorMessage) => {
  if (!(error instanceof ApiClientError)) {
    return fallback
  }

  if (error.status === 403) {
    return forbiddenMessage
  }

  if (safeClientStatuses.has(error.status) && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}
