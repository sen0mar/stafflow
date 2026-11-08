import bcrypt from "bcrypt";
import type { Prisma, PrismaClient } from "@prisma/client";
import { SETTINGS_SINGLETON_IDS } from "../../server/src/modules/settings/settings.constants";
import {
  addDays,
  attendanceFixtures,
  companyTimezone,
  departments,
  employees,
  fixturePrefix,
  leaveFixtures,
  leaveTypes,
  midnight,
} from "./fixtures";
import { audit } from "./audit";
import { SeedError } from "./seed-error";

export const seedBusinessData = async (prisma: PrismaClient, now: Date) => {
  const passwordHash = await bcrypt.hash("StafflowDemo", 12);
  return prisma.$transaction(
    async (tx) => {
      const existingAdmin = await tx.user.findUnique({
        where: { email: "admin.demo@example.com" },
      });
      if (
        existingAdmin &&
        (existingAdmin.role !== "ADMIN" || existingAdmin.status !== "ACTIVE")
      )
        throw new SeedError(
          "Demo admin identity has unexpected role/status; refusing to overwrite it.",
        );
      const admin = await tx.user.upsert({
        where: { email: "admin.demo@example.com" },
        update: {},
        create: {
          email: "admin.demo@example.com",
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      const departmentIds = new Map<string, string>();
      for (const name of departments) {
        const record = await tx.department.upsert({
          where: { name },
          update: {},
          create: {
            name,
            description: `${name} team at the fictional Stafflow Demo Company.`,
          },
        });
        departmentIds.set(name, record.id);
      }
      const typeIds = new Map<string, string>();
      for (const type of leaveTypes) {
        const record = await tx.leaveType.upsert({
          where: { name: type.name },
          update: {},
          create: {
            ...type,
            description: `Fictional company ${type.name.toLowerCase()} policy.`,
          },
        });
        typeIds.set(type.name, record.id);
      }
      const seededEmployees = [];
      const audits: Prisma.AuditLogCreateManyInput[] = [];
      for (const [index, person] of employees.entries()) {
        const existingUser = await tx.user.findUnique({
          where: { email: person.email },
          include: { employee: true },
        });
        const byCode = await tx.employee.findUnique({
          where: { employeeCode: person.employeeCode },
        });
        if (
          existingUser &&
          (existingUser.role !== "EMPLOYEE" ||
            existingUser.status !== person.userStatus)
        )
          throw new SeedError(
            `Unexpected demo account role/status at fixture ${index}; resolve manually.`,
          );
        if (
          existingUser?.employee &&
          existingUser.employee.employeeCode !== person.employeeCode &&
          !(
            index === 0 && existingUser.employee.employeeCode === "EMP-DEMO-001"
          )
        )
          throw new SeedError(`Unexpected profile link at fixture ${index}.`);
        if (byCode && byCode.userId !== existingUser?.id)
          throw new SeedError(`Employee code collision at fixture ${index}.`);
        if (
          byCode &&
          existingUser?.employee &&
          byCode.id !== existingUser.employee.id
        )
          throw new SeedError(
            `Conflicting employee profiles at fixture ${index}.`,
          );
        const user =
          existingUser ??
          (await tx.user.create({
            data: {
              email: person.email,
              passwordHash,
              role: "EMPLOYEE",
              status: person.userStatus,
            },
          }));
        const profile = {
          firstName: person.firstName,
          lastName: person.lastName,
          jobTitle: person.jobTitle,
          phone: person.phone,
          hireDate: person.hireDate,
          status: person.status,
          terminationDate:
            person.status === "TERMINATED" ? addDays(midnight(now), -70) : null,
          departmentId: departmentIds.get(person.departmentName)!,
        };
        const employee = existingUser?.employee
          ? await tx.employee.update({
              where: { id: existingUser.employee.id },
              data: profile,
            })
          : await tx.employee.create({
              data: {
                ...profile,
                employeeCode: person.employeeCode,
                userId: user.id,
              },
            });
        seededEmployees.push(employee);
        audits.push(
          audit(
            admin.id,
            `employee-${index}`,
            "EMPLOYEE_CREATED",
            "Employee",
            employee.id,
            person.hireDate,
          ),
        );
        const requests = leaveFixtures(now, index);
        // Populate only active, onboarded employees; keep inactive history separate.
        if (index < 12) {
          const approved = requests.filter(
            (request) => request.status === "APPROVED",
          );
          const attendance = attendanceFixtures(now, index).map((record) =>
            approved.some(
              (request) =>
                record.date >= request.startDate &&
                record.date <= request.endDate,
            )
              ? {
                  ...record,
                  clockInAt: null,
                  clockOutAt: null,
                  totalMinutes: null,
                  status: "ABSENT" as const,
                  notes: "Approved leave - not expected at work.",
                }
              : record,
          );
          await tx.attendanceRecord.createMany({
            data: attendance.map((record) => ({
              ...record,
              employeeId: employee.id,
            })),
            skipDuplicates: true,
          });
          // Repair only the recognizable timestamp patterns emitted by the old seed.
          const legacyAttendance = await tx.attendanceRecord.findMany({
            where: {
              employeeId: employee.id,
              source: "SYSTEM",
              totalMinutes: { in: [262, 450, 486] },
              OR: [{ notes: null }, { notes: { startsWith: "Demo " } }],
            },
          });
          for (const old of legacyAttendance) {
            const clockInAt = new Date(
              old.date.getTime() + (old.status === "LATE" ? 564 : 540) * 60_000,
            );
            const totalMinutes = old.status === "PARTIAL" ? 240 : 480;
            await tx.attendanceRecord.update({
              where: { id: old.id },
              data: {
                clockInAt,
                clockOutAt: new Date(
                  clockInAt.getTime() + totalMinutes * 60_000,
                ),
                totalMinutes,
              },
            });
            audits.push(
              audit(
                admin.id,
                `attendance-${old.id}`,
                "ATTENDANCE_CORRECTED",
                "AttendanceRecord",
                old.id,
                now,
              ),
            );
          }
          for (const request of requests) {
            const {
              employeeIndex: _employeeIndex,
              leaveTypeName,
              ...data
            } = request;
            const existing = await tx.leaveRequest.findUnique({
              where: { id: data.id },
              select: { employeeId: true },
            });
            if (existing && existing.employeeId !== employee.id)
              throw new SeedError("Leave fixture ownership collision.");
            if (!existing && ["PENDING", "APPROVED"].includes(data.status)) {
              const overlap = await tx.leaveRequest.findFirst({
                where: {
                  employeeId: employee.id,
                  status: { in: ["PENDING", "APPROVED"] },
                  startDate: { lte: data.endDate },
                  endDate: { gte: data.startDate },
                },
                select: { id: true },
              });
              if (overlap)
                throw new SeedError(
                  `Existing active leave overlaps showcase fixture ${index}; resolve the dates before seeding.`,
                );
            }
            await tx.leaveRequest.upsert({
              where: { id: data.id },
              update: {},
              create: {
                ...data,
                employeeId: employee.id,
                leaveTypeId: typeIds.get(leaveTypeName)!,
                reviewedById: data.reviewedAt ? admin.id : null,
              },
            });
            if (data.reviewedAt)
              audits.push(
                audit(
                  admin.id,
                  `leave-${now.getUTCFullYear()}-${index}-${data.status}-${leaveTypeName}`,
                  `LEAVE_REQUEST_${data.status}`,
                  "LeaveRequest",
                  data.id,
                  data.reviewedAt,
                ),
              );
          }
        }
        for (const type of leaveTypes) {
          const leaveTypeId = typeIds.get(type.name)!;
          const approved = await tx.leaveRequest.aggregate({
            where: {
              employeeId: employee.id,
              leaveTypeId,
              status: "APPROVED",
              startDate: {
                gte: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
                lt: new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)),
              },
            },
            _sum: { totalDays: true },
          });
          const used = Number(approved._sum.totalDays ?? 0);
          const existing = await tx.leaveBalance.findUnique({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: employee.id,
                leaveTypeId,
                year: now.getUTCFullYear(),
              },
            },
          });
          const allocated = Number(existing?.allocated ?? type.annualAllowance);
          await tx.leaveBalance.upsert({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: employee.id,
                leaveTypeId,
                year: now.getUTCFullYear(),
              },
            },
            update: { used, remaining: allocated - used },
            create: {
              employeeId: employee.id,
              leaveTypeId,
              year: now.getUTCFullYear(),
              allocated,
              used,
              remaining: allocated - used,
            },
          });
        }
      }
      // Explicit demo-owned settings are the only shared rows refreshed on each run.
      const company = {
        name: "Stafflow Demo Company",
        timezone: companyTimezone,
        locale: "en-US",
      };
      await tx.companySettings.upsert({
        where: { id: SETTINGS_SINGLETON_IDS.company },
        update: company,
        create: { id: SETTINGS_SINGLETON_IDS.company, ...company },
      });
      const attendance = {
        workdayMinutes: 480,
        workdayStart: "09:00",
        workdayEnd: "17:00",
        weeklyWorkingDays: [1, 2, 3, 4, 5],
        lateGracePeriodMinutes: 10,
        allowEmployeeClockIn: true,
      };
      await tx.attendanceSettings.upsert({
        where: { id: SETTINGS_SINGLETON_IDS.attendance },
        update: attendance,
        create: { id: SETTINGS_SINGLETON_IDS.attendance, ...attendance },
      });
      const leave = {
        defaultAnnualAllowanceDays: 20,
        allowNegativeBalance: false,
        policyText:
          "Request full calendar days, including weekends. Admin approval is required. This fictional company follows a UTC work schedule.",
      };
      await tx.leaveSettings.upsert({
        where: { id: SETTINGS_SINGLETON_IDS.leave },
        update: leave,
        create: { id: SETTINGS_SINGLETON_IDS.leave, ...leave },
      });
      audits.push(
        audit(
          admin.id,
          "settings",
          "SETTINGS_UPDATED",
          "CompanySettings",
          SETTINGS_SINGLETON_IDS.company,
          addDays(midnight(now), -30),
        ),
      );
      await tx.auditLog.createMany({ data: audits, skipDuplicates: true });
      return { admin, employees: seededEmployees };
    },
    { timeout: 120_000, isolationLevel: "Serializable" },
  );
};
