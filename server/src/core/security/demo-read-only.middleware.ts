import type { RequestHandler } from "express";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

export const assertDemoMutationAllowed = () => {
  if (env.DEMO_MODE) {
    throw new AppError({
      code: "DEMO_READ_ONLY",
      message: "Changes are disabled in the public demo.",
      statusCode: 403,
    });
  }
};

export const requireDemoMutationAllowed: RequestHandler = (
  _request,
  _response,
  next,
) => {
  assertDemoMutationAllowed();
  next();
};
