import {
  deleteRetainedAuthRecords,
  getAuthMaintenanceCutoff,
} from "../server/src/modules/auth/auth-maintenance.repository";
import { prisma } from "../server/src/prisma/prisma.client";

const run = async () => {
  const result = await deleteRetainedAuthRecords(getAuthMaintenanceCutoff());

  console.info(
    JSON.stringify({
      event: "auth_table_maintenance_completed",
      ...result,
      cutoff: result.cutoff.toISOString(),
    }),
  );
};

run()
  .catch(() => {
    console.error(JSON.stringify({ event: "auth_table_maintenance_failed" }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
