import {
  redactLegacyInvitationToken,
  sanitizeAccessLogRequest,
} from "./http-logger";

describe("HTTP access-log secret redaction", () => {
  it("redacts legacy invitation tokens from logged request URLs", () => {
    const loggedUrl = redactLegacyInvitationToken(
      "/accept-invitation?source=email&token=legacy-secret&next=%2Fapp",
    );

    expect(loggedUrl).toBe(
      "/accept-invitation?source=email&token=%5Bredacted%5D&next=%2Fapp",
    );
    expect(loggedUrl).not.toContain("legacy-secret");
  });

  it("excludes referrer headers without mutating the request", () => {
    const request = {
      headers: {
        accept: "application/json",
        referer:
          "https://app.example.test/accept-invitation?token=legacy-secret",
      },
      method: "POST",
      url: "/auth/invitations/accept",
    };

    const sanitized = sanitizeAccessLogRequest(request);

    expect(sanitized).toEqual({
      headers: { accept: "application/json" },
      method: "POST",
      url: "/auth/invitations/accept",
    });
    expect(request.headers.referer).toContain("legacy-secret");
    expect(JSON.stringify(sanitized)).not.toContain("legacy-secret");
  });
});
