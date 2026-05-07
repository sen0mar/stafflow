import type { ErrorRequestHandler } from "express";

import { env } from "../../config/env";
import { logger } from "../logger/logger";
import { HttpError } from "./http-error";

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.statusCode : 500;
  const message = isHttpError ? error.message : "Internal server error";
  const code = isHttpError ? error.code : "INTERNAL_SERVER_ERROR";
  const details =
    isHttpError || env.NODE_ENV !== "production" ? error.details : undefined;

  logger.error(
    {
      err: error,
      requestId: response.locals.requestId,
      statusCode,
    },
    "Request failed",
  );

  response.status(statusCode).json({
    error: {
      code,
      details,
      message,
    },
  });
};
