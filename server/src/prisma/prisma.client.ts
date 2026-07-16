import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "../config/env";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Retained for the Section 24 readiness probe, which must verify database access.
export const checkDatabaseConnection = async () => {
  await prisma.$queryRaw`SELECT 1`;
};

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
