import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the demo seed.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

const demoPassword = "StafflowDemo";
const bcryptRounds = 12;
const seedYear = new Date().getFullYear();

interface DemoEmployee {
  email: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  departmentName: string;
  phone: string;
  hireDate: Date;
}

const departments = [
  {
    name: "Engineering",
    description: "Product engineering, platform operations, and technical delivery.",
  },
  {
    name: "Marketing",
    description: "Brand, demand generation, campaigns, and market communications.",
  },
  {
    name: "Human Resources",
    description: "People operations, employee lifecycle, and workplace support.",
  },
  {
    name: "Finance",
    description: "Payroll coordination, budgeting, reporting, and controls.",
  },
  {
    name: "Operations",
    description: "Business operations, vendor coordination, and internal workflows.",
  },
];

const demoEmployees: DemoEmployee[] = [
  {
    email: "employee.demo@example.com",
    employeeCode: "EMP-001",
    firstName: "Maya",
    lastName: "Rivers",
    jobTitle: "Frontend Engineer",
    departmentName: "Engineering",
    phone: "+1 555 0101",
    hireDate: new Date("2023-03-13T00:00:00.000Z"),
  },
  {
    email: "liam.marketing.demo@example.com",
    employeeCode: "EMP-002",
    firstName: "Liam",
    lastName: "Chen",
    jobTitle: "Marketing Manager",
    departmentName: "Marketing",
    phone: "+1 555 0102",
    hireDate: new Date("2022-08-22T00:00:00.000Z"),
  },
  {
    email: "sofia.hr.demo@example.com",
    employeeCode: "EMP-003",
    firstName: "Sofia",
    lastName: "Patel",
    jobTitle: "People Operations Specialist",
    departmentName: "Human Resources",
    phone: "+1 555 0103",
    hireDate: new Date("2021-11-01T00:00:00.000Z"),
  },
  {
    email: "noah.finance.demo@example.com",
    employeeCode: "EMP-004",
    firstName: "Noah",
    lastName: "Brooks",
    jobTitle: "Financial Analyst",
    departmentName: "Finance",
    phone: "+1 555 0104",
    hireDate: new Date("2024-01-15T00:00:00.000Z"),
  },
  {
    email: "ava.operations.demo@example.com",
    employeeCode: "EMP-005",
    firstName: "Ava",
    lastName: "Morgan",
    jobTitle: "Operations Coordinator",
    departmentName: "Operations",
    phone: "+1 555 0105",
    hireDate: new Date("2023-06-05T00:00:00.000Z"),
  },
];

const leaveTypes = [
  {
    name: "Annual Leave",
    description: "Planned time off for vacation and personal rest.",
    annualAllowance: 20,
    isPaid: true,
  },
  {
    name: "Sick Leave",
    description: "Health-related absence and recovery time.",
    annualAllowance: 10,
    isPaid: true,
  },
  {
    name: "Personal Leave",
    description: "Personal obligations that require time away from work.",
    annualAllowance: 5,
    isPaid: true,
  },
  {
    name: "Casual Leave",
    description: "Short-notice personal time off.",
    annualAllowance: 6,
    isPaid: true,
  },
];

const atUtcMidnight = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const setUtcTime = (date: Date, hours: number, minutes: number) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
    ),
  );

const recentWeekdays = (count: number) => {
  const dates: Date[] = [];
  let cursor = atUtcMidnight(new Date());

  while (dates.length < count) {
    const day = cursor.getUTCDay();

    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }

    cursor = addDays(cursor, -1);
  }

  return dates.reverse();
};

const main = async () => {
  const passwordHash = await bcrypt.hash(demoPassword, bcryptRounds);

  const departmentRecords = await Promise.all(
    departments.map((department) =>
      prisma.department.upsert({
        where: { name: department.name },
        update: {
          description: department.description,
          isActive: true,
        },
        create: {
          name: department.name,
          description: department.description,
          isActive: true,
        },
      }),
    ),
  );

  const departmentByName = new Map(
    departmentRecords.map((department) => [department.name, department]),
  );

  await prisma.user.upsert({
    where: { email: "admin.demo@example.com" },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      email: "admin.demo@example.com",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const employees = [];

  for (const demoEmployee of demoEmployees) {
    const user = await prisma.user.upsert({
      where: { email: demoEmployee.email },
      update: {
        passwordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
      create: {
        email: demoEmployee.email,
        passwordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    });

    const department = departmentByName.get(demoEmployee.departmentName);

    if (!department) {
      throw new Error(`Missing department for ${demoEmployee.departmentName}`);
    }

    const employee = await prisma.employee.upsert({
      where: { employeeCode: demoEmployee.employeeCode },
      update: {
        userId: user.id,
        departmentId: department.id,
        firstName: demoEmployee.firstName,
        lastName: demoEmployee.lastName,
        jobTitle: demoEmployee.jobTitle,
        phone: demoEmployee.phone,
        hireDate: demoEmployee.hireDate,
        status: "ACTIVE",
      },
      create: {
        userId: user.id,
        departmentId: department.id,
        employeeCode: demoEmployee.employeeCode,
        firstName: demoEmployee.firstName,
        lastName: demoEmployee.lastName,
        jobTitle: demoEmployee.jobTitle,
        phone: demoEmployee.phone,
        hireDate: demoEmployee.hireDate,
        status: "ACTIVE",
      },
    });

    employees.push(employee);
  }

  const leaveTypeRecords = await Promise.all(
    leaveTypes.map((leaveType) =>
      prisma.leaveType.upsert({
        where: { name: leaveType.name },
        update: {
          description: leaveType.description,
          annualAllowance: leaveType.annualAllowance,
          isPaid: leaveType.isPaid,
          isActive: true,
        },
        create: {
          name: leaveType.name,
          description: leaveType.description,
          annualAllowance: leaveType.annualAllowance,
          isPaid: leaveType.isPaid,
          isActive: true,
        },
      }),
    ),
  );

  const leaveTypeByName = new Map(
    leaveTypeRecords.map((leaveType) => [leaveType.name, leaveType]),
  );

  for (const employee of employees) {
    for (const leaveType of leaveTypeRecords) {
      const allocated = leaveType.annualAllowance ?? 0;
      const used = leaveType.name === "Annual Leave" ? 2 : 0;

      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: seedYear,
          },
        },
        update: {
          allocated,
          used,
          remaining: Number(allocated) - used,
        },
        create: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: seedYear,
          allocated,
          used,
          remaining: Number(allocated) - used,
        },
      });
    }
  }

  const attendanceDates = recentWeekdays(12);

  for (const [employeeIndex, employee] of employees.entries()) {
    for (const [dateIndex, date] of attendanceDates.entries()) {
      const pattern = (employeeIndex + dateIndex) % 9;
      const isAbsent = pattern === 0;
      const isLate = pattern === 3;
      const isPartial = pattern === 6;
      const clockInAt = isAbsent ? null : setUtcTime(date, isLate ? 9 : 8, isLate ? 34 : 58);
      const clockOutAt = isAbsent ? null : setUtcTime(date, isPartial ? 13 : 17, isPartial ? 20 : 4);
      const totalMinutes = isAbsent ? null : isPartial ? 262 : isLate ? 450 : 486;

      await prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date,
          },
        },
        update: {
          clockInAt,
          clockOutAt,
          totalMinutes,
          status: isAbsent ? "ABSENT" : isLate ? "LATE" : isPartial ? "PARTIAL" : "PRESENT",
          source: "SYSTEM",
          notes: isAbsent
            ? "Demo absence record."
            : isLate
              ? "Demo late arrival."
              : isPartial
                ? "Demo partial workday."
                : null,
        },
        create: {
          employeeId: employee.id,
          date,
          clockInAt,
          clockOutAt,
          totalMinutes,
          status: isAbsent ? "ABSENT" : isLate ? "LATE" : isPartial ? "PARTIAL" : "PRESENT",
          source: "SYSTEM",
          notes: isAbsent
            ? "Demo absence record."
            : isLate
              ? "Demo late arrival."
              : isPartial
                ? "Demo partial workday."
                : null,
        },
      });
    }
  }

  const annualLeave = leaveTypeByName.get("Annual Leave");
  const sickLeave = leaveTypeByName.get("Sick Leave");
  const personalLeave = leaveTypeByName.get("Personal Leave");

  if (!annualLeave || !sickLeave || !personalLeave) {
    throw new Error("Missing seeded leave types");
  }

  const pendingRequests = [
    {
      employee: employees[0],
      leaveType: annualLeave,
      startDate: addDays(atUtcMidnight(new Date()), 8),
      endDate: addDays(atUtcMidnight(new Date()), 10),
      totalDays: 3,
      reason: "Family trip planned in advance.",
    },
    {
      employee: employees[1],
      leaveType: personalLeave,
      startDate: addDays(atUtcMidnight(new Date()), 5),
      endDate: addDays(atUtcMidnight(new Date()), 5),
      totalDays: 1,
      reason: "Personal appointment.",
    },
    {
      employee: employees[2],
      leaveType: sickLeave,
      startDate: addDays(atUtcMidnight(new Date()), 1),
      endDate: addDays(atUtcMidnight(new Date()), 2),
      totalDays: 2,
      reason: "Medical recovery time.",
    },
  ];

  for (const request of pendingRequests) {
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: request.employee.id,
        leaveTypeId: request.leaveType.id,
        status: "PENDING",
        reason: request.reason,
      },
      select: { id: true },
    });

    if (existingRequest) {
      await prisma.leaveRequest.update({
        where: { id: existingRequest.id },
        data: {
          startDate: request.startDate,
          endDate: request.endDate,
          totalDays: request.totalDays,
          reason: request.reason,
        },
      });
    } else {
      await prisma.leaveRequest.create({
        data: {
          employeeId: request.employee.id,
          leaveTypeId: request.leaveType.id,
          startDate: request.startDate,
          endDate: request.endDate,
          totalDays: request.totalDays,
          status: "PENDING",
          reason: request.reason,
        },
      });
    }
  }

  await prisma.companySettings.upsert({
    where: { id: "demo-company-settings" },
    update: {
      name: "Stafflow Demo Company",
      timezone: "America/New_York",
      locale: "en-US",
    },
    create: {
      id: "demo-company-settings",
      name: "Stafflow Demo Company",
      timezone: "America/New_York",
      locale: "en-US",
    },
  });

  await prisma.attendanceSettings.upsert({
    where: { id: "demo-attendance-settings" },
    update: {
      workdayMinutes: 480,
      lateGracePeriodMinutes: 10,
      allowEmployeeClockIn: true,
    },
    create: {
      id: "demo-attendance-settings",
      workdayMinutes: 480,
      lateGracePeriodMinutes: 10,
      allowEmployeeClockIn: true,
    },
  });

  await prisma.leaveSettings.upsert({
    where: { id: "demo-leave-settings" },
    update: {
      defaultAnnualAllowanceDays: 20,
      allowNegativeBalance: false,
    },
    create: {
      id: "demo-leave-settings",
      defaultAnnualAllowanceDays: 20,
      allowNegativeBalance: false,
    },
  });

  const userCount = await prisma.user.count();
  const employeeCount = await prisma.employee.count();
  const attendanceCount = await prisma.attendanceRecord.count();
  const pendingLeaveCount = await prisma.leaveRequest.count({
    where: { status: "PENDING" },
  });
  const payslipCount = await prisma.payslip.count();

  console.info(
    [
      "Demo seed complete.",
      `Demo password: ${demoPassword}`,
      `Users: ${userCount}`,
      `Employees: ${employeeCount}`,
      `Attendance records: ${attendanceCount}`,
      `Pending leave requests: ${pendingLeaveCount}`,
      `Payslips: ${payslipCount} (not seeded without real R2 objects)`,
    ].join("\n"),
  );
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
