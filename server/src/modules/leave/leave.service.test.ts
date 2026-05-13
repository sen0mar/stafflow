import { Prisma } from "@prisma/client";

import type { AuthContext } from "../../core/auth/auth.types";
import type { LeaveRequestRecord, LeaveTypeRecord } from "./leave.repository";
import {
  approveLeaveRequestWithBalance,
  createLeaveRequest,
  findLeaveRequestById,
  findLeaveTypeById,
  findOverlappingLeaveRequest,
  getLeaveSettings,
  rejectApprovedLeaveRequestWithBalance,
  rejectLeaveRequestWithAuditLog,
} from "./leave.repository";
import {
  approveLeaveRequest,
  createSelfLeaveRequest,
  rejectLeaveRequest,
} from "./leave.service";

vi.mock("./leave.repository", () => ({
  approveLeaveRequestWithBalance: vi.fn(),
  cancelLeaveRequest: vi.fn(),
  countLeaveTypeUsage: vi.fn(),
  createLeaveRequest: vi.fn(),
  createLeaveType: vi.fn(),
  createLeaveTypeAuditLog: vi.fn(),
  deleteLeaveType: vi.fn(),
  findLeaveRequestById: vi.fn(),
  findLeaveTypeById: vi.fn(),
  findLeaveTypeByName: vi.fn(),
  findOverlappingLeaveRequest: vi.fn(),
  getLeaveSettings: vi.fn(),
  listLeaveBalancesForEmployee: vi.fn(),
  listLeaveRequests: vi.fn(),
  listLeaveTypes: vi.fn(),
  listSelfLeaveRequests: vi.fn(),
  rejectApprovedLeaveRequestWithBalance: vi.fn(),
  rejectLeaveRequestWithAuditLog: vi.fn(),
  updateLeaveType: vi.fn(),
}));

const auth: AuthContext = {
  employeeId: "employee-1",
  permissions: ["leave:create:self"],
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

const leaveType = (
  overrides: Partial<LeaveTypeRecord> = {},
): LeaveTypeRecord => ({
  _count: { leaveBalances: 0, leaveRequests: 0 },
  annualAllowance: new Prisma.Decimal(20),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  description: null,
  id: "leave-type-1",
  isActive: true,
  isPaid: true,
  name: "Annual Leave",
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const leaveRequest = (
  overrides: Partial<LeaveRequestRecord> = {},
): LeaveRequestRecord => ({
  createdAt: new Date("2026-05-01T00:00:00.000Z"),
  employee: {
    department: { id: "department-1", name: "Engineering" },
    employeeCode: "EMP-001",
    firstName: "Maya",
    id: "employee-1",
    lastName: "Rivers",
  },
  employeeId: "employee-1",
  endDate: new Date("2026-05-12T00:00:00.000Z"),
  id: "leave-request-1",
  leaveType: { id: "leave-type-1", isPaid: true, name: "Annual Leave" },
  leaveTypeId: "leave-type-1",
  reason: null,
  reviewedAt: null,
  reviewedBy: null,
  reviewedById: null,
  reviewNote: null,
  startDate: new Date("2026-05-10T00:00:00.000Z"),
  status: "PENDING",
  totalDays: new Prisma.Decimal(3),
  updatedAt: new Date("2026-05-01T00:00:00.000Z"),
  ...overrides,
});

describe("leave.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLeaveSettings).mockResolvedValue({
      allowNegativeBalance: false,
      defaultAnnualAllowanceDays: new Prisma.Decimal(20),
    });
  });

  it("rejects self leave requests with an inactive leave type", async () => {
    vi.mocked(findLeaveTypeById).mockResolvedValue(
      leaveType({ isActive: false }),
    );

    await expect(
      createSelfLeaveRequest(auth, {
        endDate: "2026-05-12",
        leaveTypeId: "leave-type-1",
        reason: "Rest",
        startDate: "2026-05-10",
      }),
    ).rejects.toMatchObject({
      code: "LEAVE_TYPE_INACTIVE",
      statusCode: 422,
    });
    expect(createLeaveRequest).not.toHaveBeenCalled();
  });

  it("rejects self leave requests with invalid date ranges", async () => {
    vi.mocked(findLeaveTypeById).mockResolvedValue(leaveType());

    await expect(
      createSelfLeaveRequest(auth, {
        endDate: "2026-05-09",
        leaveTypeId: "leave-type-1",
        reason: "Rest",
        startDate: "2026-05-10",
      }),
    ).rejects.toMatchObject({
      code: "LEAVE_INVALID_DATE_RANGE",
      statusCode: 422,
    });
    expect(findOverlappingLeaveRequest).not.toHaveBeenCalled();
  });

  it("blocks approving requests that are already approved", async () => {
    vi.mocked(findLeaveRequestById).mockResolvedValue(
      leaveRequest({ status: "APPROVED" }),
    );

    await expect(
      approveLeaveRequest(
        "leave-request-1",
        { reviewNote: "ok" },
        { actorUserId: "admin-1" },
      ),
    ).rejects.toMatchObject({
      code: "LEAVE_REQUEST_NOT_APPROVABLE",
      statusCode: 409,
    });
    expect(approveLeaveRequestWithBalance).not.toHaveBeenCalled();
  });

  it("maps insufficient leave balance errors to an app error", async () => {
    vi.mocked(findLeaveRequestById).mockResolvedValue(leaveRequest());
    vi.mocked(findOverlappingLeaveRequest).mockResolvedValue(null);
    vi.mocked(findLeaveTypeById).mockResolvedValue(leaveType());
    vi.mocked(approveLeaveRequestWithBalance).mockRejectedValue(
      new Error("INSUFFICIENT_LEAVE_BALANCE"),
    );

    await expect(
      approveLeaveRequest(
        "leave-request-1",
        { reviewNote: "ok" },
        { actorUserId: "admin-1" },
      ),
    ).rejects.toMatchObject({
      code: "LEAVE_BALANCE_INSUFFICIENT",
      statusCode: 409,
    });
  });

  it("routes rejection of approved leave through balance reversal", async () => {
    const approved = leaveRequest({ status: "APPROVED" });
    vi.mocked(findLeaveRequestById).mockResolvedValue(approved);
    vi.mocked(rejectApprovedLeaveRequestWithBalance).mockResolvedValue(
      leaveRequest({ status: "REJECTED" }),
    );

    await rejectLeaveRequest(
      "leave-request-1",
      { reviewNote: "changed" },
      { actorUserId: "admin-1" },
    );

    expect(rejectApprovedLeaveRequestWithBalance).toHaveBeenCalled();
    expect(rejectLeaveRequestWithAuditLog).not.toHaveBeenCalled();
  });
});
