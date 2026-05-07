import cors from "cors";

import { env } from "./env";

export const corsMiddleware = cors({
  credentials: true,
  origin: env.CORS_ORIGIN,
});
