import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const assertDedicatedTestDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for seed smoke checks.");
  }

  const databaseName = new URL(databaseUrl).pathname.replace("/", "");

  if (!databaseName.toLowerCase().includes("test")) {
    throw new Error(
      `Refusing to run seed smoke check against non-test database "${databaseName}".`,
    );
  }
};

const main = async () => {
  assertDedicatedTestDatabase();
  await import("./seed");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
