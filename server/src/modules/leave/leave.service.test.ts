import { Prisma } from "@prisma/client";

import type { AuthContext } from "../../core/auth/auth.types";
import type { LeaveRequestRecord } from "./leave.repository";
import {
  approveLeaveRequestWithBalance,
  cancelLeaveRequestAtomically,
  createLeaveRequestAtomically,
  LeaveMutationError,
  rejectLeaveRequestAtomically,
} from "./leave.repository";
import {
  approveLeaveRequest,
  cancelSelfLeaveRequest,
  createSelfLeaveRequest,
  rejectLeaveRequest,
} from "./leave.service";

vi.mock("./leave.repository", async (importOriginal) => {
  const repository =
    await importOriginal<typeof import("./leave.repository")>();

  return {
    ...repository,
    approveLeaveRequestWithBalance: vi.fn(),
    cancelLeaveRequestAtomically: vi.fn(),
    createLeaveRequestAtomically: vi.fn(),
    rejectLeaveRequestAtomically: vi.fn(),
  };
});

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
  });

  it("rejects self leave requests with an inactive leave type", async () => {
    vi.mocked(createLeaveRequestAtomically).mockRejectedValue(
      new LeaveMutationError("LEAVE_TYPE_INACTIVE"),
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
    expect(createLeaveRequestAtomically).toHaveBeenCalledOnce();
  });

  it("rejects self leave requests with invalid date ranges", async () => {
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
    expect(createLeaveRequestAtomically).not.toHaveBeenCalled();
  });

  it("blocks approving requests that are already approved", async () => {
    vi.mocked(approveLeaveRequestWithBalance).mockRejectedValue(
      new LeaveMutationError("LEAVE_REQUEST_NOT_APPROVABLE"),
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
    expect(approveLeaveRequestWithBalance).toHaveBeenCalledOnce();
  });

  it("maps insufficient leave balance errors to an app error", async () => {
    vi.mocked(approveLeaveRequestWithBalance).mockRejectedValue(
      new LeaveMutationError("INSUFFICIENT_LEAVE_BALANCE"),
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

  it("delegates rejection status and balance handling to one atomic mutation", async () => {
    vi.mocked(rejectLeaveRequestAtomically).mockResolvedValue(
      leaveRequest({ status: "REJECTED" }),
    );

    await rejectLeaveRequest(
      "leave-request-1",
      { reviewNote: "changed" },
      { actorUserId: "admin-1" },
    );

    expect(rejectLeaveRequestAtomically).toHaveBeenCalledWith({
      actorUserId: "admin-1",
      entityId: "leave-request-1",
      reviewNote: "changed",
    });
  });

  it("maps a stale cancellation to the existing pending conflict", async () => {
    vi.mocked(cancelLeaveRequestAtomically).mockRejectedValue(
      new LeaveMutationError("LEAVE_REQUEST_STALE_TRANSITION"),
    );

    await expect(
      cancelSelfLeaveRequest(auth, "leave-request-1"),
    ).rejects.toMatchObject({
      code: "LEAVE_REQUEST_NOT_PENDING",
      statusCode: 409,
    });
  });
});
