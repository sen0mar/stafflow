import pinoHttp from "pino-http";

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
  const tokenKeys = [...searchParams.keys()].filter(
    (key) => key.toLowerCase() === "token",
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

export const httpLogger = pinoHttp({
  autoLogging:
    env.NODE_ENV === "production"
      ? {
          ignore: (request) => isExpectedAuthFailure(request),
        }
      : false,
  customProps: (_request, response) => ({
    requestId: getResponseRequestId(response),
  }),
  genReqId: (_request, response) => getResponseRequestId(response) ?? "",
  logger,
  serializers: {
    req: sanitizeAccessLogRequest,
  },
});
