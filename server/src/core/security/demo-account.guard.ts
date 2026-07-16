import type { RequestHandler } from "express";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

export const assertDemoAccountMutationAllowed = () => {
  if (env.DEMO_MODE) {
    throw new AppError({
      code: "DEMO_READ_ONLY",
      message: "Account mutations are disabled in demo mode.",
      statusCode: 403,
    });
  }
};

export const requireDemoAccountMutationAllowed: RequestHandler = (
  _request,
  _response,
  next,
) => {
  assertDemoAccountMutationAllowed();
  next();
};
