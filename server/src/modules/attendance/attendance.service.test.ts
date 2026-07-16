import { Prisma } from "@prisma/client";

import type { AuthContext } from "../../core/auth/auth.types";
import { getCompanyTimezone } from "../settings/settings.repository";
import type { AttendanceRecord } from "./attendance.repository";
import {
  createClockInRecord,
  findActiveAttendanceRecordForDay,
  findAttendanceRecordById,
  findAttendanceRecordForDay,
  getAttendanceUpdateData,
  getSelfClockActionContext,
  updateAttendanceWithAuditLog,
  updateClockOutRecord,
} from "./attendance.repository";
import {
  clockInSelf,
  clockOutSelf,
  correctAttendance,
  getSelfTodayAttendance,
} from "./attendance.service";

vi.mock("./attendance.repository", () => ({
  createClockInRecord: vi.fn(),
  findActiveAttendanceRecordForDay: vi.fn(),
  findAttendanceRecordById: vi.fn(),
  findAttendanceRecordForDay: vi.fn(),
  getAttendanceUpdateData: vi.fn((input: object) => input),
  getSelfClockActionContext: vi.fn(),
  listAttendanceRecords: vi.fn(),
  listSelfAttendanceRecords: vi.fn(),
  updateAttendanceWithAuditLog: vi.fn(),
  updateClockOutRecord: vi.fn(),
}));

vi.mock("../settings/settings.repository", () => ({
  getCompanyTimezone: vi.fn(),
}));

const auth: AuthContext = {
  employeeId: "employee-1",
  permissions: ["attendance:clock:self"],
  role: "EMPLOYEE",
  sessionId: "session-1",
  user: {
    email: "employee@example.com",
    employee: { firstName: "Maya", id: "employee-1", lastName: "Rivers" },
    employeeId: "employee-1",
    id: "user-1",
    role: "EMPLOYEE",
    status: "ACTIVE",
  },
  userId: "user-1",
};

const attendanceRecord = (
  overrides: Partial<AttendanceRecord> = {},
): AttendanceRecord => ({
  clockInAt: new Date("2026-05-13T09:00:00.000Z"),
  clockOutAt: null,
  createdAt: new Date("2026-05-13T09:00:00.000Z"),
  date: new Date("2026-05-13T00:00:00.000Z"),
  employee: {
    department: { id: "department-1", name: "Engineering" },
    employeeCode: "EMP-001",
    firstName: "Maya",
    id: "employee-1",
    lastName: "Rivers",
  },
  employeeId: "employee-1",
  id: "attendance-1",
  notes: null,
  source: "SELF",
  status: "PRESENT",
  totalMinutes: null,
  updatedAt: new Date("2026-05-13T09:00:00.000Z"),
  ...overrides,
});

describe("attendance.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCompanyTimezone).mockResolvedValue("UTC");
    vi.mocked(getSelfClockActionContext).mockResolvedValue({
      allowEmployeeClockIn: true,
      employeeStatus: "ACTIVE",
      lateGracePeriodMinutes: 10,
      timeZone: "UTC",
      weeklyWorkingDays: [1, 2, 3, 4, 5],
      workdayEnd: "17:00",
      workdayMinutes: 480,
      workdayStart: "09:00",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the attendance calendar date as YYYY-MM-DD", async () => {
    vi.mocked(findAttendanceRecordForDay).mockResolvedValue(attendanceRecord());

    await expect(getSelfTodayAttendance(auth)).resolves.toMatchObject({
      date: "2026-05-13",
    });
  });

  it("maps the unique employee/day clock-in conflict to 409", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T09:00:00.000Z"));
    vi.mocked(createClockInRecord).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "7.8.0",
        code: "P2002",
      }),
    );

    await expect(clockInSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_ALREADY_RECORDED",
      statusCode: 409,
    });
    expect(findAttendanceRecordForDay).not.toHaveBeenCalled();
  });

  it.each([
    ["INACTIVE", "ATTENDANCE_EMPLOYEE_INACTIVE"],
    ["TERMINATED", "ATTENDANCE_EMPLOYEE_INACTIVE"],
  ] as const)(
    "blocks %s employees from self clock-in",
    async (status, code) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-05-13T09:00:00.000Z"));
      vi.mocked(getSelfClockActionContext).mockResolvedValue({
        allowEmployeeClockIn: true,
        employeeStatus: status,
        lateGracePeriodMinutes: 10,
        timeZone: "UTC",
        weeklyWorkingDays: [1, 2, 3, 4, 5],
        workdayEnd: "17:00",
        workdayMinutes: 480,
        workdayStart: "09:00",
      });

      await expect(clockInSelf(auth)).rejects.toMatchObject({ code });
      expect(createClockInRecord).not.toHaveBeenCalled();
    },
  );

  it("enforces disabled employee clock-in", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T09:00:00.000Z"));
    vi.mocked(getSelfClockActionContext).mockResolvedValue({
      allowEmployeeClockIn: false,
      employeeStatus: "ACTIVE",
      lateGracePeriodMinutes: 10,
      timeZone: "UTC",
      weeklyWorkingDays: [1, 2, 3, 4, 5],
      workdayEnd: "17:00",
      workdayMinutes: 480,
      workdayStart: "09:00",
    });

    await expect(clockInSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_CLOCK_IN_DISABLED",
    });
  });

  it("enforces company-local working days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-17T09:00:00.000Z"));

    await expect(clockInSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_NON_WORKING_DAY",
    });
  });

  it("marks clock-in late only after the company-local grace boundary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T13:10:00.000Z"));
    vi.mocked(getSelfClockActionContext).mockResolvedValue({
      allowEmployeeClockIn: true,
      employeeStatus: "ACTIVE",
      lateGracePeriodMinutes: 10,
      timeZone: "America/New_York",
      weeklyWorkingDays: [3],
      workdayEnd: "17:00",
      workdayMinutes: 480,
      workdayStart: "09:00",
    });
    vi.mocked(createClockInRecord).mockResolvedValue(attendanceRecord());

    await clockInSelf(auth);
    expect(createClockInRecord).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "PRESENT" }),
    );

    vi.setSystemTime(new Date("2026-05-13T13:11:00.000Z"));
    vi.mocked(createClockInRecord).mockResolvedValue(
      attendanceRecord({ status: "LATE" }),
    );
    await clockInSelf(auth);
    expect(createClockInRecord).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "LATE" }),
    );
  });

  it("blocks clock-out without an active clock-in", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T13:00:00.000Z"));
    vi.mocked(findActiveAttendanceRecordForDay).mockResolvedValue(null);

    await expect(clockOutSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_NO_ACTIVE_CLOCK_IN",
      statusCode: 409,
    });
    expect(updateClockOutRecord).not.toHaveBeenCalled();
  });

  it("blocks inactive employees from self clock-out", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T17:00:00.000Z"));
    vi.mocked(getSelfClockActionContext).mockResolvedValue({
      allowEmployeeClockIn: true,
      employeeStatus: "INACTIVE",
      lateGracePeriodMinutes: 10,
      timeZone: "UTC",
      weeklyWorkingDays: [1, 2, 3, 4, 5],
      workdayEnd: "17:00",
      workdayMinutes: 480,
      workdayStart: "09:00",
    });

    await expect(clockOutSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_EMPLOYEE_INACTIVE",
    });
    expect(findActiveAttendanceRecordForDay).not.toHaveBeenCalled();
  });

  it("records clock-out totals and status from configured workday length", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T13:00:00.000Z"));
    vi.mocked(findActiveAttendanceRecordForDay).mockResolvedValue(
      attendanceRecord({
        clockInAt: new Date("2026-05-13T09:00:00.000Z"),
      }),
    );
    vi.mocked(updateClockOutRecord).mockResolvedValue(
      attendanceRecord({
        clockOutAt: new Date("2026-05-13T13:00:00.000Z"),
        status: "PARTIAL",
        totalMinutes: 240,
      }),
    );

    await clockOutSelf(auth);

    expect(updateClockOutRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "attendance-1",
        status: "PARTIAL",
        totalMinutes: 240,
      }),
    );
  });

  it("marks an early clock-out partial even when required minutes are met", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T16:30:00.000Z"));
    vi.mocked(getSelfClockActionContext).mockResolvedValue({
      allowEmployeeClockIn: false,
      employeeStatus: "ACTIVE",
      lateGracePeriodMinutes: 10,
      timeZone: "UTC",
      weeklyWorkingDays: [1, 2, 3, 4, 5],
      workdayEnd: "17:00",
      workdayMinutes: 450,
      workdayStart: "09:00",
    });
    vi.mocked(findActiveAttendanceRecordForDay).mockResolvedValue(
      attendanceRecord({
        clockInAt: new Date("2026-05-13T09:00:00.000Z"),
      }),
    );
    vi.mocked(updateClockOutRecord).mockResolvedValue(
      attendanceRecord({ status: "PARTIAL" }),
    );

    await clockOutSelf(auth);

    expect(updateClockOutRecord).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PARTIAL", totalMinutes: 450 }),
    );
  });

  it("gives partial precedence over a late clock-in", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T17:00:00.000Z"));
    vi.mocked(findActiveAttendanceRecordForDay).mockResolvedValue(
      attendanceRecord({
        clockInAt: new Date("2026-05-13T10:00:00.000Z"),
        status: "LATE",
      }),
    );
    vi.mocked(updateClockOutRecord).mockResolvedValue(
      attendanceRecord({ status: "PARTIAL" }),
    );

    await clockOutSelf(auth);

    expect(updateClockOutRecord).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PARTIAL", totalMinutes: 420 }),
    );
  });

  it("preserves late when required time and scheduled end are satisfied", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T18:30:00.000Z"));
    vi.mocked(findActiveAttendanceRecordForDay).mockResolvedValue(
      attendanceRecord({
        clockInAt: new Date("2026-05-13T10:30:00.000Z"),
        status: "LATE",
      }),
    );
    vi.mocked(updateClockOutRecord).mockResolvedValue(
      attendanceRecord({ status: "LATE" }),
    );

    await clockOutSelf(auth);

    expect(updateClockOutRecord).toHaveBeenCalledWith(
      expect.objectContaining({ status: "LATE", totalMinutes: 480 }),
    );
  });

  it("maps a stale conditional clock-out to 409", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T17:00:00.000Z"));
    vi.mocked(findActiveAttendanceRecordForDay).mockResolvedValue(
      attendanceRecord(),
    );
    vi.mocked(updateClockOutRecord).mockResolvedValue(null);

    await expect(clockOutSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_ALREADY_CLOCKED_OUT",
      statusCode: 409,
    });
  });

  it("rejects admin corrections where clock-out precedes clock-in", async () => {
    vi.mocked(findAttendanceRecordById).mockResolvedValue(attendanceRecord());

    await expect(
      correctAttendance(
        "attendance-1",
        {
          clockInAt: "2026-05-13T17:00:00.000Z",
          clockOutAt: "2026-05-13T09:00:00.000Z",
        },
        { actorUserId: "admin-1" },
      ),
    ).rejects.toMatchObject({
      code: "ATTENDANCE_INVALID_TIME_RANGE",
      statusCode: 422,
    });
    expect(getAttendanceUpdateData).not.toHaveBeenCalled();
    expect(updateAttendanceWithAuditLog).not.toHaveBeenCalled();
  });
});
