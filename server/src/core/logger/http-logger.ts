import pinoHttp from "pino-http";
import type { Logger } from "pino";

import { env } from "../../config/env";
import { isExpectedAuthFailure } from "./expected-auth-failure";
import { logger } from "./logger";

interface ResponseWithLocals {
  locals?: {
    requestId?: string;
  };
}

const getResponseRequestId = (response: unknown): string | undefined =>
  (response as ResponseWithLocals).locals?.requestId;

interface AccessLogRequest {
  headers?: Record<string, unknown>;
  url?: string;
  [key: string]: unknown;
}

export const redactLegacyInvitationToken = (url: string): string => {
  const [path, query = ""] = url.split("?", 2);

  if (!query) {
    return path;
  }

  const searchParams = new URLSearchParams(query);
  const tokenKeys = [...searchParams.keys()].filter((key) =>
    /(auth|cookie|credential|key|password|secret|signature|token)/i.test(key),
  );

  if (tokenKeys.length === 0) {
    return url;
  }

  tokenKeys.forEach((key) => searchParams.set(key, "[redacted]"));

  return `${path}?${searchParams.toString()}`;
};

export const sanitizeAccessLogRequest = (
  request: AccessLogRequest,
): AccessLogRequest => {
  const headers = request.headers ? { ...request.headers } : undefined;

  if (headers) {
    delete headers.referer;
    delete headers.referrer;
  }

  return {
    ...request,
    ...(headers ? { headers } : {}),
    ...(request.url ? { url: redactLegacyInvitationToken(request.url) } : {}),
  };
};

export const createHttpLogger = (
  baseLogger: Logger = logger,
  enableAutoLogging = env.NODE_ENV === "production",
) =>
  pinoHttp({
    autoLogging: enableAutoLogging
      ? {
          ignore: (request) => isExpectedAuthFailure(request),
        }
      : false,
    customProps: (_request, response) => ({
      requestId: getResponseRequestId(response),
    }),
    customLogLevel: (_request, response, error) => {
      if (isExpectedAuthFailure(_request) || isExpectedAuthFailure(response)) {
        return "silent";
      }

      if (error || response.statusCode >= 500) {
        return "error";
      }

      return "info";
    },
    genReqId: (_request, response) => getResponseRequestId(response) ?? "",
    logger: baseLogger,
    serializers: {
      req: sanitizeAccessLogRequest,
    },
  });

export const httpLogger = createHttpLogger();
