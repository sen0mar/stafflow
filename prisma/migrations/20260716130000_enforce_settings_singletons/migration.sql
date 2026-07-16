-- Abort before changing any settings table when legacy duplicates exist.
-- Duplicate cleanup requires explicit approval and is intentionally not automated.
BEGIN;

DO $$
DECLARE
  company_count BIGINT;
  attendance_count BIGINT;
  leave_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO company_count FROM "CompanySettings";
  SELECT COUNT(*) INTO attendance_count FROM "AttendanceSettings";
  SELECT COUNT(*) INTO leave_count FROM "LeaveSettings";

  IF company_count > 1 OR attendance_count > 1 OR leave_count > 1 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = format(
        'Settings singleton migration aborted: CompanySettings=%s, AttendanceSettings=%s, LeaveSettings=%s. Do not delete or merge rows without explicit cleanup approval.',
        company_count,
        attendance_count,
        leave_count
      );
  END IF;
END $$;

-- Re-key an existing singleton or create the deterministic default when absent.
UPDATE "CompanySettings"
SET "id" = 'company-settings'
WHERE "id" <> 'company-settings';

INSERT INTO "CompanySettings" ("id", "name", "timezone", "locale", "createdAt", "updatedAt")
SELECT 'company-settings', 'Stafflow', 'UTC', 'en-US', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "CompanySettings");

UPDATE "AttendanceSettings"
SET "id" = 'attendance-settings'
WHERE "id" <> 'attendance-settings';

INSERT INTO "AttendanceSettings" (
  "id",
  "workdayMinutes",
  "workdayStart",
  "workdayEnd",
  "weeklyWorkingDays",
  "lateGracePeriodMinutes",
  "allowEmployeeClockIn",
  "createdAt",
  "updatedAt"
)
SELECT
  'attendance-settings',
  480,
  '09:00',
  '17:00',
  ARRAY[1, 2, 3, 4, 5]::INTEGER[],
  0,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "AttendanceSettings");

UPDATE "LeaveSettings"
SET "id" = 'leave-settings'
WHERE "id" <> 'leave-settings';

INSERT INTO "LeaveSettings" (
  "id",
  "defaultAnnualAllowanceDays",
  "allowNegativeBalance",
  "policyText",
  "createdAt",
  "updatedAt"
)
SELECT
  'leave-settings',
  0,
  FALSE,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "LeaveSettings");

-- The primary keys cap each table at one row once only the stable ID is valid.
ALTER TABLE "CompanySettings"
ADD CONSTRAINT "CompanySettings_singleton_id_check"
CHECK ("id" = 'company-settings');

ALTER TABLE "AttendanceSettings"
ADD CONSTRAINT "AttendanceSettings_singleton_id_check"
CHECK ("id" = 'attendance-settings');

ALTER TABLE "LeaveSettings"
ADD CONSTRAINT "LeaveSettings_singleton_id_check"
CHECK ("id" = 'leave-settings');

COMMIT;
