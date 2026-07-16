import { Prisma } from "@prisma/client";

import { prisma } from "../prisma/prisma-script-client";

type VerificationPhase = "after" | "before";

interface IndexDefinition {
  accessMethod: string;
  columns: string[];
  expression: string | null;
  indexName: string;
  isPrimary: boolean;
  isReady: boolean;
  isUnique: boolean;
  isValid: boolean;
  keyColumnCount: number;
  predicate: string | null;
  tableName: string;
  totalColumnCount: number;
}

interface ExpectedIndex {
  columns: string[];
  indexName: string;
  isUnique: boolean;
  tableName: string;
}

type ExplainRow = Record<string, unknown>;

const requiredAcknowledgement = "read-only";
const expectedIndexes: ExpectedIndex[] = [
  {
    columns: ["employeeId", "date"],
    indexName: "AttendanceRecord_employeeId_date_idx",
    isUnique: false,
    tableName: "AttendanceRecord",
  },
  {
    columns: ["employeeId", "date"],
    indexName: "AttendanceRecord_employeeId_date_key",
    isUnique: true,
    tableName: "AttendanceRecord",
  },
  {
    columns: ["employeeId", "year", "month"],
    indexName: "Payslip_employeeId_year_month_idx",
    isUnique: false,
    tableName: "Payslip",
  },
  {
    columns: ["employeeId", "year", "month"],
    indexName: "Payslip_employeeId_year_month_key",
    isUnique: true,
    tableName: "Payslip",
  },
];

const duplicateIndexNames = expectedIndexes
  .filter(({ isUnique }) => !isUnique)
  .map(({ indexName }) => indexName);

const uniqueIndexNames = expectedIndexes
  .filter(({ isUnique }) => isUnique)
  .map(({ indexName }) => indexName);

const parsePhase = (): VerificationPhase => {
  const phase = process.env.DUPLICATE_INDEX_VERIFY_PHASE;

  if (phase !== "before" && phase !== "after") {
    throw new Error(
      "Set DUPLICATE_INDEX_VERIFY_PHASE=before or DUPLICATE_INDEX_VERIFY_PHASE=after.",
    );
  }

  return phase;
};

const assertExactDefinition = (
  actual: IndexDefinition | undefined,
  expected: ExpectedIndex,
) => {
  if (!actual) {
    throw new Error(`Required index ${expected.indexName} is absent.`);
  }

  const matches =
    actual.accessMethod === "btree" &&
    actual.tableName === expected.tableName &&
    actual.isUnique === expected.isUnique &&
    !actual.isPrimary &&
    actual.isValid &&
    actual.isReady &&
    actual.keyColumnCount === expected.columns.length &&
    actual.totalColumnCount === expected.columns.length &&
    actual.predicate === null &&
    actual.expression === null &&
    actual.columns.length === expected.columns.length &&
    actual.columns.every(
      (column, columnIndex) => column === expected.columns[columnIndex],
    );

  if (!matches) {
    throw new Error(
      `Index ${expected.indexName} has an unexpected definition; stop deployment and inspect the catalog manually.`,
    );
  }
};

const collectIndexNames = (value: unknown, names = new Set<string>()) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectIndexNames(item, names);
    }
    return names;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "Index Name" && typeof child === "string") {
        names.add(child);
      }
      collectIndexNames(child, names);
    }
  }

  return names;
};

const explainValue = (rows: ExplainRow[]) => rows[0]?.["QUERY PLAN"];

const main = async () => {
  if (process.env.DUPLICATE_INDEX_VERIFY_ACK !== requiredAcknowledgement) {
    throw new Error(
      `Set DUPLICATE_INDEX_VERIFY_ACK=${requiredAcknowledgement} to confirm DATABASE_URL targets the intended database. This command is read-only.`,
    );
  }

  const phase = parsePhase();

  await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SET TRANSACTION READ ONLY`;

    const definitions = await transaction.$queryRaw<IndexDefinition[]>(
      Prisma.sql`
        SELECT
          index_relation.relname AS "indexName",
          table_relation.relname AS "tableName",
          access_method.amname AS "accessMethod",
          definition.indisunique AS "isUnique",
          definition.indisprimary AS "isPrimary",
          definition.indisvalid AS "isValid",
          definition.indisready AS "isReady",
          definition.indnkeyatts::integer AS "keyColumnCount",
          definition.indnatts::integer AS "totalColumnCount",
          pg_catalog.pg_get_expr(definition.indpred, definition.indrelid) AS predicate,
          pg_catalog.pg_get_expr(definition.indexprs, definition.indrelid) AS expression,
          ARRAY(
            SELECT attribute.attname::text
            FROM unnest(definition.indkey) WITH ORDINALITY AS key(attnum, ordinality)
            JOIN pg_catalog.pg_attribute AS attribute
              ON attribute.attrelid = table_relation.oid
              AND attribute.attnum = key.attnum
            ORDER BY key.ordinality
          ) AS columns
        FROM pg_catalog.pg_index AS definition
        JOIN pg_catalog.pg_class AS index_relation
          ON index_relation.oid = definition.indexrelid
        JOIN pg_catalog.pg_class AS table_relation
          ON table_relation.oid = definition.indrelid
        JOIN pg_catalog.pg_namespace AS namespace
          ON namespace.oid = table_relation.relnamespace
        JOIN pg_catalog.pg_am AS access_method
          ON access_method.oid = index_relation.relam
        WHERE namespace.nspname = current_schema()
          AND index_relation.relname IN (
            'AttendanceRecord_employeeId_date_idx',
            'AttendanceRecord_employeeId_date_key',
            'Payslip_employeeId_year_month_idx',
            'Payslip_employeeId_year_month_key'
          )
        ORDER BY index_relation.relname
      `,
    );
    const definitionsByName = new Map(
      definitions.map((definition) => [definition.indexName, definition]),
    );

    for (const expected of expectedIndexes.filter(
      ({ isUnique }) => phase === "before" || isUnique,
    )) {
      assertExactDefinition(
        definitionsByName.get(expected.indexName),
        expected,
      );
    }

    if (phase === "after") {
      for (const indexName of duplicateIndexNames) {
        if (definitionsByName.has(indexName)) {
          throw new Error(
            `Redundant non-unique index ${indexName} still exists after deployment.`,
          );
        }
      }
    }

    console.info(`Exact index catalog verification passed for phase=${phase}.`);

    const attendancePlan = await transaction.$queryRaw<ExplainRow[]>(
      Prisma.sql`
        EXPLAIN (FORMAT JSON, COSTS FALSE)
        SELECT "id"
        FROM "AttendanceRecord"
        WHERE "employeeId" = ${"duplicate-index-plan-probe"}
          AND "date" = DATE '2000-01-01'
      `,
    );
    const payslipPlan = await transaction.$queryRaw<ExplainRow[]>(
      Prisma.sql`
        EXPLAIN (FORMAT JSON, COSTS FALSE)
        SELECT "id"
        FROM "Payslip"
        WHERE "employeeId" = ${"duplicate-index-plan-probe"}
          AND "year" = 2000
          AND "month" = 1
      `,
    );

    console.info(
      `AttendanceRecord normal plan:\n${JSON.stringify(explainValue(attendancePlan), null, 2)}`,
    );
    console.info(
      `Payslip normal plan:\n${JSON.stringify(explainValue(payslipPlan), null, 2)}`,
    );

    if (phase === "after") {
      await transaction.$executeRaw`SET LOCAL enable_seqscan = off`;
      const forcedAttendancePlan = await transaction.$queryRaw<ExplainRow[]>(
        Prisma.sql`
          EXPLAIN (FORMAT JSON, COSTS FALSE)
          SELECT "id"
          FROM "AttendanceRecord"
          WHERE "employeeId" = ${"duplicate-index-plan-probe"}
            AND "date" = DATE '2000-01-01'
        `,
      );
      const forcedPayslipPlan = await transaction.$queryRaw<ExplainRow[]>(
        Prisma.sql`
          EXPLAIN (FORMAT JSON, COSTS FALSE)
          SELECT "id"
          FROM "Payslip"
          WHERE "employeeId" = ${"duplicate-index-plan-probe"}
            AND "year" = 2000
            AND "month" = 1
        `,
      );
      const attendanceIndexes = collectIndexNames(
        explainValue(forcedAttendancePlan),
      );
      const payslipIndexes = collectIndexNames(explainValue(forcedPayslipPlan));

      if (!attendanceIndexes.has(uniqueIndexNames[0] ?? "")) {
        throw new Error(
          "The retained AttendanceRecord unique index did not serve the forced exact-key lookup plan.",
        );
      }
      if (!payslipIndexes.has(uniqueIndexNames[1] ?? "")) {
        throw new Error(
          "The retained Payslip unique index did not serve the forced exact-key lookup plan.",
        );
      }

      console.info(
        "Retained unique indexes can serve both exact-key lookup plans.",
      );
    }
  });
};

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Index verification failed.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
