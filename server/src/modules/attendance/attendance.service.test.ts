import type { AuthContext } from "../../core/auth/auth.types";
import type { AttendanceRecord } from "./attendance.repository";
import {
  createClockInRecord,
  findActiveAttendanceRecordForDay,
  findAttendanceRecordById,
  findAttendanceRecordForDay,
  getAttendanceSettings,
  getCompanyTimezone,
  getAttendanceUpdateData,
  updateAttendanceWithAuditLog,
  updateClockOutRecord,
} from "./attendance.repository";
import {
  clockInSelf,
  clockOutSelf,
  correctAttendance,
} from "./attendance.service";

vi.mock("./attendance.repository", () => ({
  createClockInRecord: vi.fn(),
  findActiveAttendanceRecordForDay: vi.fn(),
  findAttendanceRecordById: vi.fn(),
  findAttendanceRecordForDay: vi.fn(),
  getAttendanceSettings: vi.fn(),
  getAttendanceUpdateData: vi.fn((input: object) => input),
  getCompanyTimezone: vi.fn(),
  listAttendanceRecords: vi.fn(),
  listSelfAttendanceRecords: vi.fn(),
  updateAttendanceWithAuditLog: vi.fn(),
  updateClockOutRecord: vi.fn(),
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
    vi.mocked(getAttendanceSettings).mockResolvedValue({ workdayMinutes: 480 });
  });

  it("blocks duplicate active clock-ins", async () => {
    vi.mocked(findAttendanceRecordForDay).mockResolvedValue(attendanceRecord());

    await expect(clockInSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_ALREADY_CLOCKED_IN",
      statusCode: 409,
    });
    expect(createClockInRecord).not.toHaveBeenCalled();
  });

  it("blocks clock-out without an active clock-in", async () => {
    vi.mocked(findActiveAttendanceRecordForDay).mockResolvedValue(null);

    await expect(clockOutSelf(auth)).rejects.toMatchObject({
      code: "ATTENDANCE_NO_ACTIVE_CLOCK_IN",
      statusCode: 409,
    });
    expect(updateClockOutRecord).not.toHaveBeenCalled();
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
    vi.useRealTimers();
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
