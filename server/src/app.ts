import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";

import { corsMiddleware } from "./config/cors";
import { env } from "./config/env";
import { globalErrorHandler } from "./core/errors/error.middleware";
import { notFoundHandler } from "./core/errors/not-found.middleware";
import { httpLogger } from "./core/logger/http-logger";
import { requestIdMiddleware } from "./core/middleware/request-id.middleware";
import { createRoutes } from "./routes";

export const createApp = (): Express => {
  const app = express();

  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(requestIdMiddleware);
  app.use(httpLogger);
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(createRoutes());
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
