import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: "../.env.local", quiet: true });
dotenv.config({ quiet: true });
dotenv.config({ path: "../.env", quiet: true });

const booleanEnv = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  DEMO_MODE: booleanEnv.default(false),
  DEMO_UPLOADS_ENABLED: booleanEnv.default(false),
  PAYSLIP_MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(2_097_152),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
