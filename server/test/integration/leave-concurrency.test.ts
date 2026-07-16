import {
  approveLeaveRequestWithBalance,
  cancelLeaveRequestAtomically,
  createLeaveRequestAtomically,
  LeaveMutationError,
  rejectLeaveRequestAtomically,
} from "../../src/modules/leave/leave.repository";
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

const createLeaveFixture = async () => {
  const [admin, employeeUser, leaveType] = await Promise.all([
    prisma.user.create({
      data: {
        email: "leave-admin.integration@example.com",
        passwordHash: "integration-test-hash",
        role: "ADMIN",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        email: "leave-employee.integration@example.com",
        passwordHash: "integration-test-hash",
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    }),
    prisma.leaveType.create({
      data: {
        annualAllowance: 20,
        isActive: true,
        name: "Concurrency Leave",
      },
    }),
  ]);
  const employee = await prisma.employee.create({
    data: {
      employeeCode: "LEAVE-RACE-001",
      firstName: "Concurrency",
      lastName: "Employee",
      status: "ACTIVE",
      userId: employeeUser.id,
    },
  });

  await prisma.leaveSettings.create({
    data: {
      allowNegativeBalance: false,
      defaultAnnualAllowanceDays: 20,
    },
  });

  return { admin, employee, leaveType };
};

const createPendingRequest = ({
  employeeId,
  endDate,
  leaveTypeId,
  startDate,
  totalDays,
}: {
  employeeId: string;
  endDate: string;
  leaveTypeId: string;
  startDate: string;
  totalDays: number;
}) =>
  prisma.leaveRequest.create({
    data: {
      employeeId,
      endDate: new Date(endDate),
      leaveTypeId,
      startDate: new Date(startDate),
      totalDays,
    },
  });

const expectOneWinner = (results: PromiseSettledResult<unknown>[]) => {
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  expect(fulfilled).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(rejected[0]?.reason).toBeInstanceOf(LeaveMutationError);

  return rejected[0]?.reason as LeaveMutationError;
};

describeWithTestDatabase("leave mutation concurrency", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("commits only one of two simultaneous overlapping requests", async () => {
    const { employee, leaveType } = await createLeaveFixture();
    const inputs = [
      {
        endDate: new Date("2026-08-12T00:00:00.000Z"),
        input: {
          endDate: "2026-08-12",
          leaveTypeId: leaveType.id,
          reason: "First request",
          startDate: "2026-08-10",
        },
        startDate: new Date("2026-08-10T00:00:00.000Z"),
        totalDays: 3,
      },
      {
        endDate: new Date("2026-08-13T00:00:00.000Z"),
        input: {
          endDate: "2026-08-13",
          leaveTypeId: leaveType.id,
          reason: "Second request",
          startDate: "2026-08-11",
        },
        startDate: new Date("2026-08-11T00:00:00.000Z"),
        totalDays: 3,
      },
    ];

    const results = await Promise.allSettled(
      inputs.map((input) =>
        createLeaveRequestAtomically({ employeeId: employee.id, ...input }),
      ),
    );
    const rejection = expectOneWinner(results);

    expect(rejection.reason).toBe("LEAVE_REQUEST_OVERLAP");
    await expect(
      prisma.leaveRequest.count({ where: { employeeId: employee.id } }),
    ).resolves.toBe(1);
  });

  it("preserves both deductions for simultaneous approvals sharing one balance", async () => {
    const { admin, employee, leaveType } = await createLeaveFixture();
    const requests = await Promise.all([
      createPendingRequest({
        employeeId: employee.id,
        endDate: "2026-09-03T00:00:00.000Z",
        leaveTypeId: leaveType.id,
        startDate: "2026-09-01T00:00:00.000Z",
        totalDays: 3,
      }),
      createPendingRequest({
        employeeId: employee.id,
        endDate: "2026-09-14T00:00:00.000Z",
        leaveTypeId: leaveType.id,
        startDate: "2026-09-11T00:00:00.000Z",
        totalDays: 4,
      }),
    ]);

    await prisma.leaveBalance.create({
      data: {
        allocated: 20,
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        remaining: 20,
        used: 0,
        year: 2026,
      },
    });

    const results = await Promise.allSettled(
      requests.map((request) =>
        approveLeaveRequestWithBalance({
          actorUserId: admin.id,
          entityId: request.id,
          reviewNote: "Approved concurrently",
        }),
      ),
    );

    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    const balance = await prisma.leaveBalance.findUniqueOrThrow({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: 2026,
        },
      },
    });

    expect(balance.used.toString()).toBe("7");
    expect(balance.remaining.toString()).toBe("13");
    await expect(
      prisma.leaveRequest.count({
        where: { id: { in: requests.map(({ id }) => id) }, status: "APPROVED" },
      }),
    ).resolves.toBe(2);
    await expect(
      prisma.auditLog.count({ where: { action: "LEAVE_REQUEST_APPROVED" } }),
    ).resolves.toBe(2);
  });

  it("applies a repeated approval click exactly once", async () => {
    const { admin, employee, leaveType } = await createLeaveFixture();
    const request = await createPendingRequest({
      employeeId: employee.id,
      endDate: "2026-10-02T00:00:00.000Z",
      leaveTypeId: leaveType.id,
      startDate: "2026-10-01T00:00:00.000Z",
      totalDays: 2,
    });

    const results = await Promise.allSettled([
      approveLeaveRequestWithBalance({
        actorUserId: admin.id,
        entityId: request.id,
        reviewNote: "First click",
      }),
      approveLeaveRequestWithBalance({
        actorUserId: admin.id,
        entityId: request.id,
        reviewNote: "Second click",
      }),
    ]);
    const rejection = expectOneWinner(results);

    expect([
      "LEAVE_REQUEST_NOT_APPROVABLE",
      "LEAVE_REQUEST_STALE_TRANSITION",
    ]).toContain(rejection.reason);
    const balance = await prisma.leaveBalance.findUniqueOrThrow({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: 2026,
        },
      },
    });

    expect(balance.used.toString()).toBe("2");
    expect(balance.remaining.toString()).toBe("18");
    await expect(
      prisma.auditLog.count({
        where: { action: "LEAVE_REQUEST_APPROVED", entityId: request.id },
      }),
    ).resolves.toBe(1);
  });

  it("makes cancellation and approval mutually exclusive with consistent balance", async () => {
    const { admin, employee, leaveType } = await createLeaveFixture();
    const request = await createPendingRequest({
      employeeId: employee.id,
      endDate: "2026-11-03T00:00:00.000Z",
      leaveTypeId: leaveType.id,
      startDate: "2026-11-01T00:00:00.000Z",
      totalDays: 3,
    });
    const results = await Promise.allSettled([
      cancelLeaveRequestAtomically({ employeeId: employee.id, id: request.id }),
      approveLeaveRequestWithBalance({
        actorUserId: admin.id,
        entityId: request.id,
        reviewNote: "Concurrent approval",
      }),
    ]);

    expectOneWinner(results);
    const persisted = await prisma.leaveRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: 2026,
        },
      },
    });
    const approvalAudits = await prisma.auditLog.count({
      where: { action: "LEAVE_REQUEST_APPROVED", entityId: request.id },
    });

    if (persisted.status === "APPROVED") {
      expect(balance?.used.toString()).toBe("3");
      expect(balance?.remaining.toString()).toBe("17");
      expect(approvalAudits).toBe(1);
    } else {
      expect(persisted.status).toBe("CANCELLED");
      expect(balance).toBeNull();
      expect(approvalAudits).toBe(0);
    }
  });

  it("makes simultaneous approval and rejection mutually exclusive", async () => {
    const { admin, employee, leaveType } = await createLeaveFixture();
    const request = await createPendingRequest({
      employeeId: employee.id,
      endDate: "2026-12-02T00:00:00.000Z",
      leaveTypeId: leaveType.id,
      startDate: "2026-12-01T00:00:00.000Z",
      totalDays: 2,
    });
    const results = await Promise.allSettled([
      approveLeaveRequestWithBalance({
        actorUserId: admin.id,
        entityId: request.id,
        reviewNote: "Concurrent approval",
      }),
      rejectLeaveRequestAtomically({
        actorUserId: admin.id,
        entityId: request.id,
        reviewNote: "Concurrent rejection",
      }),
    ]);

    expectOneWinner(results);
    const persisted = await prisma.leaveRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: 2026,
        },
      },
    });
    const auditLogs = await prisma.auditLog.findMany({
      select: { action: true },
      where: { entityId: request.id, entityType: "LeaveRequest" },
    });

    expect(auditLogs).toHaveLength(1);
    if (persisted.status === "APPROVED") {
      expect(balance?.used.toString()).toBe("2");
      expect(balance?.remaining.toString()).toBe("18");
      expect(auditLogs[0]?.action).toBe("LEAVE_REQUEST_APPROVED");
    } else {
      expect(persisted.status).toBe("REJECTED");
      expect(balance).toBeNull();
      expect(auditLogs[0]?.action).toBe("LEAVE_REQUEST_REJECTED");
    }
  });
});
