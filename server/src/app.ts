import express, { type Express } from "express";

import { corsMiddleware } from "./config/cors";

export const createApp = (): Express => {
  const app = express();

  app.use(corsMiddleware);
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ data: { status: "ok" } });
  });

  return app;
};
