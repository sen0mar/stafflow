import { Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import { createAuditLog } from "../audit-logs/audit-log.service";
import type {
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  ListLeaveRequestsInput,
  ListLeaveTypesInput,
  UpdateLeaveTypeInput,
} from "./leave.schema";

export interface LeaveTypeListFilters extends ListLeaveTypesInput {
  skip: number;
  take: number;
}

export interface LeaveRequestListFilters extends ListLeaveRequestsInput {
  skip: number;
  take: number;
}

export interface SelfLeaveRequestListFilters {
  employeeId: string;
  limit: number;
  page: number;
  skip: number;
  status?: ListLeaveRequestsInput["status"];
  take: number;
}

export const leaveTypeSelect = {
  _count: {
    select: {
      leaveBalances: true,
      leaveRequests: true,
    },
  },
  annualAllowance: true,
  createdAt: true,
  description: true,
  id: true,
  isActive: true,
  isPaid: true,
  name: true,
  updatedAt: true,
} satisfies Prisma.LeaveTypeSelect;

export const leaveRequestSelect = {
  createdAt: true,
  employee: {
    select: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      employeeCode: true,
      firstName: true,
      id: true,
      lastName: true,
    },
  },
  employeeId: true,
  endDate: true,
  id: true,
  leaveType: {
    select: {
      id: true,
      isPaid: true,
      name: true,
    },
  },
  leaveTypeId: true,
  reason: true,
  reviewedAt: true,
  reviewedBy: {
    select: {
      email: true,
      id: true,
    },
  },
  reviewedById: true,
  reviewNote: true,
  startDate: true,
  status: true,
  totalDays: true,
  updatedAt: true,
} satisfies Prisma.LeaveRequestSelect;

export const leaveBalanceSelect = {
  allocated: true,
  employeeId: true,
  id: true,
  leaveType: {
    select: {
      id: true,
      name: true,
    },
  },
  leaveTypeId: true,
  remaining: true,
  used: true,
  year: true,
} satisfies Prisma.LeaveBalanceSelect;

export type LeaveRequestRecord = Prisma.LeaveRequestGetPayload<{
  select: typeof leaveRequestSelect;
}>;
export type LeaveTypeRecord = Prisma.LeaveTypeGetPayload<{
  select: typeof leaveTypeSelect;
}>;
export type LeaveBalanceRecord = Prisma.LeaveBalanceGetPayload<{
  select: typeof leaveBalanceSelect;
}>;

type LeaveRequestVersion = Pick<LeaveRequestRecord, "status" | "updatedAt">;

type LeaveMutationFailureReason =
  | "INSUFFICIENT_LEAVE_BALANCE"
  | "LEAVE_REQUEST_FORBIDDEN"
  | "LEAVE_REQUEST_NOT_APPROVABLE"
  | "LEAVE_REQUEST_NOT_FOUND"
  | "LEAVE_REQUEST_NOT_PENDING"
  | "LEAVE_REQUEST_NOT_REJECTABLE"
  | "LEAVE_REQUEST_OVERLAP"
  | "LEAVE_REQUEST_STALE_TRANSITION"
  | "LEAVE_TYPE_INACTIVE"
  | "LEAVE_TYPE_NOT_FOUND";

export class LeaveMutationError extends Error {
  public readonly reason: LeaveMutationFailureReason;

  public constructor(reason: LeaveMutationFailureReason) {
    super(reason);
    this.name = "LeaveMutationError";
    this.reason = reason;
  }
}

const maxSerializableAttempts = 3;

const isSerializationConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2034";

const runSerializableTransaction = async <T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
) => {
  for (let attempt = 1; attempt <= maxSerializableAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        !isSerializationConflict(error) ||
        attempt === maxSerializableAttempts
      ) {
        throw error;
      }
    }
  }

  throw new Error("Serializable leave transaction exhausted its retry limit.");
};

const requestVersionMatches = (
  current: LeaveRequestVersion,
  expected: LeaveRequestVersion,
) =>
  current.status === expected.status &&
  current.updatedAt.getTime() === expected.updatedAt.getTime();

// Keep the first attempt's version across serialization retries so a losing
// review cannot reinterpret the winner's new status as a fresh transition.
const preserveExpectedRequestVersion = (
  current: LeaveRequestVersion,
  expected: LeaveRequestVersion | undefined,
) => {
  if (expected && !requestVersionMatches(current, expected)) {
    throw new LeaveMutationError("LEAVE_REQUEST_STALE_TRANSITION");
  }

  return expected ?? { status: current.status, updatedAt: current.updatedAt };
};

const findOverlappingLeaveRequestInTransaction = (
  tx: Prisma.TransactionClient,
  {
    employeeId,
    endDate,
    excludeId,
    startDate,
  }: {
    employeeId: string;
    endDate: Date;
    excludeId?: string;
    startDate: Date;
  },
) =>
  tx.leaveRequest.findFirst({
    select: { id: true },
    where: {
      employeeId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      endDate: { gte: startDate },
      startDate: { lte: endDate },
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

const getLeaveTypeWhere = ({
  isActive,
  search,
}: Pick<
  ListLeaveTypesInput,
  "isActive" | "search"
>): Prisma.LeaveTypeWhereInput => ({
  ...(isActive === undefined ? {} : { isActive }),
  ...(search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}),
});

const getLeaveRequestWhere = ({
  employeeId,
  leaveTypeId,
  status,
}: Pick<
  ListLeaveRequestsInput,
  "employeeId" | "leaveTypeId" | "status"
>): Prisma.LeaveRequestWhereInput => ({
  ...(employeeId ? { employeeId } : {}),
  ...(leaveTypeId ? { leaveTypeId } : {}),
  ...(status ? { status } : { status: { not: "CANCELLED" } }),
});

export const listLeaveTypes = async ({
  isActive,
  search,
  skip,
  take,
}: LeaveTypeListFilters) => {
  const where = getLeaveTypeWhere({ isActive, search });

  const [items, total] = await Promise.all([
    prisma.leaveType.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      select: leaveTypeSelect,
      skip,
      take,
      where,
    }),
    prisma.leaveType.count({ where }),
  ]);

  return { items, total };
};

export const findLeaveTypeById = (id: string) =>
  prisma.leaveType.findUnique({
    select: leaveTypeSelect,
    where: { id },
  });

export const findLeaveTypeByName = (name: string) =>
  prisma.leaveType.findUnique({
    select: { id: true, name: true },
    where: { name },
  });

export const createLeaveType = (input: CreateLeaveTypeInput) =>
  prisma.leaveType.create({
    data: {
      annualAllowance: input.annualAllowance ?? null,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      isPaid: input.isPaid ?? true,
      name: input.name,
    },
    select: leaveTypeSelect,
  });

export const updateLeaveType = (id: string, input: UpdateLeaveTypeInput) =>
  prisma.leaveType.update({
    data: {
      ...(input.annualAllowance !== undefined
        ? { annualAllowance: input.annualAllowance }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.isPaid !== undefined ? { isPaid: input.isPaid } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
    },
    select: leaveTypeSelect,
    where: { id },
  });

export const deleteLeaveType = (id: string) =>
  prisma.leaveType.delete({
    select: leaveTypeSelect,
    where: { id },
  });

export const countLeaveTypeUsage = async (leaveTypeId: string) => {
  const [leaveRequests, leaveBalances] = await Promise.all([
    prisma.leaveRequest.count({ where: { leaveTypeId } }),
    prisma.leaveBalance.count({ where: { leaveTypeId } }),
  ]);

  return { leaveBalances, leaveRequests };
};

export const listLeaveRequests = async ({
  employeeId,
  leaveTypeId,
  skip,
  status,
  take,
}: LeaveRequestListFilters) => {
  const where = getLeaveRequestWhere({ employeeId, leaveTypeId, status });

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: leaveRequestSelect,
      skip,
      take,
      where,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { items, total };
};

export const listSelfLeaveRequests = ({
  employeeId,
  skip,
  status,
  take,
}: SelfLeaveRequestListFilters) =>
  listLeaveRequests({
    employeeId,
    limit: take,
    page: Math.floor(skip / take) + 1,
    skip,
    status,
    take,
  });

export const findLeaveRequestById = (id: string) =>
  prisma.leaveRequest.findUnique({
    select: leaveRequestSelect,
    where: { id },
  });

export const createLeaveRequestAtomically = ({
  employeeId,
  input,
  startDate,
  endDate,
  totalDays,
}: {
  employeeId: string;
  endDate: Date;
  input: CreateLeaveRequestInput;
  startDate: Date;
  totalDays: number;
}) =>
  runSerializableTransaction(async (tx) => {
    const leaveType = await tx.leaveType.findUnique({
      select: { isActive: true },
      where: { id: input.leaveTypeId },
    });

    if (!leaveType) {
      throw new LeaveMutationError("LEAVE_TYPE_NOT_FOUND");
    }

    if (!leaveType.isActive) {
      throw new LeaveMutationError("LEAVE_TYPE_INACTIVE");
    }

    const overlappingRequest = await findOverlappingLeaveRequestInTransaction(
      tx,
      { employeeId, endDate, startDate },
    );

    if (overlappingRequest) {
      throw new LeaveMutationError("LEAVE_REQUEST_OVERLAP");
    }

    return tx.leaveRequest.create({
      data: {
        employeeId,
        endDate,
        leaveTypeId: input.leaveTypeId,
        reason: input.reason ?? null,
        startDate,
        totalDays,
      },
      select: leaveRequestSelect,
    });
  });

export const cancelLeaveRequestAtomically = ({
  employeeId,
  id,
}: {
  employeeId: string;
  id: string;
}) => {
  let expectedVersion: LeaveRequestVersion | undefined;

  return runSerializableTransaction(async (tx) => {
    const current = await tx.leaveRequest.findUnique({
      select: leaveRequestSelect,
      where: { id },
    });

    if (!current) {
      throw new LeaveMutationError("LEAVE_REQUEST_NOT_FOUND");
    }

    if (current.employeeId !== employeeId) {
      throw new LeaveMutationError("LEAVE_REQUEST_FORBIDDEN");
    }

    expectedVersion = preserveExpectedRequestVersion(current, expectedVersion);

    if (current.status !== "PENDING") {
      throw new LeaveMutationError("LEAVE_REQUEST_NOT_PENDING");
    }

    const cancellation = await tx.leaveRequest.updateMany({
      data: { status: "CANCELLED" },
      where: {
        id,
        status: current.status,
        updatedAt: current.updatedAt,
      },
    });

    if (cancellation.count !== 1) {
      throw new LeaveMutationError("LEAVE_REQUEST_STALE_TRANSITION");
    }

    return tx.leaveRequest.findUniqueOrThrow({
      select: leaveRequestSelect,
      where: { id },
    });
  });
};

export const listLeaveBalancesForEmployee = ({
  employeeId,
  year,
}: {
  employeeId: string;
  year: number;
}) =>
  prisma.leaveBalance.findMany({
    orderBy: { leaveType: { name: "asc" } },
    select: leaveBalanceSelect,
    where: { employeeId, year },
  });

export const approveLeaveRequestWithBalance = ({
  actorUserId,
  entityId,
  ipAddress,
  reviewNote,
  userAgent,
}: {
  actorUserId: string | null;
  entityId: string;
  ipAddress?: string;
  reviewNote: string | null;
  userAgent?: string;
}) => {
  let expectedVersion: LeaveRequestVersion | undefined;

  return runSerializableTransaction(async (tx) => {
    const current = await tx.leaveRequest.findUnique({
      select: leaveRequestSelect,
      where: { id: entityId },
    });

    if (!current) {
      throw new LeaveMutationError("LEAVE_REQUEST_NOT_FOUND");
    }

    expectedVersion = preserveExpectedRequestVersion(current, expectedVersion);

    if (current.status !== "PENDING" && current.status !== "REJECTED") {
      throw new LeaveMutationError("LEAVE_REQUEST_NOT_APPROVABLE");
    }

    const overlappingRequest = await findOverlappingLeaveRequestInTransaction(
      tx,
      {
        employeeId: current.employeeId,
        endDate: current.endDate,
        excludeId: current.id,
        startDate: current.startDate,
      },
    );

    if (overlappingRequest) {
      throw new LeaveMutationError("LEAVE_REQUEST_OVERLAP");
    }

    const leaveType = await tx.leaveType.findUnique({
      select: { annualAllowance: true },
      where: { id: current.leaveTypeId },
    });

    if (!leaveType) {
      throw new LeaveMutationError("LEAVE_TYPE_NOT_FOUND");
    }

    const settings = await tx.leaveSettings.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        allowNegativeBalance: true,
        defaultAnnualAllowanceDays: true,
      },
    });
    const allowNegativeBalance = settings?.allowNegativeBalance ?? false;
    const allocation =
      leaveType.annualAllowance ??
      settings?.defaultAnnualAllowanceDays ??
      new Prisma.Decimal(0);
    const year = current.startDate.getUTCFullYear();
    const existingBalance = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: current.employeeId,
          leaveTypeId: current.leaveTypeId,
          year,
        },
      },
    });
    const allocated = existingBalance?.allocated ?? allocation;
    const used = existingBalance?.used ?? 0;
    const nextUsed = new Prisma.Decimal(used).plus(current.totalDays);
    const nextRemaining = new Prisma.Decimal(allocated).minus(nextUsed);

    if (!allowNegativeBalance && nextRemaining.lessThan(0)) {
      throw new LeaveMutationError("INSUFFICIENT_LEAVE_BALANCE");
    }

    await tx.leaveBalance.upsert({
      create: {
        allocated,
        employeeId: current.employeeId,
        leaveTypeId: current.leaveTypeId,
        remaining: nextRemaining,
        used: nextUsed,
        year,
      },
      update: {
        remaining: nextRemaining,
        used: nextUsed,
      },
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: current.employeeId,
          leaveTypeId: current.leaveTypeId,
          year,
        },
      },
    });

    const transition = await tx.leaveRequest.updateMany({
      data: {
        reviewedAt: new Date(),
        reviewedById: actorUserId,
        reviewNote,
        status: "APPROVED",
      },
      where: {
        id: entityId,
        status: current.status,
        updatedAt: current.updatedAt,
      },
    });

    if (transition.count !== 1) {
      throw new LeaveMutationError("LEAVE_REQUEST_STALE_TRANSITION");
    }

    const leaveRequest = await tx.leaveRequest.findUniqueOrThrow({
      select: leaveRequestSelect,
      where: { id: entityId },
    });

    await createAuditLog({
      action: "LEAVE_REQUEST_APPROVED",
      actorUserId,
      entityId,
      entityType: "LeaveRequest",
      ipAddress,
      metadata: {
        employeeId: current.employeeId,
        fromStatus: current.status,
        leaveTypeId: current.leaveTypeId,
        reviewNote,
        toStatus: "APPROVED",
        totalDays: current.totalDays.toString(),
      },
      tx,
      userAgent,
    });

    return leaveRequest;
  });
};

export const rejectLeaveRequestAtomically = ({
  actorUserId,
  entityId,
  ipAddress,
  reviewNote,
  userAgent,
}: {
  actorUserId: string | null;
  entityId: string;
  ipAddress?: string;
  reviewNote: string | null;
  userAgent?: string;
}) => {
  let expectedVersion: LeaveRequestVersion | undefined;

  return runSerializableTransaction(async (tx) => {
    const current = await tx.leaveRequest.findUnique({
      select: leaveRequestSelect,
      where: { id: entityId },
    });

    if (!current) {
      throw new LeaveMutationError("LEAVE_REQUEST_NOT_FOUND");
    }

    expectedVersion = preserveExpectedRequestVersion(current, expectedVersion);

    if (current.status !== "PENDING" && current.status !== "APPROVED") {
      throw new LeaveMutationError("LEAVE_REQUEST_NOT_REJECTABLE");
    }

    const year = current.startDate.getUTCFullYear();
    const existingBalance =
      current.status === "APPROVED"
        ? await tx.leaveBalance.findUnique({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: current.employeeId,
                leaveTypeId: current.leaveTypeId,
                year,
              },
            },
          })
        : null;

    if (existingBalance) {
      const nextUsed = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        new Prisma.Decimal(existingBalance.used).minus(current.totalDays),
      );
      const nextRemaining = new Prisma.Decimal(existingBalance.allocated).minus(
        nextUsed,
      );

      await tx.leaveBalance.update({
        data: {
          remaining: nextRemaining,
          used: nextUsed,
        },
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: current.employeeId,
            leaveTypeId: current.leaveTypeId,
            year,
          },
        },
      });
    }

    const transition = await tx.leaveRequest.updateMany({
      data: {
        reviewedAt: new Date(),
        reviewedById: actorUserId,
        reviewNote,
        status: "REJECTED",
      },
      where: {
        id: entityId,
        status: current.status,
        updatedAt: current.updatedAt,
      },
    });

    if (transition.count !== 1) {
      throw new LeaveMutationError("LEAVE_REQUEST_STALE_TRANSITION");
    }

    const leaveRequest = await tx.leaveRequest.findUniqueOrThrow({
      select: leaveRequestSelect,
      where: { id: entityId },
    });

    await createAuditLog({
      action:
        current.status === "APPROVED"
          ? "LEAVE_REQUEST_APPROVAL_REVERSED"
          : "LEAVE_REQUEST_REJECTED",
      actorUserId,
      entityId,
      entityType: "LeaveRequest",
      ipAddress,
      metadata: {
        ...(current.status === "APPROVED"
          ? { balanceAdjusted: Boolean(existingBalance) }
          : {}),
        employeeId: current.employeeId,
        fromStatus: current.status,
        leaveTypeId: current.leaveTypeId,
        reviewNote,
        toStatus: "REJECTED",
        totalDays: current.totalDays.toString(),
      },
      tx,
      userAgent,
    });

    return leaveRequest;
  });
};

export const createLeaveTypeAuditLog = ({
  action,
  actorUserId,
  entityId,
  ipAddress,
  metadata,
  userAgent,
}: {
  action: string;
  actorUserId: string | null;
  entityId: string | null;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
  userAgent?: string;
}) =>
  createAuditLog({
    action,
    actorUserId,
    entityId,
    entityType: "LeaveType",
    ipAddress,
    metadata,
    userAgent,
  });
