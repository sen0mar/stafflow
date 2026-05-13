import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

const requestIdHeader = "x-request-id";

export const requestIdMiddleware: RequestHandler = (
  request,
  response,
  next,
) => {
  const incomingRequestId = request.header(requestIdHeader);
  const requestId = incomingRequestId?.trim() || randomUUID();

  response.locals.requestId = requestId;
  response.setHeader(requestIdHeader, requestId);

  next();
};
