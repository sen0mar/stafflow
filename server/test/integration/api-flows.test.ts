import request from "supertest";

import { createApp } from "../../src/app";
import { hashPassword } from "../../src/core/auth/password.service";
import { prisma } from "../../src/prisma/prisma.client";

const app = createApp();
const testPassword = "StafflowDemo";

const getTestDatabaseName = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  return new URL(databaseUrl).pathname.replace("/", "");
};

const hasDedicatedTestDatabase = () =>
  getTestDatabaseName()?.toLowerCase().includes("test") ?? false;

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

const seedUsers = async () => {
  const passwordHash = await hashPassword(testPassword);
  const admin = await prisma.user.create({
    data: {
      email: "admin.integration@example.com",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  const employeeUser = await prisma.user.create({
    data: {
      email: "employee.integration@example.com",
      passwordHash,
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  });
  const otherUser = await prisma.user.create({
    data: {
      email: "other.integration@example.com",
      passwordHash,
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  });
  const employee = await prisma.employee.create({
    data: {
      employeeCode: "IT-EMP-001",
      firstName: "Maya",
      lastName: "Rivers",
      userId: employeeUser.id,
    },
  });
  const otherEmployee = await prisma.employee.create({
    data: {
      employeeCode: "IT-EMP-002",
      firstName: "Liam",
      lastName: "Chen",
      userId: otherUser.id,
    },
  });
  const otherPayslip = await prisma.payslip.create({
    data: {
      contentType: "application/pdf",
      employeeId: otherEmployee.id,
      fileName: "other-may-2026.pdf",
      fileSize: 1024,
      month: 5,
      r2ObjectKey: "test/payslips/other-may-2026.pdf",
      uploadedById: admin.id,
      year: 2026,
    },
  });

  return {
    admin,
    employee,
    employeeUser,
    otherEmployee,
    otherPayslip,
    otherUser,
  };
};

const login = async (email: string) => {
  const agent = request.agent(app);
  const response = await agent
    .post("/auth/login")
    .send({ email, password: testPassword })
    .expect(200);
  const body = response.body as { data: { csrfToken: string } };

  return {
    agent,
    csrfToken: body.data.csrfToken,
    response,
  };
};

const describeWithTestDatabase = hasDedicatedTestDatabase()
  ? describe
  : describe.skip;

describeWithTestDatabase("core API flows", () => {
  beforeAll(async () => {
    expect(hasDedicatedTestDatabase()).toBe(true);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("logs in and returns /auth/me for the current user", async () => {
    const { employeeUser } = await seedUsers();
    const { agent, response } = await login(employeeUser.email);

    expect(response.body).toMatchObject({
      data: {
        user: {
          email: employeeUser.email,
          role: "EMPLOYEE",
          status: "ACTIVE",
        },
      },
    });

    await agent
      .get("/auth/me")
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          data: {
            user: {
              email: employeeUser.email,
              role: "EMPLOYEE",
            },
          },
        });
      });
  });

  it("allows employee self access without trusting request employee ids", async () => {
    const { employee, employeeUser } = await seedUsers();
    const { agent } = await login(employeeUser.email);

    await agent
      .get("/employees/me")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toMatchObject({
          employeeCode: employee.employeeCode,
          id: employee.id,
        });
      });
  });

  it("allows admins to create, read, update, and disable employees", async () => {
    const { admin } = await seedUsers();
    const { agent, csrfToken } = await login(admin.email);
    const createResponse = await agent
      .post("/employees")
      .set("x-csrf-token", csrfToken)
      .send({
        email: "new.employee.integration@example.com",
        employeeCode: "IT-EMP-003",
        firstName: "Ava",
        lastName: "Morgan",
      })
      .expect(201);
    const createdEmployee = createResponse.body.data.employee as { id: string };

    await agent
      .get("/employees")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: createdEmployee.id }),
          ]),
        );
      });

    await agent.get(`/employees/${createdEmployee.id}`).expect(200);

    await agent
      .patch(`/employees/${createdEmployee.id}`)
      .set("x-csrf-token", csrfToken)
      .send({ firstName: "Avery" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.firstName).toBe("Avery");
      });

    await agent
      .delete(`/employees/${createdEmployee.id}`)
      .set("x-csrf-token", csrfToken)
      .send({ employeeStatus: "INACTIVE" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe("INACTIVE");
        expect(body.data.account.status).toBe("DISABLED");
      });
  });

  it("forbids an employee from accessing another employee payslip", async () => {
    const { employeeUser, otherPayslip } = await seedUsers();
    const { agent } = await login(employeeUser.email);

    await agent
      .get(`/payslips/${otherPayslip.id}`)
      .expect(403)
      .expect(({ body }) => {
        expect(body.error.code).toBe("PAYSLIP_FORBIDDEN");
      });

    await agent
      .get(`/payslips/${otherPayslip.id}/download`)
      .expect(403)
      .expect(({ body }) => {
        expect(body.error.code).toBe("PAYSLIP_FORBIDDEN");
      });
  });
});
