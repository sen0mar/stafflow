import { SeedError } from "./demo/seed-error";
import { loadSeedTarget } from "./demo/target";
import { verifyDemoSeed } from "./demo/verify";

const main = async () => {
  if (process.argv.includes("--apply"))
    throw new SeedError("Seed check is read-only; --apply is not supported.");
  const target = loadSeedTarget(process.argv.slice(2));
  const { prisma } = await import("./prisma-script-client.js");
  try {
    console.info(
      JSON.stringify(
        {
          environment: target.environment,
          target: target.fingerprint,
          ...(await verifyDemoSeed(prisma)),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
};
main().catch((error: unknown) => {
  if (error instanceof SeedError) console.error(error.message);
  console.error(
    "Demo seed verification failed. No data was changed and no credentials logged.",
  );
  process.exitCode = 1;
});
