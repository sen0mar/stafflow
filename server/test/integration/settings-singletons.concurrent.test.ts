import { AppError } from "../../src/core/errors/app-error";
import { SETTINGS_SINGLETON_IDS } from "../../src/modules/settings/settings.constants";
import {
  getAttendanceSettings,
  getCompanySettings,
  getLeaveSettings,
  updateAttendanceSettings,
  updateCompanySettings,
  updateLeaveSettings,
} from "../../src/modules/settings/settings.service";
import { prisma } from "../../src/prisma/prisma.client";

const getTestDatabaseName = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  return new URL(databaseUrl).pathname.replace("/", "");
};

const hasDedicatedTestDatabase = () =>
  getTestDatabaseName()?.toLowerCase().includes("test") ?? false;

const describeWithTestDatabase = hasDedicatedTestDatabase()
  ? describe
  : describe.skip;

const auditContext = { actorUserId: null };

const cleanSettings = async () => {
  await prisma.auditLog.deleteMany({
    where: {
      entityType: {
        in: ["CompanySettings", "AttendanceSettings", "LeaveSettings"],
      },
    },
  });
  await prisma.companySettings.deleteMany();
  await prisma.attendanceSettings.deleteMany();
  await prisma.leaveSettings.deleteMany();
};

describeWithTestDatabase("settings singleton concurrency", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    await cleanSettings();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates one deterministic record during concurrent first access", async () => {
    const [companies, attendance, leave] = await Promise.all([
      Promise.all(Array.from({ length: 8 }, () => getCompanySettings())),
      Promise.all(Array.from({ length: 8 }, () => getAttendanceSettings())),
      Promise.all(Array.from({ length: 8 }, () => getLeaveSettings())),
    ]);

    expect(new Set(companies.map(({ id }) => id))).toEqual(
      new Set([SETTINGS_SINGLETON_IDS.company]),
    );
    expect(new Set(attendance.map(({ id }) => id))).toEqual(
      new Set([SETTINGS_SINGLETON_IDS.attendance]),
    );
    expect(new Set(leave.map(({ id }) => id))).toEqual(
      new Set([SETTINGS_SINGLETON_IDS.leave]),
    );
    await expect(prisma.companySettings.count()).resolves.toBe(1);
    await expect(prisma.attendanceSettings.count()).resolves.toBe(1);
    await expect(prisma.leaveSettings.count()).resolves.toBe(1);
  });

  it("rejects every non-singleton settings ID at the database boundary", async () => {
    await Promise.all([
      getCompanySettings(),
      getAttendanceSettings(),
      getLeaveSettings(),
    ]);

    await expect(
      prisma.companySettings.create({
        data: { id: "other-company-settings", name: "Other" },
      }),
    ).rejects.toBeDefined();
    await expect(
      prisma.attendanceSettings.create({
        data: { id: "other-attendance-settings" },
      }),
    ).rejects.toBeDefined();
    await expect(
      prisma.leaveSettings.create({
        data: { id: "other-leave-settings" },
      }),
    ).rejects.toBeDefined();
    await expect(prisma.companySettings.count()).resolves.toBe(1);
    await expect(prisma.attendanceSettings.count()).resolves.toBe(1);
    await expect(prisma.leaveSettings.count()).resolves.toBe(1);
  });

  it("serializes concurrent partial updates without losing fields or adding rows", async () => {
    await Promise.all([
      updateCompanySettings({ name: "Concurrent Company" }, auditContext),
      updateCompanySettings({ locale: "fr-FR" }, auditContext),
      updateAttendanceSettings({ lateGracePeriodMinutes: 15 }, auditContext),
      updateAttendanceSettings({ workdayMinutes: 450 }, auditContext),
      updateLeaveSettings({ defaultAnnualAllowanceDays: 25 }, auditContext),
      updateLeaveSettings({ allowNegativeBalance: true }, auditContext),
    ]);

    await expect(getCompanySettings()).resolves.toMatchObject({
      id: SETTINGS_SINGLETON_IDS.company,
      locale: "fr-FR",
      name: "Concurrent Company",
    });
    await expect(getAttendanceSettings()).resolves.toMatchObject({
      id: SETTINGS_SINGLETON_IDS.attendance,
      lateGracePeriodMinutes: 15,
      workdayMinutes: 450,
    });
    await expect(getLeaveSettings()).resolves.toMatchObject({
      allowNegativeBalance: true,
      defaultAnnualAllowanceDays: 25,
      id: SETTINGS_SINGLETON_IDS.leave,
    });
    await expect(prisma.companySettings.count()).resolves.toBe(1);
    await expect(prisma.attendanceSettings.count()).resolves.toBe(1);
    await expect(prisma.leaveSettings.count()).resolves.toBe(1);
    await expect(
      prisma.auditLog.count({
        where: {
          entityType: {
            in: ["CompanySettings", "AttendanceSettings", "LeaveSettings"],
          },
        },
      }),
    ).resolves.toBe(6);
  });

  it("validates competing attendance schedule updates against the locked row", async () => {
    const results = await Promise.allSettled([
      updateAttendanceSettings({ workdayStart: "16:30" }, auditContext),
      updateAttendanceSettings({ workdayEnd: "09:30" }, auditContext),
    ]);
    const fulfilled = results.filter(({ status }) => status === "fulfilled");
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(AppError);
    expect(rejected[0]?.reason).toMatchObject({
      code: "SETTINGS_INVALID_WORKDAY_RANGE",
      statusCode: 422,
    });

    const settings = await getAttendanceSettings();
    const startMinutes =
      Number(settings.workdayStart.slice(0, 2)) * 60 +
      Number(settings.workdayStart.slice(3));
    const endMinutes =
      Number(settings.workdayEnd.slice(0, 2)) * 60 +
      Number(settings.workdayEnd.slice(3));

    expect(startMinutes).toBeLessThan(endMinutes);
    await expect(prisma.attendanceSettings.count()).resolves.toBe(1);
  });
});
