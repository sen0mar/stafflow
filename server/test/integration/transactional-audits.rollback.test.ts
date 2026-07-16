import { vi } from "vitest";

const { createAuditLog } = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
}));

vi.mock("../../src/modules/audit-logs/audit-log.service", () => ({
  createAuditLog,
}));

import {
  createDepartmentWithAuditLog,
  deleteDepartmentWithAuditLog,
  updateDepartmentWithAuditLog,
} from "../../src/modules/departments/departments.repository";
import {
  updateEmployeeAndAccountStatus,
  updateEmployeeWithAuditLog,
  updateSelfEmployeeProfileWithAuditLog,
} from "../../src/modules/employees/employees.repository";
import {
  createLeaveTypeWithAuditLog,
  deleteLeaveTypeWithAuditLog,
  updateLeaveTypeWithAuditLog,
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

const cleanBusinessRecords = async () => {
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

const auditLog = {
  action: "INTEGRATION_TEST_MUTATION",
  actorUserId: null,
};

const createEmployeeFixture = async () => {
  const user = await prisma.user.create({
    data: {
      email: "transactional-audit.integration@example.com",
      passwordHash: "integration-test-hash",
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  });
  const employee = await prisma.employee.create({
    data: {
      employeeCode: "AUDIT-001",
      firstName: "Original",
      lastName: "Employee",
      status: "ACTIVE",
      userId: user.id,
    },
  });

  return { employee, user };
};

describeWithTestDatabase("transactional audit rollback", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    createAuditLog.mockReset();
    createAuditLog.mockRejectedValue(new Error("injected audit failure"));
    await cleanBusinessRecords();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rolls back department creation when auditing fails", async () => {
    await expect(
      createDepartmentWithAuditLog({
        auditLog,
        input: { name: "Rollback Department" },
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.department.count({ where: { name: "Rollback Department" } }),
    ).resolves.toBe(0);
  });

  it("rolls back department updates when auditing fails", async () => {
    const department = await prisma.department.create({
      data: { description: "Original", name: "Department" },
    });

    await expect(
      updateDepartmentWithAuditLog({
        auditLog,
        current: {
          description: department.description,
          isActive: department.isActive,
          name: department.name,
        },
        id: department.id,
        input: { description: "Changed", name: "Changed Department" },
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.department.findUnique({ where: { id: department.id } }),
    ).resolves.toMatchObject({
      description: "Original",
      name: "Department",
    });
  });

  it("rolls back department deletion when auditing fails", async () => {
    const department = await prisma.department.create({
      data: { name: "Department" },
    });

    await expect(
      deleteDepartmentWithAuditLog({
        auditLog,
        employeeCount: 0,
        id: department.id,
        name: department.name,
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.department.findUnique({ where: { id: department.id } }),
    ).resolves.not.toBeNull();
  });

  it("rolls back employee updates when auditing fails", async () => {
    const { employee } = await createEmployeeFixture();

    await expect(
      updateEmployeeWithAuditLog({
        auditLog,
        current: {
          departmentId: employee.departmentId,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          jobTitle: employee.jobTitle,
          lastName: employee.lastName,
          phone: employee.phone,
        },
        id: employee.id,
        input: { firstName: "Changed", jobTitle: "Changed title" },
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.employee.findUnique({ where: { id: employee.id } }),
    ).resolves.toMatchObject({ firstName: "Original", jobTitle: null });
  });

  it("rolls back employee status, user status, and session revocation when user auditing fails", async () => {
    const { employee, user } = await createEmployeeFixture();
    const session = await prisma.session.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: "transactional-audit-session-hash",
        userId: user.id,
      },
    });
    createAuditLog
      .mockReset()
      .mockResolvedValueOnce({ id: "employee-audit" })
      .mockRejectedValueOnce(new Error("injected audit failure"));

    await expect(
      updateEmployeeAndAccountStatus({
        accountStatus: "DISABLED",
        employeeAuditLog: {
          ...auditLog,
          entityId: employee.id,
          metadata: { from: "ACTIVE", to: "TERMINATED" },
        },
        employeeId: employee.id,
        employeeStatus: "TERMINATED",
        userAuditLog: {
          ...auditLog,
          entityId: user.id,
          metadata: { from: "ACTIVE", to: "DISABLED" },
        },
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.employee.findUnique({ where: { id: employee.id } }),
    ).resolves.toMatchObject({ status: "ACTIVE", terminationDate: null });
    await expect(
      prisma.user.findUnique({ where: { id: user.id } }),
    ).resolves.toMatchObject({ status: "ACTIVE" });
    await expect(
      prisma.session.findUnique({ where: { id: session.id } }),
    ).resolves.toMatchObject({ revokedAt: null });
  });

  it("rolls back self-profile updates when auditing fails", async () => {
    const { employee } = await createEmployeeFixture();

    await expect(
      updateSelfEmployeeProfileWithAuditLog({
        auditLog,
        id: employee.id,
        input: { firstName: "Changed", phone: "+1 555 0100" },
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.employee.findUnique({ where: { id: employee.id } }),
    ).resolves.toMatchObject({ firstName: "Original", phone: null });
  });

  it("rolls back leave-type creation when auditing fails", async () => {
    await expect(
      createLeaveTypeWithAuditLog({
        auditLog,
        input: { annualAllowance: 20, name: "Rollback Leave" },
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.leaveType.count({ where: { name: "Rollback Leave" } }),
    ).resolves.toBe(0);
  });

  it("rolls back leave-type updates when auditing fails", async () => {
    const leaveType = await prisma.leaveType.create({
      data: { annualAllowance: 20, name: "Leave Type" },
    });

    await expect(
      updateLeaveTypeWithAuditLog({
        auditLog,
        current: {
          annualAllowance: leaveType.annualAllowance,
          description: leaveType.description,
          isActive: leaveType.isActive,
          isPaid: leaveType.isPaid,
          name: leaveType.name,
        },
        id: leaveType.id,
        input: { annualAllowance: 10, name: "Changed Leave Type" },
      }),
    ).rejects.toThrow("injected audit failure");

    const persisted = await prisma.leaveType.findUniqueOrThrow({
      where: { id: leaveType.id },
    });
    expect(persisted.name).toBe("Leave Type");
    expect(persisted.annualAllowance?.toString()).toBe("20");
  });

  it("rolls back leave-type deletion when auditing fails", async () => {
    const leaveType = await prisma.leaveType.create({
      data: { name: "Leave Type" },
    });

    await expect(
      deleteLeaveTypeWithAuditLog({
        auditLog,
        id: leaveType.id,
        name: leaveType.name,
        usage: { leaveBalances: 0, leaveRequests: 0 },
      }),
    ).rejects.toThrow("injected audit failure");

    await expect(
      prisma.leaveType.findUnique({ where: { id: leaveType.id } }),
    ).resolves.not.toBeNull();
  });
});
