import type { AttendanceStatus } from "@prisma/client";

import { AppError } from "../../core/errors/app-error";
import { getCompanyDateRange } from "../../core/utils/company-day";
import { formatDateOnly } from "../../core/utils/date-only";
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
} from "./dashboard.repository";

type AttendanceOverviewStatus = Lowercase<AttendanceStatus>;

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

const toNumber = (value: { toString: () => string }) =>
  Number(value.toString());

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
  const sevenDayRange = getCompanyDateRange(new Date(), timeZone, 7);

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
    countTodayAttendanceByStatus(sevenDayRange),
    countApprovedLeaveInRange(sevenDayRange),
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
    sevenDayRange.dateKeys.map((date) => [
      date,
      {
        ...emptyAttendanceStatusCounts,
        date,
      },
    ]),
  );

  for (const record of attendanceRecords) {
    const key = formatDateOnly(record.date);
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
          ? (departmentById.get(item.departmentId)?.name ?? "Unassigned")
          : "Unassigned",
        employeeCount,
        percentage:
          totalEmployees > 0
            ? Math.round((employeeCount / totalEmployees) * 100)
            : 0,
      };
    }),
    onLeaveToday,
    pendingLeaveRequestPreview: pendingPreview.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      employeeName: getFullName(
        request.employee.firstName,
        request.employee.lastName,
      ),
      endDate: formatDateOnly(request.endDate),
      id: request.id,
      leaveTypeName: request.leaveType.name,
      startDate: formatDateOnly(request.startDate),
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

export const getEmployeeDashboardSummary = async (
  employeeId: string | null,
) => {
  if (!employeeId) {
    throw new AppError({
      code: "EMPLOYEE_PROFILE_REQUIRED",
      message: "An employee profile is required for dashboard access.",
      statusCode: 403,
    });
  }

  const timeZone = await getCompanyTimezone();
  const todayRange = getCompanyDateRange(new Date(), timeZone, 1);
  const currentYear = todayRange.today.getUTCFullYear();
  const [
    profile,
    todayAttendance,
    recentAttendance,
    leaveBalances,
    recentLeaveRequests,
    latestPayslips,
  ] = await Promise.all([
    getEmployeeProfileSummary(employeeId),
    getEmployeeTodayAttendance(employeeId, todayRange),
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
      hireDate: profile.hireDate ? formatDateOnly(profile.hireDate) : null,
      initials: getInitials(profile.firstName, profile.lastName),
      jobTitle: profile.jobTitle,
      name: getFullName(profile.firstName, profile.lastName),
    },
    recentAttendance: recentAttendance.map((record) => ({
      clockInAt: toIso(record.clockInAt),
      clockOutAt: toIso(record.clockOutAt),
      date: formatDateOnly(record.date),
      id: record.id,
      status: record.status,
      totalMinutes: record.totalMinutes,
    })),
    recentLeaveRequests: recentLeaveRequests.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      endDate: formatDateOnly(request.endDate),
      id: request.id,
      leaveTypeName: request.leaveType.name,
      startDate: formatDateOnly(request.startDate),
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
