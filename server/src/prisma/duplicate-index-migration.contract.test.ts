import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(process.cwd(), "..");
const schemaPath = resolve(repositoryRoot, "prisma/schema.prisma");
const migrationsPath = resolve(repositoryRoot, "prisma/migrations");
const migrationName = "20260716140000_remove_duplicate_indexes";
const migrationPath = resolve(migrationsPath, migrationName, "migration.sql");

const readModel = (schema: string, modelName: string) => {
  const match = schema.match(
    new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`),
  );

  expect(match, `${modelName} model must exist`).not.toBeNull();
  return match?.[1] ?? "";
};

describe("duplicate index migration contract", () => {
  const schema = readFileSync(schemaPath, "utf8");
  const migration = readFileSync(migrationPath, "utf8");

  it("retains the unique schema constraints without duplicate declarations", () => {
    const attendance = readModel(schema, "AttendanceRecord");
    const payslip = readModel(schema, "Payslip");

    expect(attendance).toContain("@@unique([employeeId, date])");
    expect(attendance).not.toContain("@@index([employeeId, date])");
    expect(payslip).toContain("@@unique([employeeId, year, month])");
    expect(payslip).not.toContain("@@index([employeeId, year, month])");
  });

  it("guards all four exact definitions before dropping only two indexes", () => {
    for (const indexName of [
      "AttendanceRecord_employeeId_date_idx",
      "AttendanceRecord_employeeId_date_key",
      "Payslip_employeeId_year_month_idx",
      "Payslip_employeeId_year_month_key",
    ]) {
      expect(migration).toContain(`index_relation.relname = '${indexName}'`);
    }

    expect(migration.match(/DROP INDEX /g)).toHaveLength(2);
    expect(migration).toContain(
      'DROP INDEX "AttendanceRecord_employeeId_date_idx";',
    );
    expect(migration).toContain(
      'DROP INDEX "Payslip_employeeId_year_month_idx";',
    );
    expect(migration).not.toMatch(/CREATE (?:UNIQUE )?INDEX/i);
    expect(migration).not.toMatch(/pg_trgm|gin_trgm|USING\s+(?:gin|gist)/i);
  });

  it("keeps later migration history free of speculative search indexes", () => {
    const migrationSql = readdirSync(migrationsPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name >= migrationName)
      .map(({ name }) =>
        readFileSync(resolve(migrationsPath, name, "migration.sql"), "utf8"),
      )
      .join("\n");

    expect(migrationSql).not.toMatch(/pg_trgm|gin_trgm|USING\s+(?:gin|gist)/i);
  });
});
