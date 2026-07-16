export const getInvitationSetupUrl = (token: string) =>
  `${window.location.origin}/accept-invitation#token=${encodeURIComponent(token)}`
