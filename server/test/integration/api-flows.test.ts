import request from "supertest";

import { createApp } from "../../src/app";
import { env } from "../../src/config/env";
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

  it("does not expose a public registration route", async () => {
    await seedUsers();

    await request(app)
      .post("/auth/register")
      .send({
        email: "public.signup@example.com",
        password: testPassword,
      })
      .expect(404)
      .expect(({ body }) => {
        expect(body.error.code).toBe("NOT_FOUND");
      });
  });

  it("blocks the public demo account-takeover chain", async () => {
    const { admin, employee, employeeUser } = await seedUsers();
    const { agent, csrfToken } = await login(admin.email);
    const fixtureResponse = await agent
      .post("/employees")
      .set("x-csrf-token", csrfToken)
      .send({
        email: "pending.fixture.integration@example.com",
        employeeCode: "IT-EMP-PENDING",
        firstName: "Pending",
        lastName: "Fixture",
      })
      .expect(201);
    const pendingEmployee = fixtureResponse.body.data.employee as {
      account: { id: string };
      id: string;
    };
    const pendingToken = fixtureResponse.body.data.invitation.token as string;
    const originalDemoMode = env.DEMO_MODE;

    env.DEMO_MODE = true;

    try {
      const blockedRequests = [
        agent.post("/employees").set("x-csrf-token", csrfToken).send({
          email: "attacker.private.integration@example.com",
          employeeCode: "IT-EMP-ATTACKER",
          firstName: "Private",
          lastName: "Account",
        }),
        agent
          .post(`/employees/${pendingEmployee.id}/invitation`)
          .set("x-csrf-token", csrfToken),
        request(app)
          .post("/auth/invitations/accept")
          .send({ password: "AttackerPrivatePass", token: pendingToken }),
        agent
          .patch(`/employees/${employee.id}/status`)
          .set("x-csrf-token", csrfToken)
          .send({ accountStatus: "DISABLED" }),
        agent
          .delete(`/employees/${employee.id}`)
          .set("x-csrf-token", csrfToken)
          .send({ employeeStatus: "INACTIVE" }),
      ];

      for (const blockedRequest of blockedRequests) {
        await blockedRequest.expect(403).expect(({ body }) => {
          expect(body.error.code).toBe("DEMO_READ_ONLY");
        });
      }

      await agent
        .patch(`/users/${pendingEmployee.account.id}`)
        .set("x-csrf-token", csrfToken)
        .send({ role: "ADMIN", status: "ACTIVE" })
        .expect(404)
        .expect(({ body }) => {
          expect(body.error.code).toBe("NOT_FOUND");
        });

      await request(app)
        .post("/auth/login")
        .send({
          email: "pending.fixture.integration@example.com",
          password: "AttackerPrivatePass",
        })
        .expect(401);

      await expect(
        prisma.user.findUnique({
          select: { role: true, status: true },
          where: { id: pendingEmployee.account.id },
        }),
      ).resolves.toEqual({ role: "EMPLOYEE", status: "INVITED" });
      await expect(
        prisma.user.findUnique({
          where: { email: "attacker.private.integration@example.com" },
        }),
      ).resolves.toBeNull();
      await expect(
        prisma.user.findUnique({
          select: { role: true, status: true },
          where: { id: employeeUser.id },
        }),
      ).resolves.toEqual({ role: "EMPLOYEE", status: "ACTIVE" });
    } finally {
      env.DEMO_MODE = originalDemoMode;
    }
  });

  it("enforces the demo read-only route matrix across every mutating module", async () => {
    const { admin, employeeUser } = await seedUsers();
    const adminAuth = await login(admin.email);
    const employeeAuth = await login(employeeUser.email);
    const originalDemoMode = env.DEMO_MODE;

    env.DEMO_MODE = true;

    try {
      await request(app)
        .get("/auth/config")
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({ data: { demoMode: true } });
        });
      await adminAuth.agent.get("/auth/me").expect(200);

      const routeMatrix = [
        {
          module: "auth forgot password",
          request: request(app)
            .post("/auth/forgot-password")
            .send({ email: admin.email }),
        },
        {
          module: "auth reset password",
          request: request(app)
            .post("/auth/reset-password")
            .send({ password: "ReplacementPassword", token: "token" }),
        },
        {
          module: "auth invitation acceptance",
          request: request(app)
            .post("/auth/invitations/accept")
            .send({ password: "ReplacementPassword", token: "token" }),
        },
        {
          module: "auth password change",
          request: adminAuth.agent
            .post("/auth/change-password")
            .set("x-csrf-token", adminAuth.csrfToken)
            .send({
              currentPassword: testPassword,
              newPassword: "ReplacementPassword",
            }),
        },
        {
          module: "employee self profile",
          request: employeeAuth.agent
            .patch("/employees/me/profile")
            .set("x-csrf-token", employeeAuth.csrfToken)
            .send({ firstName: "Changed", lastName: "Employee" }),
        },
        {
          module: "employee create",
          request: adminAuth.agent
            .post("/employees")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "employee invitation",
          request: adminAuth.agent
            .post("/employees/route-id/invitation")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "employee update",
          request: adminAuth.agent
            .patch("/employees/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "employee status",
          request: adminAuth.agent
            .patch("/employees/route-id/status")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "employee disable",
          request: adminAuth.agent
            .delete("/employees/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "department create",
          request: adminAuth.agent
            .post("/departments")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "department update",
          request: adminAuth.agent
            .patch("/departments/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "department delete",
          request: adminAuth.agent
            .delete("/departments/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "attendance clock in",
          request: employeeAuth.agent
            .post("/attendance/clock-in")
            .set("x-csrf-token", employeeAuth.csrfToken),
        },
        {
          module: "attendance clock out",
          request: employeeAuth.agent
            .post("/attendance/clock-out")
            .set("x-csrf-token", employeeAuth.csrfToken),
        },
        {
          module: "attendance correction",
          request: adminAuth.agent
            .patch("/attendance/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "leave type create",
          request: adminAuth.agent
            .post("/leave-types")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "leave type update",
          request: adminAuth.agent
            .patch("/leave-types/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "leave type delete",
          request: adminAuth.agent
            .delete("/leave-types/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "leave request create",
          request: employeeAuth.agent
            .post("/leave-requests")
            .set("x-csrf-token", employeeAuth.csrfToken),
        },
        {
          module: "leave request cancel",
          request: employeeAuth.agent
            .patch("/leave-requests/route-id/cancel")
            .set("x-csrf-token", employeeAuth.csrfToken),
        },
        {
          module: "leave request approve",
          request: adminAuth.agent
            .patch("/leave-requests/route-id/approve")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "leave request reject",
          request: adminAuth.agent
            .patch("/leave-requests/route-id/reject")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "payslip upload",
          request: adminAuth.agent
            .post("/payslips")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        {
          module: "payslip delete",
          request: adminAuth.agent
            .delete("/payslips/route-id")
            .set("x-csrf-token", adminAuth.csrfToken),
        },
        ...["company", "attendance", "leave"].map((settingsModule) => ({
          module: `settings ${settingsModule}`,
          request: adminAuth.agent
            .patch(`/settings/${settingsModule}`)
            .set("x-csrf-token", adminAuth.csrfToken),
        })),
      ];

      for (const route of routeMatrix) {
        await route.request.expect(403).expect(({ body }) => {
          expect(body.error.code, route.module).toBe("DEMO_READ_ONLY");
        });
      }

      await adminAuth.agent
        .post("/auth/logout")
        .set("x-csrf-token", adminAuth.csrfToken)
        .expect(200);
    } finally {
      env.DEMO_MODE = originalDemoMode;
    }
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

  it("forbids employees from admin-only endpoints and other employee records", async () => {
    const { employeeUser, otherEmployee } = await seedUsers();
    const { agent } = await login(employeeUser.email);

    const forbiddenRequests = [
      agent.get("/employees"),
      agent.get("/employees/invitations"),
      agent.get(`/employees/${otherEmployee.id}`),
      agent.get("/attendance"),
      agent.get("/leave-requests"),
      agent.get("/payslips"),
      agent.post("/payslips").field("employeeId", otherEmployee.id),
      agent.get("/settings/company"),
      agent.patch("/settings/company").send({ name: "Unsafe Demo Rename" }),
      agent.get("/audit-logs"),
    ];

    for (const forbiddenRequest of forbiddenRequests) {
      await forbiddenRequest.expect(403).expect(({ body }) => {
        expect(body.error.code).toBe("FORBIDDEN");
      });
    }
  });

  it("lets admins manage pending employee invitations securely", async () => {
    const { admin } = await seedUsers();
    const { agent, csrfToken } = await login(admin.email);
    const createResponse = await agent
      .post("/employees")
      .set("x-csrf-token", csrfToken)
      .send({
        email: "invited.employee.integration@example.com",
        employeeCode: "IT-EMP-INVITED",
        firstName: "Nora",
        lastName: "Stone",
      })
      .expect(201);
    const createdEmployee = createResponse.body.data.employee as {
      id: string;
    };
    const firstToken = createResponse.body.data.invitation.token as string;

    await agent
      .get("/employees/invitations")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual([
          expect.objectContaining({
            email: "invited.employee.integration@example.com",
            employeeId: createdEmployee.id,
            employeeName: "Nora Stone",
          }),
        ]);
        expect(body.data[0]).not.toHaveProperty("token");
      });

    const regenerateResponse = await agent
      .post(`/employees/${createdEmployee.id}/invitation`)
      .set("x-csrf-token", csrfToken)
      .expect(201);
    const regeneratedToken = regenerateResponse.body.data.invitation
      .token as string;

    expect(regeneratedToken).not.toBe(firstToken);

    await request(app)
      .post("/auth/invitations/accept")
      .send({ password: "NewStafflowPass", token: firstToken })
      .expect(400);
    await request(app)
      .post("/auth/invitations/accept")
      .send({ password: "NewStafflowPass", token: regeneratedToken })
      .expect(200);

    await agent
      .get("/employees/invitations")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual([]);
      });
  });

  it("excludes expired invitations from the pending invitation list", async () => {
    const { admin } = await seedUsers();
    const { agent, csrfToken } = await login(admin.email);
    const createResponse = await agent
      .post("/employees")
      .set("x-csrf-token", csrfToken)
      .send({
        email: "expired.invite.integration@example.com",
        employeeCode: "IT-EMP-EXPIRED",
        firstName: "Ezra",
        lastName: "Vale",
      })
      .expect(201);
    const createdEmployee = createResponse.body.data.employee as {
      account: { id: string };
    };

    await prisma.invitationToken.updateMany({
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
      where: {
        userId: createdEmployee.account.id,
      },
    });

    await agent
      .get("/employees/invitations")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual([]);
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

    await expect(
      prisma.auditLog.findMany({
        orderBy: { createdAt: "asc" },
        select: { action: true, actorUserId: true, entityId: true },
        where: {
          actorUserId: admin.id,
          entityId: createdEmployee.id,
        },
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "EMPLOYEE_CREATED" }),
        expect.objectContaining({ action: "EMPLOYEE_UPDATED" }),
        expect.objectContaining({ action: "EMPLOYEE_DISABLED" }),
      ]),
    );
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
