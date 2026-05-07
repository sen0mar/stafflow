import { Router } from "express";

export const createRoutes = (): Router => {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.status(200).json({ data: { status: "ok" } });
  });

  return router;
};
