import { Router } from "express";

import type { ApiSuccess } from "./core/types/api-response";
import { createAuthRoutes } from "./modules/auth/auth.routes";

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

  router.use("/auth", createAuthRoutes());

  return router;
};
