import type { RequestHandler } from "express";

import { AppError } from "../errors/app-error";

// Browser forms can send URL-encoded bodies across origins without CORS.
// Public credential and token endpoints intentionally accept JSON only.
export const requireJson: RequestHandler = (request, _response, next) => {
  if (!request.is("application/json")) {
    next(
      new AppError({
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Content-Type must be application/json.",
        statusCode: 415,
      }),
    );
    return;
  }

  next();
};
