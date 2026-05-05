type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>
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
    throw new Error(`Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}
