import { getInvitationSetupUrl } from './invitation-links'

describe('getInvitationSetupUrl', () => {
  it('keeps the encoded invitation token in the URL fragment', () => {
    expect(getInvitationSetupUrl('invite token+/=')).toBe(
      `${window.location.origin}/accept-invitation#token=invite%20token%2B%2F%3D`,
    )
  })
})
