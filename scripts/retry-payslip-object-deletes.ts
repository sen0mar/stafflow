import { randomUUID } from "node:crypto";

import { retrySoftDeletedPayslipObjectDeletes } from "../server/src/modules/payslips/payslips.service";
import { prisma } from "../server/src/prisma/prisma.client";

const requestId = randomUUID();

const run = async () => {
  const result = await retrySoftDeletedPayslipObjectDeletes(requestId);

  console.info(
    JSON.stringify({
      event: "payslip_object_delete_retry_completed",
      requestId,
      ...result,
    }),
  );

  if (result.failed > 0) {
    process.exitCode = 1;
  }
};

run()
  .catch(() => {
    console.error(
      JSON.stringify({
        event: "payslip_object_delete_retry_failed",
        requestId,
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
