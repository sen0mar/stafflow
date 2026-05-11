import { createHash, randomBytes } from "node:crypto";

import type { CookieOptions, Response } from "express";

import { env } from "../../config/env";

export const sessionCookieName = "stafflow_session";
export const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;

const tokenBytes = 32;

// Use a high-entropy opaque token; the database only stores its hash.
export const createSessionToken = () =>
  randomBytes(tokenBytes).toString("base64url");

// Hash session tokens so a database leak cannot be used as ready-made cookies.
export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const getSessionExpiresAt = () => new Date(Date.now() + sessionTtlMs);

// Session cookies are HTTP-only because JavaScript never needs the raw token.
export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  maxAge: sessionTtlMs,
  path: "/",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  secure: env.NODE_ENV === "production",
};

// Write the raw token only to the browser cookie; never include it in JSON.
export const setSessionCookie = (response: Response, token: string) => {
  response.cookie(sessionCookieName, token, sessionCookieOptions);
};

// Clearing must mirror the original cookie attributes so browsers remove it.
export const clearSessionCookie = (response: Response) => {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    path: "/",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
  });
};
