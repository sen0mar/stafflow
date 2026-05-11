import cors from "cors";

import { env } from "./env";

const clientOrigin = new URL(env.CLIENT_URL).origin;

export const corsMiddleware = cors({
  credentials: true,
  origin: clientOrigin,
});
