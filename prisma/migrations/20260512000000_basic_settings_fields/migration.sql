-- Add basic attendance and leave settings fields.
ALTER TABLE "AttendanceSettings"
ADD COLUMN "workdayStart" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN "workdayEnd" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN "weeklyWorkingDays" INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[];

ALTER TABLE "LeaveSettings"
ADD COLUMN "policyText" TEXT;
