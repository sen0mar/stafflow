import type { AttendanceStatus, LeaveRequestStatus } from "@prisma/client";

export const fixturePrefix = "stafflow-demo-v2";
export const companyTimezone = "UTC";
export const departments = [
  "Engineering",
  "Marketing",
  "Human Resources",
  "Finance",
  "Operations",
];
export const leaveTypes = [
  { name: "Annual Leave", annualAllowance: 20, isPaid: true },
  { name: "Sick Leave", annualAllowance: 10, isPaid: true },
  { name: "Personal Leave", annualAllowance: 5, isPaid: true },
  { name: "Casual Leave", annualAllowance: 6, isPaid: true },
];
const people = [
  ["Maya", "Rivers", "Frontend Engineer"],
  ["Liam", "Chen", "Marketing Manager"],
  ["Sofia", "Patel", "People Operations Specialist"],
  ["Noah", "Brooks", "Financial Analyst"],
  ["Ava", "Morgan", "Operations Coordinator"],
  ["Ethan", "Walker", "Platform Engineer"],
  ["Isla", "Bennett", "Content Strategist"],
  ["Oliver", "Reed", "Talent Partner"],
  ["Amelia", "Foster", "Payroll Specialist"],
  ["Lucas", "Hayes", "Office Manager"],
  ["Zoe", "Carter", "Product Designer"],
  ["Leo", "Santos", "Growth Analyst"],
  ["Nora", "Ellis", "People Coordinator"],
  ["Oscar", "Kim", "Accounts Specialist"],
  ["Freya", "Cole", "Project Coordinator"],
];
export const employees = people.map(
  ([firstName, lastName, jobTitle], index) => ({
    firstName,
    lastName,
    jobTitle,
    email:
      index === 0
        ? "employee.demo@example.com"
        : `${firstName.toLowerCase()}.${["engineering", "marketing", "hr", "finance", "operations"][index % 5]}.demo@example.com`,
    employeeCode: `${index < 5 ? "EMP" : "EMP-DEMO"}-${String(index + 1).padStart(3, "0")}`,
    departmentName: departments[index % 5],
    phone: `+1 202 555 ${String(100 + index).padStart(4, "0")}`,
    hireDate: new Date(Date.UTC(2021 + (index % 4), index % 12, 3)),
    status:
      index === 13
        ? ("INACTIVE" as const)
        : index === 14
          ? ("TERMINATED" as const)
          : ("ACTIVE" as const),
    userStatus:
      index === 12
        ? ("INVITED" as const)
        : index >= 13
          ? ("DISABLED" as const)
          : ("ACTIVE" as const),
  }),
);
export const midnight = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
export const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 86_400_000);
export const at = (date: Date, hour: number, minute = 0) =>
  new Date(date.getTime() + (hour * 60 + minute) * 60_000);
export const dateKey = (date: Date) => date.toISOString().slice(0, 10);

// All fixture schedules use the fictional company's UTC timezone, including DST boundaries.
export const attendanceFixtures = (now: Date, employeeIndex: number) => {
  const today = midnight(now);
  const records = [];
  for (let offset = -55; offset <= 0; offset++) {
    const date = addDays(today, offset);
    if ([0, 6].includes(date.getUTCDay())) continue;
    const pattern = (employeeIndex * 3 + offset + 63) % 17;
    const status: AttendanceStatus =
      pattern === 0
        ? "ABSENT"
        : pattern === 4
          ? "LATE"
          : pattern === 8
            ? "PARTIAL"
            : "PRESENT";
    let clockInAt =
      status === "ABSENT" ? null : at(date, 9, status === "LATE" ? 24 : 0);
    let clockOutAt = clockInAt
      ? at(
          date,
          status === "PARTIAL" ? 13 : status === "LATE" ? 17 : 17,
          status === "LATE" ? 24 : 0,
        )
      : null;
    if (offset === 0) {
      if (now < at(date, 9)) continue;
      clockInAt = pattern === 0 ? null : at(date, 9);
      clockOutAt = clockInAt && now >= at(date, 17) ? at(date, 17) : null;
    }
    records.push({
      date,
      clockInAt,
      clockOutAt,
      totalMinutes:
        clockInAt && clockOutAt
          ? Math.round((clockOutAt.getTime() - clockInAt.getTime()) / 60_000)
          : null,
      status:
        offset === 0
          ? clockInAt
            ? ("PRESENT" as const)
            : ("ABSENT" as const)
          : status,
      source: "SYSTEM" as const,
      notes:
        status === "ABSENT"
          ? "Unplanned absence recorded by people operations."
          : status === "PARTIAL"
            ? "Early departure for a personal appointment."
            : status === "LATE"
              ? "Transport delay; hours completed later in the day."
              : null,
    });
  }
  return records;
};

export const leaveFixtures = (now: Date, employeeIndex: number) => {
  const year = now.getUTCFullYear();
  const today = midnight(now);
  // Bound the anchor away from year edges so every request stays within one year.
  const anchor = new Date(
    Math.min(
      Math.max(today.getTime(), Date.UTC(year, 0, 25)),
      Date.UTC(year, 11, 10),
    ),
  );
  const specs: {
    status: LeaveRequestStatus;
    offset: number;
    days: number;
    type: string;
    reason: string;
    note?: string;
  }[] = [
    {
      status: "APPROVED",
      offset: -21,
      days: 2,
      type: "Annual Leave",
      reason: "A long weekend with family.",
      note: "Coverage arranged with the team.",
    },
    {
      status: "APPROVED",
      offset: -12,
      days: 1,
      type: "Sick Leave",
      reason: "Recovery day.",
      note: "Wishing you a smooth recovery.",
    },
    {
      status: "REJECTED",
      offset: 2,
      days: 2,
      type: "Annual Leave",
      reason: "Short break during the release week.",
      note: "Please choose dates outside the launch coverage period.",
    },
    {
      status: "CANCELLED",
      offset: 5,
      days: 1,
      type: "Personal Leave",
      reason: "Appointment rescheduled.",
    },
    {
      status: "PENDING",
      offset: 8,
      days: 3,
      type: "Annual Leave",
      reason: "Family trip planned in advance.",
    },
  ];
  return specs.map((spec, slot) => {
    const startDate = addDays(anchor, spec.offset);
    return {
      id: `${fixturePrefix}-leave-${year}-${employeeIndex}-${slot}`,
      employeeIndex,
      leaveTypeName: spec.type,
      startDate,
      endDate: addDays(startDate, spec.days - 1),
      totalDays: spec.days,
      status: spec.status,
      reason: spec.reason,
      createdAt: addDays(startDate, -20),
      reviewedAt: ["APPROVED", "REJECTED"].includes(spec.status)
        ? new Date(Math.min(addDays(startDate, -10).getTime(), now.getTime()))
        : null,
      reviewNote: spec.note ?? null,
    };
  });
};
export const payslipPeriods = (now: Date) =>
  Array.from({ length: 3 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index - 1, 1),
    );
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });
