import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

const requestIdHeader = "x-request-id";
export const REQUEST_ID_MAX_CHARACTERS = 64;
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export const isTrustedRequestId = (
  value: string | undefined,
): value is string =>
  Boolean(
    value &&
    value.length <= REQUEST_ID_MAX_CHARACTERS &&
    REQUEST_ID_PATTERN.test(value),
  );

export const requestIdMiddleware: RequestHandler = (
  request,
  response,
  next,
) => {
  const incomingRequestId = request.header(requestIdHeader);
  const requestId = isTrustedRequestId(incomingRequestId)
    ? incomingRequestId
    : randomUUID();

  response.locals.requestId = requestId;
  response.setHeader(requestIdHeader, requestId);

  next();
};
