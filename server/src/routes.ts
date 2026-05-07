import { Router } from "express";

import type { ApiSuccess } from "./core/types/api-response";

interface HealthResponse {
  status: "ok";
}

export const createRoutes = (): Router => {
  const router = Router();

  router.get("/health", (_request, response) => {
    const responseBody: ApiSuccess<HealthResponse> = {
      data: { status: "ok" },
    };

    response.status(200).json(responseBody);
  });

  return router;
};
