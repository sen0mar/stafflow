import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import dotenv from "dotenv";

import { SeedError } from "./seed-error";

export const databaseIdentity = (value: string) => {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new SeedError("A PostgreSQL URL is required.");
  return `${url.hostname.replace(/-pooler(?=\.)/, "")}:${url.port || "5432"}${url.pathname}`;
};
export const targetFingerprint = (value: string) =>
  createHash("sha256")
    .update(databaseIdentity(value))
    .digest("hex")
    .slice(0, 12);

export const loadSeedTarget = (args: string[]) => {
  const value = (flag: string) =>
    args.find((arg) => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);
  const allowed =
    /^(--environment=(development|production)|--target=[a-f0-9]{12}|--apply|--data-only)$/;
  if (args.some((arg) => !allowed.test(arg)))
    throw new SeedError("Unknown seed option. See README seed instructions.");
  const environment = value("--environment") ?? "development";
  const path = environment === "development" ? ".env.local" : ".env.production";
  if (!existsSync(path))
    throw new SeedError(
      `Missing ${path}; seed requires an explicit environment file.`,
    );
  const config = dotenv.parse(readFileSync(path));
  if (!config.DATABASE_URL)
    throw new SeedError(`${path} must define DATABASE_URL.`);
  if (environment === "development" && config.NODE_ENV === "production")
    throw new SeedError("Development environment file declares production.");
  const production = existsSync(".env.production")
    ? dotenv.parse(readFileSync(".env.production"))
    : {};
  if (
    environment === "development" &&
    production.DATABASE_URL &&
    databaseIdentity(config.DATABASE_URL) ===
      databaseIdentity(production.DATABASE_URL)
  ) {
    throw new SeedError(
      "Development database matches the configured production target.",
    );
  }
  const apply = args.includes("--apply");
  const dataOnly = args.includes("--data-only");
  const fingerprint = targetFingerprint(config.DATABASE_URL);
  if (apply && value("--target") !== fingerprint)
    throw new SeedError(
      "Run preview first, then supply --apply --target=<preview fingerprint>.",
    );
  if (
    apply &&
    environment === "production" &&
    process.env.SEED_ALLOW_PRODUCTION !== "true"
  )
    throw new SeedError(
      "Production seed requires separate authorization and SEED_ALLOW_PRODUCTION=true.",
    );
  const r2Keys = [
    "R2_ACCOUNT_ID",
    "R2_BUCKET_NAME",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ];
  if (apply && !dataOnly && !r2Keys.every((key) => config[key]))
    throw new SeedError(
      "Configure private R2 storage or explicitly use --data-only.",
    );
  if (
    apply &&
    !dataOnly &&
    environment === "development" &&
    production.R2_ACCOUNT_ID === config.R2_ACCOUNT_ID &&
    production.R2_BUCKET_NAME === config.R2_BUCKET_NAME
  ) {
    throw new SeedError(
      "Development R2 bucket matches production. Use a separate bucket or --data-only.",
    );
  }
  // Isolate this command from inherited shell secrets and implicit dotenv fallback.
  for (const key of [
    ...r2Keys,
    "DATABASE_URL",
    "DIRECT_URL",
    "NODE_ENV",
    "CLIENT_URL",
    "DEMO_MODE",
    "DEMO_UPLOADS_ENABLED",
  ])
    delete process.env[key];
  Object.assign(process.env, config);
  process.env.NODE_ENV = environment;
  return { environment, apply, dataOnly, fingerprint, config };
};
