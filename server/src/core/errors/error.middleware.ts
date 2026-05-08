import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../../config/env";
import type { ApiError } from "../types/api-response";
import { logger } from "../logger/logger";
import { AppError } from "./app-error";

// Return validation details that are useful for clients without echoing inputs.
const formatZodIssues = (error: ZodError) =>
  error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path,
  }));

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const isAppError = error instanceof AppError;
  const isZodError = error instanceof ZodError;
  const statusCode = isAppError ? error.statusCode : isZodError ? 422 : 500;
  const message = isAppError
    ? error.message
    : isZodError
      ? "Request validation failed."
      : "Internal server error";
  const code = isAppError
    ? error.code
    : isZodError
      ? "VALIDATION_ERROR"
      : "INTERNAL_SERVER_ERROR";
  const details = isZodError
    ? formatZodIssues(error)
    : isAppError || env.NODE_ENV !== "production"
      ? error.details
      : undefined;

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
