import { SETTINGS_SINGLETON_IDS } from "../server/src/modules/settings/settings.constants";
import { prisma } from "../prisma/prisma-script-client";

const requiredAcknowledgement = "read-only";

const main = async () => {
  if (
    process.env.SETTINGS_SINGLETON_PREFLIGHT_ACK !== requiredAcknowledgement
  ) {
    throw new Error(
      `Set SETTINGS_SINGLETON_PREFLIGHT_ACK=${requiredAcknowledgement} to confirm the configured DATABASE_URL is the intended database. This preflight performs read-only settings queries.`,
    );
  }

  const [companyRows, attendanceRows, leaveRows] = await Promise.all([
    prisma.companySettings.findMany({ select: { id: true } }),
    prisma.attendanceSettings.findMany({ select: { id: true } }),
    prisma.leaveSettings.findMany({ select: { id: true } }),
  ]);
  const results = [
    {
      expectedId: SETTINGS_SINGLETON_IDS.company,
      model: "CompanySettings",
      rows: companyRows,
    },
    {
      expectedId: SETTINGS_SINGLETON_IDS.attendance,
      model: "AttendanceSettings",
      rows: attendanceRows,
    },
    {
      expectedId: SETTINGS_SINGLETON_IDS.leave,
      model: "LeaveSettings",
      rows: leaveRows,
    },
  ];

  for (const result of results) {
    console.info(
      `${result.model}: count=${result.rows.length}, expectedId=${result.expectedId}, currentIds=${result.rows.map(({ id }) => id).join(",") || "<none>"}`,
    );
  }

  const duplicates = results.filter(({ rows }) => rows.length > 1);

  if (duplicates.length > 0) {
    throw new Error(
      `Settings singleton preflight failed for ${duplicates.map(({ model }) => model).join(", ")}. Stop deployment and request explicit cleanup approval; do not silently delete or merge rows.`,
    );
  }

  console.info(
    "Settings singleton preflight passed. The migration may create missing rows or re-key one existing row per table.",
  );
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Preflight failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
