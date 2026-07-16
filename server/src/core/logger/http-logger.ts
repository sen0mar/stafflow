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
});
