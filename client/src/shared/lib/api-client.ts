import { notifyUnauthorized } from './auth-events'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>
  skipUnauthorizedHandler?: boolean
}

type ApiErrorResponse = {
  error?: {
    message?: string
    code?: string
    details?: unknown
  }
}

const csrfCookieName = 'stafflow_csrf'
const csrfHeaderName = 'x-csrf-token'

const getApiBaseUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL

  if (configuredApiUrl) {
    return configuredApiUrl.replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000'
  }

  if (window.location.hostname.startsWith('app.')) {
    return `${window.location.protocol}//${window.location.hostname.replace(/^app\./, 'api.')}`
  }

  return window.location.origin
}

const apiBaseUrl = getApiBaseUrl()

let csrfToken: string | undefined

export const setApiCsrfToken = (token: string | undefined) => {
  csrfToken = token
}

export const clearApiCsrfToken = () => {
  csrfToken = undefined
}

export class ApiClientError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const isJsonBody = (body: RequestOptions['body']) =>
  body !== undefined &&
  body !== null &&
  typeof body === 'object' &&
  !(body instanceof FormData) &&
  !(body instanceof Blob) &&
  !(body instanceof URLSearchParams)

const getCookieValue = (name: string) => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${encodeURIComponent(name)}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : undefined
}

const getRequestUrl = (input: RequestInfo | URL) => {
  if (typeof input !== 'string') {
    return input
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input
  }

  return `${apiBaseUrl}${input.startsWith('/') ? input : `/${input}`}`
}

const shouldAttachCsrfToken = (method: string) =>
  !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())

export const apiClient = async <TResponse>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
): Promise<TResponse> => {
  const { body, headers, skipUnauthorizedHandler, ...init } = options
  const requestHeaders = new Headers(headers)
  const shouldSerializeJson = isJsonBody(body)
  const requestBody: BodyInit | undefined = shouldSerializeJson
    ? JSON.stringify(body)
    : (body as BodyInit | undefined)

  if (shouldSerializeJson && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const method = init.method ?? 'GET'
  const requestCsrfToken = shouldAttachCsrfToken(method)
    ? csrfToken ?? getCookieValue(csrfCookieName)
    : undefined

  if (requestCsrfToken && !requestHeaders.has(csrfHeaderName)) {
    requestHeaders.set(csrfHeaderName, requestCsrfToken)
  }

  const response = await fetch(getRequestUrl(input), {
    ...init,
    body: requestBody,
    credentials: 'include',
    headers: requestHeaders,
  })

  if (!response.ok) {
    let errorPayload: ApiErrorResponse | undefined

    try {
      errorPayload = (await response.json()) as ApiErrorResponse
    } catch {
      errorPayload = undefined
    }

    if (response.status === 401 && !skipUnauthorizedHandler) {
      clearApiCsrfToken()
      notifyUnauthorized()
    }

    throw new ApiClientError(
      errorPayload?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorPayload?.error?.code,
      errorPayload?.error?.details,
    )
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}
