import { hashPassword } from "../server/src/core/auth/password.service";
import { prisma } from "./prisma-script-client";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const currentUtcDate = () => {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

const requireEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
};

const main = async () => {
  if (process.env.BOOTSTRAP_DEMO_AUTH !== "true") {
    throw new Error(
      "Refusing to bootstrap demo auth unless BOOTSTRAP_DEMO_AUTH=true.",
    );
  }

  const adminEmail = normalizeEmail(
    process.env.DEMO_ADMIN_EMAIL ?? "admin.demo@example.com",
  );
  const employeeEmail = normalizeEmail(
    process.env.DEMO_EMPLOYEE_EMAIL ?? "employee.demo@example.com",
  );
  const employeeCode = process.env.DEMO_EMPLOYEE_CODE ?? "EMP-DEMO-001";
  const demoPassword = requireEnv("DEMO_AUTH_PASSWORD");

  const existingUserCount = await prisma.user.count();

  if (
    existingUserCount > 0 &&
    process.env.ALLOW_BOOTSTRAP_ON_NON_EMPTY_DB !== "true"
  ) {
    throw new Error(
      [
        "The database already has users.",
        "Refusing to bootstrap into a non-empty User table.",
        "Set ALLOW_BOOTSTRAP_ON_NON_EMPTY_DB=true only if this is intentional.",
      ].join(" "),
    );
  }

  const passwordHash = await hashPassword(demoPassword);

  await prisma.$transaction(async (transaction) => {
    const adminUser = await transaction.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
      create: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    const employeeUser = await transaction.user.upsert({
      where: { email: employeeEmail },
      update: {
        passwordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
      create: {
        email: employeeEmail,
        passwordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    });

    const employee = await transaction.employee.upsert({
      where: { employeeCode },
      update: {
        firstName: "Demo",
        jobTitle: "Employee",
        lastName: "Employee",
        status: "ACTIVE",
        userId: employeeUser.id,
      },
      create: {
        employeeCode,
        firstName: "Demo",
        hireDate: currentUtcDate(),
        jobTitle: "Employee",
        lastName: "Employee",
        status: "ACTIVE",
        userId: employeeUser.id,
      },
    });

    await transaction.auditLog.create({
      data: {
        action: "DEMO_AUTH_BOOTSTRAPPED",
        actorUserId: adminUser.id,
        entityId: employeeUser.id,
        entityType: "User",
        metadata: {
          adminEmail,
          employeeCode: employee.employeeCode,
          employeeEmail,
        },
      },
    });
  });

  console.info(
    [
      "Demo auth bootstrap complete.",
      `Admin email: ${adminEmail}`,
      `Employee email: ${employeeEmail}`,
      "Password was provided through DEMO_AUTH_PASSWORD.",
    ].join("\n"),
  );
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
