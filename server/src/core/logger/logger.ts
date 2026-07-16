import pino, { type DestinationStream } from "pino";

import { env } from "../../config/env";

export const technicalLogRedactionPaths = [
  "req.body.authorization",
  "req.body.confirmPassword",
  "req.body.cookie",
  "req.body.currentPassword",
  "req.body.file",
  "req.body.newPassword",
  "req.body.objectKey",
  "req.body.password",
  "req.body.passwordHash",
  "req.body.privateUrl",
  "req.body.secret",
  "req.body.signedUrl",
  "req.body.token",
  "req.body.tokenHash",
  "req.query.authorization",
  "req.query.cookie",
  "req.query.credential",
  "req.query.key",
  "req.query.password",
  "req.query.secret",
  "req.query.signature",
  "req.query.token",
  "req.file",
  "req.files",
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
  "*.authorization",
  "*.confirmPassword",
  "*.cookie",
  "*.cookies",
  "*.currentPassword",
  "*.file",
  "*.files",
  "*.newPassword",
  "*.objectKey",
  "*.password",
  "*.passwordHash",
  "*.privateUrl",
  "*.rawFile",
  "*.secret",
  "*.signedUrl",
  "*.token",
  "*.tokenHash",
];

const loggerOptions: pino.LoggerOptions = {
  level: env.NODE_ENV === "test" ? "silent" : "info",
  redact: {
    paths: technicalLogRedactionPaths,
    censor: "[redacted]",
  },
};

export const createLogger = (stream?: DestinationStream, level?: string) => {
  const options = level ? { ...loggerOptions, level } : loggerOptions;

  return stream ? pino(options, stream) : pino(options);
};

export const logger = createLogger();
