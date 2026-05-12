import pinoHttp from "pino-http";

import { env } from "../../config/env";
import { logger } from "./logger";

interface ResponseWithLocals {
  locals?: {
    requestId?: string;
  };
}

const getResponseRequestId = (response: unknown): string | undefined =>
  (response as ResponseWithLocals).locals?.requestId;

export const httpLogger = pinoHttp({
  autoLogging: env.NODE_ENV === "production",
  customProps: (_request, response) => ({
    requestId: getResponseRequestId(response),
  }),
  genReqId: (_request, response) => getResponseRequestId(response) ?? "",
  logger,
});
