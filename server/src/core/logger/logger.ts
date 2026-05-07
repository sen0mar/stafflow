import pino from "pino";

import { env } from "../../config/env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']",
      "req.headers['proxy-authorization']",
      "req.headers['x-api-key']",
      "req.headers['x-auth-token']",
      "req.headers['x-csrf-token']",
      "req.headers['x-forwarded-host']",
      "req.headers['cf-access-client-secret']",
      "res.headers['set-cookie']",
      "res.headers.authorization",
      "res.headers.cookie",
      "res.headers['proxy-authorization']",
      "res.headers['x-api-key']",
      "res.headers['x-auth-token']",
      "res.headers['x-csrf-token']",
      "res.headers['cf-access-client-secret']",
      "*.password",
      "*.passwordHash",
      "*.cookie",
      "*.cookies",
      "*.secret",
      "*.token",
      "*.tokenHash",
      "*.authorization",
    ],
    censor: "[redacted]",
  },
});
