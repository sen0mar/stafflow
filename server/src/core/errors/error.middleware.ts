import type { ErrorRequestHandler } from "express";

import { env } from "../../config/env";
import type { ApiError } from "../types/api-response";
import { logger } from "../logger/logger";
import { AppError } from "./app-error";

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const message = isAppError ? error.message : "Internal server error";
  const code = isAppError ? error.code : "INTERNAL_SERVER_ERROR";
  const details =
    isAppError || env.NODE_ENV !== "production" ? error.details : undefined;

  logger.error(
    {
      err: error,
      requestId: response.locals.requestId,
      statusCode,
    },
    "Request failed",
  );

  const responseBody: ApiError = {
    error: {
      code,
      details,
      message,
    },
  };

  response.status(statusCode).json(responseBody);
};
