import { randomBytes, timingSafeEqual } from "node:crypto";

import type {
  CookieOptions,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";
import { sessionTtlMs } from "./session.service";

export const csrfCookieName = "stafflow_csrf";
const csrfHeaderName = "x-csrf-token";
const csrfTokenBytes = 32;

// This cookie is readable by the frontend so it can echo the token in a header.
const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  maxAge: sessionTtlMs,
  path: "/",
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
};

const createCsrfToken = () => randomBytes(csrfTokenBytes).toString("base64url");

// Timing-safe comparison avoids leaking token-match information byte by byte.
const areTokensEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

// Rotate/refresh the CSRF token whenever auth state is established or confirmed.
export const setCsrfCookie = (response: Response) => {
  const token = createCsrfToken();

  response.cookie(csrfCookieName, token, csrfCookieOptions);

  return token;
};

// Remove the readable CSRF cookie along with the session during logout.
export const clearCsrfCookie = (response: Response) => {
  response.clearCookie(csrfCookieName, {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  });
};

// Double-submit CSRF: the browser sends the cookie automatically, while app code
// must copy the same value into the header for state-changing requests.
export const assertValidCsrfToken = (request: Request) => {
  const cookieToken = request.cookies?.[csrfCookieName];
  const headerToken = request.header(csrfHeaderName);

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    !areTokensEqual(cookieToken, headerToken)
  ) {
    throw new AppError({
      code: "CSRF_TOKEN_INVALID",
      message: "CSRF token is invalid.",
      statusCode: 403,
    });
  }
};

// Route middleware keeps CSRF enforcement close to route declarations.
export const requireCsrf: RequestHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  assertValidCsrfToken(request);
  next();
};
