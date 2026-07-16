import type { AuthContext } from "../../src/core/auth/auth.types";
import { AppError } from "../../src/core/errors/app-error";
import { getAttendanceDate } from "../../src/modules/attendance/attendance-time";
import {
  clockInSelf,
  clockOutSelf,
} from "../../src/modules/attendance/attendance.service";
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

const cleanDatabase = async () => {
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.invitationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.department.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.attendanceSettings.deleteMany();
  await prisma.leaveSettings.deleteMany();
};

const createFixture = async () => {
  const user = await prisma.user.create({
    data: {
      email: "attendance-concurrency.integration@example.com",
      passwordHash: "integration-test-hash",
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  });
  const employee = await prisma.employee.create({
    data: {
      employeeCode: "ATT-RACE-001",
      firstName: "Concurrency",
      lastName: "Employee",
      status: "ACTIVE",
      userId: user.id,
    },
  });

  await Promise.all([
    prisma.companySettings.create({
      data: { name: "Attendance Test", timezone: "UTC" },
    }),
    prisma.attendanceSettings.create({
      data: {
        allowEmployeeClockIn: true,
        lateGracePeriodMinutes: 0,
        weeklyWorkingDays: [0, 1, 2, 3, 4, 5, 6],
        workdayEnd: "23:59",
        workdayMinutes: 1,
        workdayStart: "00:00",
      },
    }),
  ]);

  const auth: AuthContext = {
    employeeId: employee.id,
    permissions: ["attendance:clock:self"],
    role: "EMPLOYEE",
    sessionId: "integration-session",
    user: {
      email: user.email,
      employee: {
        firstName: employee.firstName,
        id: employee.id,
        lastName: employee.lastName,
      },
      employeeId: employee.id,
      id: user.id,
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
    userId: user.id,
  };

  return { auth, employee };
};

const expectOneConflict = (
  results: PromiseSettledResult<unknown>[],
  code: string,
) => {
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  expect(fulfilled).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(rejected[0]?.reason).toBeInstanceOf(AppError);
  expect(rejected[0]?.reason).toMatchObject({ code, statusCode: 409 });
};

describeWithTestDatabase("attendance clock concurrency", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("commits exactly one simultaneous clock-in for the employee day", async () => {
    const { auth, employee } = await createFixture();

    const results = await Promise.allSettled([
      clockInSelf(auth),
      clockInSelf(auth),
    ]);

    expectOneConflict(results, "ATTENDANCE_ALREADY_RECORDED");
    await expect(
      prisma.attendanceRecord.count({ where: { employeeId: employee.id } }),
    ).resolves.toBe(1);
  });

  it("commits the first simultaneous clock-out time without overwrite", async () => {
    const { auth, employee } = await createFixture();
    const now = new Date();
    const attendance = await prisma.attendanceRecord.create({
      data: {
        clockInAt: new Date(now.getTime() - 10 * 60_000),
        date: getAttendanceDate(now, "UTC"),
        employeeId: employee.id,
        source: "SELF",
        status: "LATE",
      },
    });

    const results = await Promise.allSettled([
      clockOutSelf(auth),
      clockOutSelf(auth),
    ]);

    expectOneConflict(results, "ATTENDANCE_ALREADY_CLOCKED_OUT");
    const stored = await prisma.attendanceRecord.findUniqueOrThrow({
      where: { id: attendance.id },
    });
    const winner = results.find(
      (
        result,
      ): result is PromiseFulfilledResult<
        Awaited<ReturnType<typeof clockOutSelf>>
      > => result.status === "fulfilled",
    );

    expect(stored.clockOutAt?.toISOString()).toBe(winner?.value.clockOutAt);
    expect(stored.totalMinutes).toBe(winner?.value.totalMinutes);
  });
});
