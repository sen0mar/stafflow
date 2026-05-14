import { getInvitationSetupUrl } from './invitation-links'

describe('getInvitationSetupUrl', () => {
  it('builds an encoded invitation setup URL from the current origin', () => {
    expect(getInvitationSetupUrl('invite token+/=')).toBe(
      `${window.location.origin}/accept-invitation?token=invite%20token%2B%2F%3D`,
    )
  })
})
