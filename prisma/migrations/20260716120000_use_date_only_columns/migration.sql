-- Date-only legacy values must be exact midnight timestamps. Abort before any
-- column is altered if a value contains a time component so deployment cannot
-- silently discard information that requires explicit review.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Employee"
    WHERE "hireDate" IS NOT NULL
      AND "hireDate" <> date_trunc('day', "hireDate")
  ) THEN
    RAISE EXCEPTION 'Unsafe Employee.hireDate values: expected midnight timestamps before conversion to date';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Employee"
    WHERE "terminationDate" IS NOT NULL
      AND "terminationDate" <> date_trunc('day', "terminationDate")
  ) THEN
    RAISE EXCEPTION 'Unsafe Employee.terminationDate values: expected midnight timestamps before conversion to date';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "AttendanceRecord"
    WHERE "date" <> date_trunc('day', "date")
  ) THEN
    RAISE EXCEPTION 'Unsafe AttendanceRecord.date values: expected midnight timestamps before conversion to date';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "LeaveRequest"
    WHERE "startDate" <> date_trunc('day', "startDate")
  ) THEN
    RAISE EXCEPTION 'Unsafe LeaveRequest.startDate values: expected midnight timestamps before conversion to date';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "LeaveRequest"
    WHERE "endDate" <> date_trunc('day', "endDate")
  ) THEN
    RAISE EXCEPTION 'Unsafe LeaveRequest.endDate values: expected midnight timestamps before conversion to date';
  END IF;
END $$;

ALTER TABLE "Employee"
  ALTER COLUMN "hireDate" TYPE DATE USING "hireDate"::date,
  ALTER COLUMN "terminationDate" TYPE DATE USING "terminationDate"::date;

ALTER TABLE "AttendanceRecord"
  ALTER COLUMN "date" TYPE DATE USING "date"::date;

ALTER TABLE "LeaveRequest"
  ALTER COLUMN "startDate" TYPE DATE USING "startDate"::date,
  ALTER COLUMN "endDate" TYPE DATE USING "endDate"::date;
