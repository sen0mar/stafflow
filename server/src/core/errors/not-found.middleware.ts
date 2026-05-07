import type { RequestHandler } from "express";

import { AppError } from "./app-error";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError({
      code: "NOT_FOUND",
      message: `Route ${request.method} ${request.originalUrl} not found`,
      statusCode: 404,
    }),
  );
};
