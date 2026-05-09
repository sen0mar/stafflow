import type { AttendanceStatus } from "@prisma/client";

import { AppError } from "../../core/errors/app-error";
import {
  countActiveEmployees,
  countApprovedLeaveInRange,
  countPendingLeaveRequests,
  countTodayAttendanceByStatus,
  getAttendanceRecordsForRange,
  getCompanyTimezone,
  getDepartmentDistribution,
  getDepartmentsByIds,
  getEmployeeLatestPayslips,
  getEmployeeLeaveBalances,
  getEmployeeProfileSummary,
  getEmployeeRecentAttendance,
  getEmployeeRecentLeaveRequests,
  getEmployeeTodayAttendance,
  getPendingLeaveRequestPreview,
  getRecentEmployees,
  type DateRange,
} from "./dashboard.repository";

type AttendanceOverviewStatus = Lowercase<AttendanceStatus>;

interface ZonedDay {
  day: number;
  month: number;
  year: number;
}

const emptyAttendanceStatusCounts = {
  absent: 0,
  late: 0,
  partial: 0,
  present: 0,
} satisfies Record<AttendanceOverviewStatus, number>;

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const getFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

const toIso = (date: Date | null) => date?.toISOString() ?? null;

const toNumber = (value: { toString: () => string }) => Number(value.toString());

const getZonedParts = (date: Date, timeZone: string): ZonedDay => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => {
    const value = parts.find((part) => part.type === type)?.value;

    if (!value) {
      throw new Error(`Missing ${type} date part.`);
    }

    return Number(value);
  };

  return {
    day: getPart("day"),
    month: getPart("month"),
    year: getPart("year"),
  };
};

const getTimezoneOffsetMs = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.get("year")),
    Number(values.get("month")) - 1,
    Number(values.get("day")),
    Number(values.get("hour")),
    Number(values.get("minute")),
    Number(values.get("second")),
  );

  return asUtc - date.getTime();
};

const zonedDayToUtc = ({ day, month, year }: ZonedDay, timeZone: string) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day));
  const offsetMs = getTimezoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offsetMs);
};

const addDays = ({ day, month, year }: ZonedDay, amount: number): ZonedDay => {
  const nextDate = new Date(Date.UTC(year, month - 1, day + amount));

  return {
    day: nextDate.getUTCDate(),
    month: nextDate.getUTCMonth() + 1,
    year: nextDate.getUTCFullYear(),
  };
};

const dayKey = ({ day, month, year }: ZonedDay) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const getTodayRange = (timeZone: string) => {
  const today = getZonedParts(new Date(), timeZone);
  const tomorrow = addDays(today, 1);

  return {
    end: zonedDayToUtc(tomorrow, timeZone),
    start: zonedDayToUtc(today, timeZone),
    today,
  };
};

const getSevenDayRange = (today: ZonedDay, timeZone: string) => {
  const days = Array.from({ length: 7 }, (_item, index) =>
    addDays(today, index - 6),
  );
  const start = zonedDayToUtc(days[0], timeZone);
  const end = zonedDayToUtc(addDays(today, 1), timeZone);

  return {
    days,
    end,
    start,
  };
};

const statusToKey = (status: AttendanceStatus): AttendanceOverviewStatus =>
  status.toLowerCase() as AttendanceOverviewStatus;

const summarizeTodayPresentCount = (
  statusCounts: { status: AttendanceStatus; _count: { _all: number } }[],
) =>
  statusCounts.reduce((count, item) => {
    if (["PRESENT", "LATE", "PARTIAL"].includes(item.status)) {
      return count + item._count._all;
    }

    return count;
  }, 0);

export const getAdminDashboardSummary = async () => {
  const timeZone = await getCompanyTimezone();
  const todayRange = getTodayRange(timeZone);
  const sevenDayRange = getSevenDayRange(todayRange.today, timeZone);

  const [
    totalEmployees,
    todayAttendanceCounts,
    onLeaveToday,
    pendingLeaveRequests,
    attendanceRecords,
    recentEmployees,
    distribution,
    pendingPreview,
  ] = await Promise.all([
    countActiveEmployees(),
    countTodayAttendanceByStatus(todayRange),
    countApprovedLeaveInRange(todayRange),
    countPendingLeaveRequests(),
    getAttendanceRecordsForRange(sevenDayRange),
    getRecentEmployees(),
    getDepartmentDistribution(),
    getPendingLeaveRequestPreview(),
  ]);

  const departmentIds = distribution
    .map((item) => item.departmentId)
    .filter((id): id is string => Boolean(id));
  const departments = await getDepartmentsByIds(departmentIds);
  const departmentById = new Map(
    departments.map((department) => [department.id, department]),
  );
  const overviewByDate = new Map(
    sevenDayRange.days.map((day) => [
      dayKey(day),
      {
        ...emptyAttendanceStatusCounts,
        date: dayKey(day),
      },
    ]),
  );

  for (const record of attendanceRecords) {
    const key = dayKey(getZonedParts(record.date, timeZone));
    const overview = overviewByDate.get(key);

    if (overview) {
      overview[statusToKey(record.status)] += 1;
    }
  }

  return {
    attendanceOverview: [...overviewByDate.values()],
    departmentDistribution: distribution.map((item) => {
      const employeeCount = item._count._all;

      return {
        departmentId: item.departmentId ?? null,
        departmentName: item.departmentId
          ? departmentById.get(item.departmentId)?.name ?? "Unassigned"
          : "Unassigned",
        employeeCount,
        percentage:
          totalEmployees > 0 ? Math.round((employeeCount / totalEmployees) * 100) : 0,
      };
    }),
    onLeaveToday,
    pendingLeaveRequestPreview: pendingPreview.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      employeeName: getFullName(
        request.employee.firstName,
        request.employee.lastName,
      ),
      endDate: request.endDate.toISOString(),
      id: request.id,
      leaveTypeName: request.leaveType.name,
      startDate: request.startDate.toISOString(),
      totalDays: toNumber(request.totalDays),
    })),
    pendingLeaveRequests,
    presentToday: summarizeTodayPresentCount(todayAttendanceCounts),
    recentEmployees: recentEmployees.map((employee) => ({
      createdAt: employee.createdAt.toISOString(),
      departmentName: employee.department?.name ?? "Unassigned",
      id: employee.id,
      initials: getInitials(employee.firstName, employee.lastName),
      jobTitle: employee.jobTitle,
      name: getFullName(employee.firstName, employee.lastName),
      status: employee.status,
    })),
    totalEmployees,
  };
};

export const getEmployeeDashboardSummary = async (employeeId: string | null) => {
  if (!employeeId) {
    throw new AppError({
      code: "EMPLOYEE_PROFILE_REQUIRED",
      message: "An employee profile is required for dashboard access.",
      statusCode: 403,
    });
  }

  const timeZone = await getCompanyTimezone();
  const todayRange = getTodayRange(timeZone);
  const currentYear = todayRange.today.year;
  const [
    profile,
    todayAttendance,
    recentAttendance,
    leaveBalances,
    recentLeaveRequests,
    latestPayslips,
  ] = await Promise.all([
    getEmployeeProfileSummary(employeeId),
    getEmployeeTodayAttendance(employeeId, todayRange as DateRange),
    getEmployeeRecentAttendance(employeeId),
    getEmployeeLeaveBalances(employeeId, currentYear),
    getEmployeeRecentLeaveRequests(employeeId),
    getEmployeeLatestPayslips(employeeId),
  ]);

  if (!profile) {
    throw new AppError({
      code: "EMPLOYEE_PROFILE_NOT_FOUND",
      message: "Employee profile was not found.",
      statusCode: 404,
    });
  }

  return {
    latestPayslips: latestPayslips.map((payslip) => ({
      fileName: payslip.fileName,
      fileSize: payslip.fileSize,
      id: payslip.id,
      month: payslip.month,
      uploadedAt: payslip.uploadedAt.toISOString(),
      year: payslip.year,
    })),
    leaveBalanceSummary: leaveBalances.map((balance) => ({
      allocated: toNumber(balance.allocated),
      leaveTypeName: balance.leaveType.name,
      remaining: toNumber(balance.remaining),
      used: toNumber(balance.used),
      year: balance.year,
    })),
    profileSummary: {
      departmentName: profile.department?.name ?? "Unassigned",
      employeeCode: profile.employeeCode,
      employeeId: profile.id,
      hireDate: toIso(profile.hireDate),
      initials: getInitials(profile.firstName, profile.lastName),
      jobTitle: profile.jobTitle,
      name: getFullName(profile.firstName, profile.lastName),
    },
    recentAttendance: recentAttendance.map((record) => ({
      clockInAt: toIso(record.clockInAt),
      clockOutAt: toIso(record.clockOutAt),
      date: record.date.toISOString(),
      id: record.id,
      status: record.status,
      totalMinutes: record.totalMinutes,
    })),
    recentLeaveRequests: recentLeaveRequests.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      endDate: request.endDate.toISOString(),
      id: request.id,
      leaveTypeName: request.leaveType.name,
      startDate: request.startDate.toISOString(),
      status: request.status,
      totalDays: toNumber(request.totalDays),
    })),
    todayAttendanceState: todayAttendance
      ? {
          clockInAt: toIso(todayAttendance.clockInAt),
          clockOutAt: toIso(todayAttendance.clockOutAt),
          status: todayAttendance.status,
          totalMinutes: todayAttendance.totalMinutes,
        }
      : null,
  };
};
