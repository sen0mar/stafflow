import { audit } from "./demo/audit";
import { employees, fixturePrefix, payslipPeriods } from "./demo/fixtures";
import { samplePayslipPdf } from "./demo/sample-pdf";
import { seedBusinessData } from "./demo/seed-business-data";
import { SeedError } from "./demo/seed-error";
import { loadSeedTarget } from "./demo/target";

const main = async () => {
  const target = loadSeedTarget(process.argv.slice(2));
  console.info(
    JSON.stringify(
      {
        environment: target.environment,
        target: target.fingerprint,
        mode: target.apply ? "apply" : "preview",
        storage: target.dataOnly ? "data-only" : "private R2",
        plannedEmployees: employees.length,
        attendanceWindowDays: 56,
        leaveRequests: 60,
        payslips: target.dataOnly ? 0 : 36,
      },
      null,
      2,
    ),
  );
  if (!target.apply) {
    console.info(
      "Preview only; no database or storage connection. Apply with --apply --target=<fingerprint> and optionally --data-only.",
    );
    return;
  }
  const { prisma } = await import("./prisma-script-client.js");
  try {
    const now = new Date();
    const seeded = await seedBusinessData(prisma, now);
    if (!target.dataOnly) {
      const {
        createPayslipObjectKey,
        uploadPrivatePayslipPdf,
        deletePrivateObject,
      } = await import("../server/src/core/storage/r2.service.js");
      for (const employee of seeded.employees.slice(0, 12)) {
        for (const { year, month } of payslipPeriods(now)) {
          const where = {
            employeeId_year_month: { employeeId: employee.id, year, month },
          };
          if (await prisma.payslip.findUnique({ where })) continue;
          const body = samplePayslipPdf(
            `${employee.firstName} ${employee.lastName}`,
            employee.employeeCode,
            year,
            month,
          );
          const key = createPayslipObjectKey({
            employeeId: employee.id,
            year,
            month,
          });
          await uploadPrivatePayslipPdf({ body, key });
          try {
            await prisma.$transaction(async (tx) => {
              const payslip = await tx.payslip.create({
                data: {
                  employeeId: employee.id,
                  year,
                  month,
                  fileName: `demo-payslip-${year}-${String(month).padStart(2, "0")}.pdf`,
                  fileSize: body.length,
                  contentType: "application/pdf",
                  r2ObjectKey: key,
                  uploadedById: seeded.admin.id,
                },
              });
              await tx.auditLog.create({
                data: audit(
                  seeded.admin.id,
                  `payslip-${payslip.id}`,
                  "PAYSLIP_UPLOADED",
                  "Payslip",
                  payslip.id,
                  now,
                ),
              });
            });
          } catch {
            try {
              await deletePrivateObject(key);
            } catch {
              throw new SeedError(
                "Payslip persistence and new-object cleanup failed. Inspect the seed upload namespace in the configured bucket before retrying.",
              );
            }
            throw new SeedError(
              "Payslip persistence failed; newly uploaded object cleaned up. Safe to retry.",
            );
          }
        }
      }
    }
    const employeeIds = seeded.employees.map((employee) => employee.id);
    const [attendance, leaveRequests, balances, payslips, audits] =
      await Promise.all([
        prisma.attendanceRecord.count({
          where: { employeeId: { in: employeeIds } },
        }),
        prisma.leaveRequest.groupBy({
          by: ["status"],
          where: { employeeId: { in: employeeIds } },
          _count: true,
        }),
        prisma.leaveBalance.count({
          where: {
            employeeId: { in: employeeIds },
            year: now.getUTCFullYear(),
          },
        }),
        prisma.payslip.count({
          where: { employeeId: { in: employeeIds }, status: "ACTIVE" },
        }),
        prisma.auditLog.count({ where: { id: { startsWith: fixturePrefix } } }),
      ]);
    console.info(
      JSON.stringify(
        {
          result: "Demo seed complete",
          employees: employeeIds.length,
          attendance,
          leaveRequests,
          balances,
          payslips,
          audits,
          dataOnly: target.dataOnly,
        },
        null,
        2,
      ),
    );
    console.info(
      "Existing passwords preserved. Demo access instructions are in README.md. Production was not connected by a development run.",
    );
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  // Driver errors can contain connection details. Do not print raw exceptions.
  if (error instanceof SeedError) console.error(error.message);
  console.error(
    "Seed failed. No credentials logged. Check target/storage guards and database connectivity; business fixture transaction is atomic and reruns preserve existing rows.",
  );
  process.exitCode = 1;
});
