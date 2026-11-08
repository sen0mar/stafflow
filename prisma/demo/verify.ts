import type { PrismaClient } from "@prisma/client";
import { employees, fixturePrefix, leaveTypes } from "./fixtures";
import { SeedError } from "./seed-error";

export const verifyDemoSeed = async (
  prisma: PrismaClient,
  now = new Date(),
) => {
  const profiles = await prisma.employee.findMany({
    where: {
      user: { email: { in: employees.map((employee) => employee.email) } },
    },
    include: {
      user: true,
      attendanceRecords: true,
      leaveRequests: true,
      leaveBalances: true,
    },
  });
  if (profiles.length !== employees.length)
    throw new SeedError("Missing demo employee profiles.");
  for (const profile of profiles) {
    const index = employees.findIndex(
      (person) => person.email === profile.user?.email,
    );
    const expected = employees[index];
    if (
      profile.user?.role !== "EMPLOYEE" ||
      profile.user.status !== expected.userStatus ||
      profile.status !== expected.status
    )
      throw new SeedError("Demo profile status/role mismatch.");
    if (index < 12) {
      const fixtures = profile.leaveRequests.filter((request) =>
        request.id.startsWith(
          `${fixturePrefix}-leave-${now.getUTCFullYear()}-`,
        ),
      );
      if (
        fixtures.length !== 5 ||
        new Set(fixtures.map((request) => request.status)).size !== 4
      )
        throw new SeedError("Missing leave showcase scenarios.");
      for (const request of fixtures) {
        const days =
          (request.endDate.getTime() - request.startDate.getTime()) /
            86_400_000 +
          1;
        if (
          Number(request.totalDays) !== days ||
          request.startDate.getUTCFullYear() !==
            request.endDate.getUTCFullYear()
        )
          throw new SeedError("Invalid fixture leave dates.");
        if (
          ["APPROVED", "REJECTED"].includes(request.status) &&
          (!request.reviewedAt || !request.reviewedById)
        )
          throw new SeedError("Missing leave review metadata.");
      }
      if (!profile.attendanceRecords.length)
        throw new SeedError("Missing attendance history.");
    }
    if (
      profile.leaveBalances.filter(
        (balance) => balance.year === now.getUTCFullYear(),
      ).length !== leaveTypes.length
    )
      throw new SeedError("Missing current-year leave balances.");
    for (const balance of profile.leaveBalances.filter(
      (balance) => balance.year === now.getUTCFullYear(),
    )) {
      const used = profile.leaveRequests
        .filter(
          (request) =>
            request.status === "APPROVED" &&
            request.leaveTypeId === balance.leaveTypeId &&
            request.startDate.getUTCFullYear() === balance.year,
        )
        .reduce((sum, request) => sum + Number(request.totalDays), 0);
      if (
        used !== Number(balance.used) ||
        Number(balance.allocated) - used !== Number(balance.remaining)
      )
        throw new SeedError("Leave balance does not reconcile.");
    }
    for (const record of profile.attendanceRecords.filter(
      (record) => record.source === "SYSTEM",
    )) {
      if (
        record.clockInAt &&
        record.clockOutAt &&
        record.totalMinutes !==
          (record.clockOutAt.getTime() - record.clockInAt.getTime()) / 60_000
      )
        throw new SeedError("Attendance duration does not match timestamps.");
    }
  }
  const admin = await prisma.user.findUnique({
    where: { email: "admin.demo@example.com" },
  });
  if (admin?.role !== "ADMIN" || admin.status !== "ACTIVE")
    throw new SeedError("Missing active demo admin.");
  const audits = await prisma.auditLog.count({
    where: { id: { startsWith: fixturePrefix } },
  });
  if (!audits) throw new SeedError("Missing demo audit history.");
  return { employees: profiles.length, audits, verified: true };
};
