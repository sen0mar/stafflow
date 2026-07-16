interface InvitationLocation {
  hash: string
  pathname: string
  search: string
}

type ReplaceHistoryState = (
  data: unknown,
  unused: string,
  url?: string | URL | null,
) => void

const getToken = (params: URLSearchParams) => params.get('token')?.trim() ?? ''

export const captureAndScrubInvitationToken = (
  location: InvitationLocation,
  replaceState: ReplaceHistoryState = window.history.replaceState.bind(
    window.history,
  ),
) => {
  const fragmentParams = new URLSearchParams(location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(location.search)
  const hasFragmentToken = fragmentParams.has('token')
  const hasLegacyQueryToken = queryParams.has('token')
  const token = getToken(fragmentParams) || getToken(queryParams)

  if (hasFragmentToken || hasLegacyQueryToken) {
    queryParams.delete('token')
    const remainingQuery = queryParams.toString()
    const tokenFreePath = `${location.pathname}${remainingQuery ? `?${remainingQuery}` : ''}`

    replaceState(window.history.state, '', tokenFreePath)
  }

  return token
}
