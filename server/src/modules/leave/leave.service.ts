import { Prisma } from "@prisma/client";

import type { AuthContext } from "../../core/auth/auth.types";
import { AppError } from "../../core/errors/app-error";
import {
  getPaginationMeta,
  getPaginationParams,
  toPaginatedResult,
} from "../../core/pagination/pagination";
import { getSelfLeaveEmployeeId } from "./leave.policy";
import {
  approveLeaveRequestWithBalance,
  cancelLeaveRequest,
  countLeaveTypeUsage,
  createLeaveRequest,
  createLeaveType,
  createLeaveTypeAuditLog,
  deleteLeaveType,
  findLeaveRequestById,
  findLeaveTypeById,
  findLeaveTypeByName,
  findOverlappingLeaveRequest,
  getLeaveSettings,
  listLeaveBalancesForEmployee,
  listLeaveRequests,
  listLeaveTypes,
  listSelfLeaveRequests,
  rejectLeaveRequestWithAuditLog,
  rejectApprovedLeaveRequestWithBalance,
  updateLeaveType,
  type LeaveBalanceRecord,
  type LeaveRequestRecord,
  type LeaveTypeRecord,
} from "./leave.repository";
import type {
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  ListLeaveRequestsInput,
  ListLeaveTypesInput,
  ListSelfLeaveRequestsInput,
  ReviewLeaveRequestInput,
  UpdateLeaveTypeInput,
} from "./leave.schema";

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

const millisecondsPerDay = 86_400_000;

const atUtcMidnight = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

const calculateTotalDays = (startDate: Date, endDate: Date) =>
  Math.floor((endDate.getTime() - startDate.getTime()) / millisecondsPerDay) + 1;

const getFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

const decimalToNumber = (value: Prisma.Decimal | number | null) =>
  value === null ? null : Number(value);

const toLeaveTypeDto = (leaveType: LeaveTypeRecord) => ({
  annualAllowance: decimalToNumber(leaveType.annualAllowance),
  createdAt: leaveType.createdAt.toISOString(),
  description: leaveType.description,
  id: leaveType.id,
  isActive: leaveType.isActive,
  isPaid: leaveType.isPaid,
  leaveBalanceCount: leaveType._count.leaveBalances,
  leaveRequestCount: leaveType._count.leaveRequests,
  name: leaveType.name,
  updatedAt: leaveType.updatedAt.toISOString(),
});

const toLeaveRequestDto = (leaveRequest: LeaveRequestRecord) => ({
  createdAt: leaveRequest.createdAt.toISOString(),
  employee: {
    department: leaveRequest.employee.department,
    employeeCode: leaveRequest.employee.employeeCode,
    fullName: getFullName(
      leaveRequest.employee.firstName,
      leaveRequest.employee.lastName,
    ),
    id: leaveRequest.employee.id,
  },
  employeeId: leaveRequest.employeeId,
  endDate: leaveRequest.endDate.toISOString(),
  id: leaveRequest.id,
  leaveType: leaveRequest.leaveType,
  leaveTypeId: leaveRequest.leaveTypeId,
  reason: leaveRequest.reason,
  reviewedAt: leaveRequest.reviewedAt?.toISOString() ?? null,
  reviewedBy: leaveRequest.reviewedBy,
  reviewedById: leaveRequest.reviewedById,
  reviewNote: leaveRequest.reviewNote,
  startDate: leaveRequest.startDate.toISOString(),
  status: leaveRequest.status,
  totalDays: Number(leaveRequest.totalDays),
  updatedAt: leaveRequest.updatedAt.toISOString(),
});

const toLeaveBalanceDto = (balance: LeaveBalanceRecord) => ({
  allocated: Number(balance.allocated),
  employeeId: balance.employeeId,
  id: balance.id,
  leaveType: balance.leaveType,
  leaveTypeId: balance.leaveTypeId,
  remaining: Number(balance.remaining),
  used: Number(balance.used),
  year: balance.year,
});

const assertLeaveTypeExists = async (id: string) => {
  const leaveType = await findLeaveTypeById(id);

  if (!leaveType) {
    throw new AppError({
      code: "LEAVE_TYPE_NOT_FOUND",
      message: "Leave type was not found.",
      statusCode: 404,
    });
  }

  return leaveType;
};

const assertLeaveRequestExists = async (id: string) => {
  const leaveRequest = await findLeaveRequestById(id);

  if (!leaveRequest) {
    throw new AppError({
      code: "LEAVE_REQUEST_NOT_FOUND",
      message: "Leave request was not found.",
      statusCode: 404,
    });
  }

  return leaveRequest;
};

const assertUniqueLeaveTypeName = async (name: string, currentId?: string) => {
  const existingLeaveType = await findLeaveTypeByName(name);

  if (existingLeaveType && existingLeaveType.id !== currentId) {
    throw new AppError({
      code: "LEAVE_TYPE_NAME_CONFLICT",
      message: "A leave type with this name already exists.",
      statusCode: 409,
    });
  }
};

const assertPendingLeaveRequest = (leaveRequest: LeaveRequestRecord) => {
  if (leaveRequest.status !== "PENDING") {
    throw new AppError({
      code: "LEAVE_REQUEST_NOT_PENDING",
      message: "Only pending leave requests can be cancelled or rejected.",
      statusCode: 409,
    });
  }
};

const assertApprovableLeaveRequest = (leaveRequest: LeaveRequestRecord) => {
  if (!["PENDING", "REJECTED"].includes(leaveRequest.status)) {
    throw new AppError({
      code: "LEAVE_REQUEST_NOT_APPROVABLE",
      message: "Only pending or rejected leave requests can be approved.",
      statusCode: 409,
    });
  }
};

const assertRejectableLeaveRequest = (leaveRequest: LeaveRequestRecord) => {
  if (!["PENDING", "APPROVED"].includes(leaveRequest.status)) {
    throw new AppError({
      code: "LEAVE_REQUEST_NOT_REJECTABLE",
      message: "Only pending or approved leave requests can be rejected.",
      statusCode: 409,
    });
  }
};

const assertDateRange = (input: CreateLeaveRequestInput) => {
  const startDate = atUtcMidnight(input.startDate);
  const endDate = atUtcMidnight(input.endDate);

  if (endDate < startDate) {
    throw new AppError({
      code: "LEAVE_INVALID_DATE_RANGE",
      message: "End date must be on or after start date.",
      statusCode: 422,
    });
  }

  return {
    endDate,
    startDate,
    totalDays: calculateTotalDays(startDate, endDate),
  };
};

const assertNoOverlap = async ({
  employeeId,
  endDate,
  excludeId,
  startDate,
}: {
  employeeId: string;
  endDate: Date;
  excludeId?: string;
  startDate: Date;
}) => {
  const existingRequest = await findOverlappingLeaveRequest({
    employeeId,
    endDate,
    excludeId,
    startDate,
  });

  if (existingRequest) {
    throw new AppError({
      code: "LEAVE_REQUEST_OVERLAP",
      message: "This leave request overlaps with an existing pending or approved request.",
      statusCode: 409,
    });
  }
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const isMissingRecordError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

const withLeaveTypeWriteErrors = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError({
        code: "LEAVE_TYPE_NAME_CONFLICT",
        message: "A leave type with this name already exists.",
        statusCode: 409,
      });
    }

    if (isMissingRecordError(error)) {
      throw new AppError({
        code: "LEAVE_TYPE_NOT_FOUND",
        message: "Leave type was not found.",
        statusCode: 404,
      });
    }

    throw error;
  }
};

export const getLeaveTypes = async (input: ListLeaveTypesInput) => {
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listLeaveTypes({
    ...input,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toLeaveTypeDto),
    limit,
    page,
    total,
  });
};

export const createNewLeaveType = async (
  input: CreateLeaveTypeInput,
  auditContext: AuditContext,
) => {
  await assertUniqueLeaveTypeName(input.name);
  const leaveType = await withLeaveTypeWriteErrors(() => createLeaveType(input));
  await createLeaveTypeAuditLog({
    ...auditContext,
    action: "LEAVE_TYPE_CREATED",
    entityId: leaveType.id,
    metadata: {
      annualAllowance: leaveType.annualAllowance?.toString() ?? null,
      isActive: leaveType.isActive,
      isPaid: leaveType.isPaid,
      name: leaveType.name,
    },
  });

  return toLeaveTypeDto(leaveType);
};

export const updateExistingLeaveType = async (
  id: string,
  input: UpdateLeaveTypeInput,
  auditContext: AuditContext,
) => {
  const current = await assertLeaveTypeExists(id);

  if (input.name !== undefined) {
    await assertUniqueLeaveTypeName(input.name, id);
  }

  const leaveType = await withLeaveTypeWriteErrors(() => updateLeaveType(id, input));
  await createLeaveTypeAuditLog({
    ...auditContext,
    action: "LEAVE_TYPE_UPDATED",
    entityId: leaveType.id,
    metadata: {
      changedFields: Object.keys(input),
      from: {
        annualAllowance: current.annualAllowance?.toString() ?? null,
        description: current.description,
        isActive: current.isActive,
        isPaid: current.isPaid,
        name: current.name,
      },
      to: {
        annualAllowance: leaveType.annualAllowance?.toString() ?? null,
        description: leaveType.description,
        isActive: leaveType.isActive,
        isPaid: leaveType.isPaid,
        name: leaveType.name,
      },
    },
  });

  return toLeaveTypeDto(leaveType);
};

export const deleteExistingLeaveType = async (
  id: string,
  auditContext: AuditContext,
) => {
  const current = await assertLeaveTypeExists(id);
  const usage = await countLeaveTypeUsage(id);

  if (usage.leaveRequests > 0 || usage.leaveBalances > 0) {
    throw new AppError({
      code: "LEAVE_TYPE_IN_USE",
      message:
        "Leave types with existing requests or balances cannot be deleted. Mark the leave type inactive instead.",
      statusCode: 409,
    });
  }

  const leaveType = await withLeaveTypeWriteErrors(() => deleteLeaveType(id));
  await createLeaveTypeAuditLog({
    ...auditContext,
    action: "LEAVE_TYPE_DELETED",
    entityId: leaveType.id,
    metadata: {
      leaveBalances: usage.leaveBalances,
      leaveRequests: usage.leaveRequests,
      name: current.name,
    },
  });

  return toLeaveTypeDto(leaveType);
};

export const getSelfLeaveRequests = async (
  auth: AuthContext,
  input: ListSelfLeaveRequestsInput,
) => {
  const employeeId = getSelfLeaveEmployeeId(auth);
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listSelfLeaveRequests({
    ...input,
    employeeId,
    ...getPaginationParams({ limit, page }),
  });
  const balances = await listLeaveBalancesForEmployee({
    employeeId,
    year: new Date().getUTCFullYear(),
  });

  return {
    balances: balances.map(toLeaveBalanceDto),
    data: items.map(toLeaveRequestDto),
    meta: getPaginationMeta({ limit, page, total }),
  };
};

export const getLeaveRequestList = async (input: ListLeaveRequestsInput) => {
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listLeaveRequests({
    ...input,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toLeaveRequestDto),
    limit,
    page,
    total,
  });
};

export const getLeaveRequestDetail = async (id: string) => {
  const leaveRequest = await assertLeaveRequestExists(id);

  return toLeaveRequestDto(leaveRequest);
};

export const createSelfLeaveRequest = async (
  auth: AuthContext,
  input: CreateLeaveRequestInput,
) => {
  const employeeId = getSelfLeaveEmployeeId(auth);
  const leaveType = await assertLeaveTypeExists(input.leaveTypeId);

  if (!leaveType.isActive) {
    throw new AppError({
      code: "LEAVE_TYPE_INACTIVE",
      message: "Inactive leave types cannot be requested.",
      statusCode: 422,
    });
  }

  const dateRange = assertDateRange(input);
  await assertNoOverlap({ employeeId, ...dateRange });
  const leaveRequest = await createLeaveRequest({
    employeeId,
    input,
    ...dateRange,
  });

  return toLeaveRequestDto(leaveRequest);
};

export const cancelSelfLeaveRequest = async (auth: AuthContext, id: string) => {
  const employeeId = getSelfLeaveEmployeeId(auth);
  const leaveRequest = await assertLeaveRequestExists(id);

  if (leaveRequest.employeeId !== employeeId) {
    throw new AppError({
      code: "LEAVE_REQUEST_FORBIDDEN",
      message: "You can only cancel your own leave requests.",
      statusCode: 403,
    });
  }

  assertPendingLeaveRequest(leaveRequest);
  const cancelled = await cancelLeaveRequest(id);

  return toLeaveRequestDto(cancelled);
};

export const approveLeaveRequest = async (
  id: string,
  input: ReviewLeaveRequestInput,
  auditContext: AuditContext,
) => {
  const current = await assertLeaveRequestExists(id);
  assertApprovableLeaveRequest(current);
  await assertNoOverlap({
    employeeId: current.employeeId,
    endDate: current.endDate,
    excludeId: current.id,
    startDate: current.startDate,
  });
  const settings = await getLeaveSettings();
  const allocation =
    current.leaveType && current.leaveTypeId
      ? (await assertLeaveTypeExists(current.leaveTypeId)).annualAllowance ??
        settings.defaultAnnualAllowanceDays
      : settings.defaultAnnualAllowanceDays;

  try {
    const leaveRequest = await approveLeaveRequestWithBalance({
      ...auditContext,
      allocation,
      allowNegativeBalance: settings.allowNegativeBalance,
      entityId: id,
      reviewNote: input.reviewNote ?? null,
      totalDays: current.totalDays,
      year: current.startDate.getUTCFullYear(),
    });

    return toLeaveRequestDto(leaveRequest);
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_LEAVE_BALANCE") {
      throw new AppError({
        code: "LEAVE_BALANCE_INSUFFICIENT",
        message: "This employee does not have enough remaining leave balance.",
        statusCode: 409,
      });
    }

    throw error;
  }
};

export const rejectLeaveRequest = async (
  id: string,
  input: ReviewLeaveRequestInput,
  auditContext: AuditContext,
) => {
  const current = await assertLeaveRequestExists(id);
  assertRejectableLeaveRequest(current);

  if (current.status === "APPROVED") {
    const leaveRequest = await rejectApprovedLeaveRequestWithBalance({
      ...auditContext,
      entityId: id,
      reviewNote: input.reviewNote ?? null,
      year: current.startDate.getUTCFullYear(),
    });

    return toLeaveRequestDto(leaveRequest);
  }

  const leaveRequest = await rejectLeaveRequestWithAuditLog({
    ...auditContext,
    entityId: id,
    reviewNote: input.reviewNote ?? null,
  });

  return toLeaveRequestDto(leaveRequest);
};
