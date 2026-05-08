import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;
const nodeEnv = process.env.NODE_ENV;
const shouldConfirm = process.argv.includes("--confirm");

const seedUserEmails = [
  "admin.demo@example.com",
  "employee.demo@example.com",
  "liam.marketing.demo@example.com",
  "sofia.hr.demo@example.com",
  "noah.finance.demo@example.com",
  "ava.operations.demo@example.com",
];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to reset added demo users.");
}

if (nodeEnv === "production") {
  throw new Error("Refusing to reset users while NODE_ENV=production.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

const main = async () => {
  const addedUsers = await prisma.user.findMany({
    where: {
      email: {
        notIn: seedUserEmails,
      },
    },
    select: {
      id: true,
      email: true,
      employee: {
        select: {
          id: true,
          employeeCode: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const addedUserIds = addedUsers.map((user) => user.id);
  const addedEmployeeIds = addedUsers
    .map((user) => user.employee?.id)
    .filter((employeeId): employeeId is string => Boolean(employeeId));

  console.info(
    [
      shouldConfirm ? "Resetting added development users." : "Dry run only.",
      `Seed users kept: ${seedUserEmails.length}`,
      `Added users found: ${addedUsers.length}`,
      `Linked added employee profiles found: ${addedEmployeeIds.length}`,
    ].join("\n"),
  );

  if (addedUsers.length > 0) {
    console.info(
      addedUsers.map((user) => `- ${user.email}`).join("\n"),
    );
  }

  if (!shouldConfirm) {
    console.info("Run `npm run db:reset-added-users -- --confirm` to delete these records.");
    return;
  }

  await prisma.$transaction(async (transaction) => {
    if (addedEmployeeIds.length > 0) {
      await transaction.employee.deleteMany({
        where: {
          id: {
            in: addedEmployeeIds,
          },
        },
      });
    }

    if (addedUserIds.length > 0) {
      await transaction.user.deleteMany({
        where: {
          id: {
            in: addedUserIds,
          },
        },
      });
    }
  });

  console.info("Added development users were deleted. Seed users were left untouched.");
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
