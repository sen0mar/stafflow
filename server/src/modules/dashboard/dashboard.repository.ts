import type {
  AttendanceStatus,
  EmploymentStatus,
  LeaveRequestStatus,
} from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";

export interface DateRange {
  end: Date;
  start: Date;
}

const activeEmployeeWhere = {
  status: "ACTIVE" as EmploymentStatus,
};

export const getCompanyTimezone = async () => {
  const settings = await prisma.companySettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: { timezone: true },
  });

  return settings?.timezone ?? "UTC";
};

export const countActiveEmployees = () =>
  prisma.employee.count({
    where: activeEmployeeWhere,
  });

export const countTodayAttendanceByStatus = async ({ end, start }: DateRange) =>
  prisma.attendanceRecord.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: {
      date: {
        gte: start,
        lt: end,
      },
      employee: activeEmployeeWhere,
    },
  });

export const countApprovedLeaveInRange = ({ end, start }: DateRange) =>
  prisma.leaveRequest.count({
    where: {
      status: "APPROVED",
      startDate: { lt: end },
      endDate: { gte: start },
      employee: activeEmployeeWhere,
    },
  });

export const countPendingLeaveRequests = () =>
  prisma.leaveRequest.count({
    where: {
      status: "PENDING",
      employee: activeEmployeeWhere,
    },
  });

export const getAttendanceRecordsForRange = ({ end, start }: DateRange) =>
  prisma.attendanceRecord.findMany({
    orderBy: { date: "asc" },
    select: {
      date: true,
      status: true,
    },
    where: {
      date: {
        gte: start,
        lt: end,
      },
      employee: activeEmployeeWhere,
    },
  });

export const getRecentEmployees = (take = 5) =>
  prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      firstName: true,
      id: true,
      jobTitle: true,
      lastName: true,
      status: true,
      department: {
        select: {
          name: true,
        },
      },
    },
    take,
    where: activeEmployeeWhere,
  });

export const getDepartmentDistribution = async () =>
  prisma.employee.groupBy({
    by: ["departmentId"],
    _count: { _all: true },
    where: activeEmployeeWhere,
  });

export const getDepartmentsByIds = (ids: string[]) =>
  prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: { in: ids },
    },
  });

export const getPendingLeaveRequestPreview = (take = 5) =>
  prisma.leaveRequest.findMany({
    orderBy: [{ createdAt: "asc" }, { startDate: "asc" }],
    select: {
      createdAt: true,
      endDate: true,
      id: true,
      startDate: true,
      totalDays: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      leaveType: {
        select: {
          name: true,
        },
      },
    },
    take,
    where: {
      status: "PENDING" as LeaveRequestStatus,
      employee: activeEmployeeWhere,
    },
  });

export const getEmployeeProfileSummary = (employeeId: string) =>
  prisma.employee.findUnique({
    select: {
      department: {
        select: {
          name: true,
        },
      },
      employeeCode: true,
      firstName: true,
      hireDate: true,
      id: true,
      jobTitle: true,
      lastName: true,
    },
    where: { id: employeeId },
  });

export const getEmployeeTodayAttendance = (
  employeeId: string,
  { end, start }: DateRange,
) =>
  prisma.attendanceRecord.findFirst({
    orderBy: { date: "desc" },
    select: {
      clockInAt: true,
      clockOutAt: true,
      status: true,
      totalMinutes: true,
    },
    where: {
      date: {
        gte: start,
        lt: end,
      },
      employeeId,
    },
  });

export const getEmployeeRecentAttendance = (employeeId: string, take = 7) =>
  prisma.attendanceRecord.findMany({
    orderBy: { date: "desc" },
    select: {
      clockInAt: true,
      clockOutAt: true,
      date: true,
      id: true,
      status: true,
      totalMinutes: true,
    },
    take,
    where: { employeeId },
  });

export const getEmployeeLeaveBalances = (employeeId: string, year: number) =>
  prisma.leaveBalance.findMany({
    orderBy: {
      leaveType: {
        name: "asc",
      },
    },
    select: {
      allocated: true,
      remaining: true,
      used: true,
      year: true,
      leaveType: {
        select: {
          name: true,
        },
      },
    },
    where: {
      employeeId,
      year,
    },
  });

export const getEmployeeRecentLeaveRequests = (employeeId: string, take = 5) =>
  prisma.leaveRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      endDate: true,
      id: true,
      startDate: true,
      status: true,
      totalDays: true,
      leaveType: {
        select: {
          name: true,
        },
      },
    },
    take,
    where: { employeeId },
  });

export const getEmployeeLatestPayslips = (employeeId: string, take = 3) =>
  prisma.payslip.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      fileName: true,
      fileSize: true,
      id: true,
      month: true,
      uploadedAt: true,
      year: true,
    },
    take,
    where: {
      employeeId,
      status: "ACTIVE",
    },
  });

export type AttendanceStatusCount = {
  _count: {
    _all: number;
  };
  status: AttendanceStatus;
};
