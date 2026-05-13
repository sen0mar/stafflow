import { sessionCookieName } from "./session.service";
import {
  createSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
  sessionCookieOptions,
  sessionTtlMs,
} from "./session.service";

describe("session.service", () => {
  it("creates high-entropy opaque tokens and stores only stable hashes", () => {
    const token = createSessionToken();
    const anotherToken = createSessionToken();

    expect(token).not.toEqual(anotherToken);
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashSessionToken(token)).toHaveLength(64);
    expect(hashSessionToken(token)).toEqual(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toEqual(token);
  });

  it("uses http-only cookie options for sessions", () => {
    expect(sessionCookieName).toBe("stafflow_session");
    expect(sessionCookieOptions.httpOnly).toBe(true);
    expect(sessionCookieOptions.path).toBe("/");
    expect(sessionCookieOptions.maxAge).toBe(sessionTtlMs);
  });

  it("sets expiration near the configured session ttl", () => {
    const before = Date.now() + sessionTtlMs;
    const expiresAt = getSessionExpiresAt().getTime();
    const after = Date.now() + sessionTtlMs;

    expect(expiresAt).toBeGreaterThanOrEqual(before - 50);
    expect(expiresAt).toBeLessThanOrEqual(after + 50);
  });
});
