import { defineConfig } from "prisma/config";

import { env } from "./server/src/config/env";

const migrationDatabaseUrl = env.DIRECT_URL ?? env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationDatabaseUrl,
  },
});
