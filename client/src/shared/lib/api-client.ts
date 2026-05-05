type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>
}

type ApiErrorResponse = {
  error?: {
    message?: string
    code?: string
    details?: unknown
  }
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

export const apiClient = async <TResponse>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
): Promise<TResponse> => {
  const { body, headers, ...init } = options
  const requestHeaders = new Headers(headers)
  const shouldSerializeJson = isJsonBody(body)
  const requestBody: BodyInit | undefined = shouldSerializeJson
    ? JSON.stringify(body)
    : (body as BodyInit | undefined)

  if (shouldSerializeJson && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(input, {
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
