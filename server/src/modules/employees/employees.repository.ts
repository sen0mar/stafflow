import type { EmploymentStatus, Prisma, UserStatus } from "@prisma/client";

import { getCompanyDate } from "../../core/utils/company-day";
import { parseDateOnly } from "../../core/utils/date-only";
import {
  createAuditLog,
  type AuditLogInput,
} from "../audit-logs/audit-log.service";
import { prisma } from "../../prisma/prisma.client";
import { SETTINGS_SINGLETON_IDS } from "../settings/settings.constants";
import type {
  CreateEmployeeInput,
  ListEmployeesInput,
  UpdateEmployeeInput,
} from "./employees.schema";

export interface EmployeeListFilters extends ListEmployeesInput {
  skip: number;
  take: number;
}

export const employeeSelect = {
  createdAt: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  departmentId: true,
  employeeCode: true,
  firstName: true,
  hireDate: true,
  id: true,
  jobTitle: true,
  lastName: true,
  phone: true,
  status: true,
  terminationDate: true,
  updatedAt: true,
  user: {
    select: {
      createdAt: true,
      email: true,
      id: true,
      lastLoginAt: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  },
  userId: true,
} satisfies Prisma.EmployeeSelect;

const getEmployeeWhere = ({
  departmentId,
  search,
  status,
}: Pick<
  ListEmployeesInput,
  "departmentId" | "search" | "status"
>): Prisma.EmployeeWhereInput => ({
  ...(departmentId ? { departmentId } : {}),
  ...(status ? { status } : {}),
  ...(search
    ? {
        OR: [
          { employeeCode: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { jobTitle: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { department: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {}),
});

const getEmployeeOrderBy = (
  sort: ListEmployeesInput["sort"],
): Prisma.EmployeeOrderByWithRelationInput[] => {
  if (sort === "newest") {
    return [{ createdAt: "desc" }];
  }

  if (sort === "oldest") {
    return [{ createdAt: "asc" }];
  }

  if (sort === "department") {
    return [
      { department: { name: "asc" } },
      { lastName: "asc" },
      { firstName: "asc" },
    ];
  }

  if (sort === "status") {
    return [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }];
  }

  return [{ lastName: "asc" }, { firstName: "asc" }, { createdAt: "asc" }];
};

export const listEmployees = async ({
  departmentId,
  search,
  skip,
  sort,
  status,
  take,
}: EmployeeListFilters) => {
  const where = getEmployeeWhere({ departmentId, search, status });

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      orderBy: getEmployeeOrderBy(sort),
      select: employeeSelect,
      skip,
      take,
      where,
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, total };
};

export const findEmployeeById = (id: string) =>
  prisma.employee.findUnique({
    select: employeeSelect,
    where: { id },
  });

export const findEmployeeByCode = (employeeCode: string) =>
  prisma.employee.findUnique({
    select: {
      employeeCode: true,
      id: true,
    },
    where: { employeeCode },
  });

export const findUserAccountByEmail = (email: string) =>
  prisma.user.findUnique({
    select: {
      email: true,
      id: true,
    },
    where: { email },
  });

export const findDepartmentForEmployee = (departmentId: string) =>
  prisma.department.findUnique({
    select: {
      id: true,
      isActive: true,
      name: true,
    },
    where: { id: departmentId },
  });

export const listPendingEmployeeInvitations = async () =>
  prisma.invitationToken.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      expiresAt: true,
      user: {
        select: {
          email: true,
          id: true,
          employee: {
            select: {
              firstName: true,
              id: true,
              lastName: true,
            },
          },
        },
      },
    },
    where: {
      acceptedAt: null,
      expiresAt: { gt: new Date() },
      role: "EMPLOYEE",
      userId: { not: null },
      user: {
        status: "INVITED",
        employee: {
          isNot: null,
        },
      },
    },
  });

export const findInvitedEmployeeForInvitation = (employeeId: string) =>
  prisma.employee.findFirst({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          email: true,
          id: true,
          status: true,
        },
      },
      userId: true,
    },
    where: {
      id: employeeId,
      user: {
        status: "INVITED",
      },
    },
  });

export const createEmployeeAuditLog = ({
  action,
  actorUserId,
  entityId,
  ipAddress,
  metadata,
  tx = prisma,
  userAgent,
}: {
  action: string;
  actorUserId: string | null;
  entityId: string | null;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
  userAgent?: string;
}) =>
  createAuditLog({
    action,
    actorUserId,
    entityId,
    entityType: "Employee",
    ipAddress,
    metadata,
    tx,
    userAgent,
  });

export const createUserAuditLogForEmployee = ({
  action,
  actorUserId,
  entityId,
  ipAddress,
  metadata,
  tx = prisma,
  userAgent,
}: {
  action: string;
  actorUserId: string | null;
  entityId: string | null;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
  userAgent?: string;
}) =>
  createAuditLog({
    action,
    actorUserId,
    entityId,
    entityType: "User",
    ipAddress,
    metadata,
    tx,
    userAgent,
  });

export const createInvitedEmployeeAccount = async ({
  actorUserId,
  expiresAt,
  input,
  ipAddress,
  passwordHash,
  tokenHash,
  userAgent,
}: {
  actorUserId: string | null;
  expiresAt: Date;
  input: CreateEmployeeInput;
  ipAddress?: string;
  passwordHash: string;
  tokenHash: string;
  userAgent?: string;
}) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: "EMPLOYEE",
        status: "INVITED",
      },
      select: {
        id: true,
      },
    });
    const employee = await tx.employee.create({
      data: {
        departmentId: input.departmentId ?? null,
        employeeCode: input.employeeCode,
        firstName: input.firstName,
        hireDate: input.hireDate ? parseDateOnly(input.hireDate) : null,
        jobTitle: input.jobTitle ?? null,
        lastName: input.lastName,
        phone: input.phone ?? null,
        status: "ACTIVE",
        userId: user.id,
      },
      select: employeeSelect,
    });

    await tx.invitationToken.create({
      data: {
        createdById: actorUserId,
        email: input.email,
        expiresAt,
        role: "EMPLOYEE",
        tokenHash,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });
    await createEmployeeAuditLog({
      action: "EMPLOYEE_CREATED",
      actorUserId,
      entityId: employee.id,
      ipAddress,
      metadata: {
        accountStatus: "INVITED",
        departmentId: employee.departmentId,
        employeeCode: employee.employeeCode,
        userId: user.id,
      },
      tx,
      userAgent,
    });
    await createUserAuditLogForEmployee({
      action: "USER_STATUS_CHANGED",
      actorUserId,
      entityId: user.id,
      ipAddress,
      metadata: {
        from: null,
        to: "INVITED",
      },
      tx,
      userAgent,
    });

    return employee;
  });

export const regenerateEmployeeInvitationToken = async ({
  actorUserId,
  email,
  employeeId,
  expiresAt,
  ipAddress,
  tokenHash,
  userAgent,
  userId,
}: {
  actorUserId: string | null;
  email: string;
  employeeId: string;
  expiresAt: Date;
  ipAddress?: string;
  tokenHash: string;
  userAgent?: string;
  userId: string;
}) =>
  prisma.$transaction(async (tx) => {
    const now = new Date();

    await tx.invitationToken.updateMany({
      data: {
        expiresAt: now,
      },
      where: {
        acceptedAt: null,
        expiresAt: { gt: now },
        userId,
      },
    });
    await tx.invitationToken.create({
      data: {
        createdById: actorUserId,
        email,
        expiresAt,
        role: "EMPLOYEE",
        tokenHash,
        userId,
      },
      select: {
        id: true,
      },
    });
    await createUserAuditLogForEmployee({
      action: "INVITATION_REGENERATED",
      actorUserId,
      entityId: userId,
      ipAddress,
      metadata: {
        employeeId,
        expiresAt: expiresAt.toISOString(),
      },
      tx,
      userAgent,
    });
  });

type EmployeeMutationAuditLog = Omit<
  AuditLogInput,
  "entityId" | "entityType" | "metadata" | "tx"
>;

type StatusMutationAuditLog = Omit<
  AuditLogInput,
  "entityId" | "entityType" | "tx"
> & { entityId: string | null };

export const updateEmployeeWithAuditLog = ({
  auditLog,
  current,
  id,
  input,
}: {
  auditLog: EmployeeMutationAuditLog;
  current: {
    departmentId: string | null;
    employeeCode: string;
    firstName: string;
    jobTitle: string | null;
    lastName: string;
    phone: string | null;
  };
  id: string;
  input: UpdateEmployeeInput;
}) =>
  prisma.$transaction(async (tx) => {
    const employee = await tx.employee.update({
      data: {
        ...(input.departmentId !== undefined
          ? { departmentId: input.departmentId }
          : {}),
        ...(input.employeeCode !== undefined
          ? { employeeCode: input.employeeCode }
          : {}),
        ...(input.firstName !== undefined
          ? { firstName: input.firstName }
          : {}),
        ...(input.hireDate !== undefined
          ? { hireDate: input.hireDate ? parseDateOnly(input.hireDate) : null }
          : {}),
        ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.terminationDate !== undefined
          ? {
              terminationDate: input.terminationDate
                ? parseDateOnly(input.terminationDate)
                : null,
            }
          : {}),
      },
      select: employeeSelect,
      where: { id },
    });

    await createEmployeeAuditLog({
      ...auditLog,
      entityId: employee.id,
      metadata: {
        changedFields: Object.keys(input),
        from: current,
        to: {
          departmentId: employee.departmentId,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          jobTitle: employee.jobTitle,
          lastName: employee.lastName,
          phone: employee.phone,
        },
      },
      tx,
    });

    return employee;
  });

export const updateSelfEmployeeProfileWithAuditLog = ({
  auditLog,
  id,
  input,
}: {
  auditLog: EmployeeMutationAuditLog;
  id: string;
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  };
}) =>
  prisma.$transaction(async (tx) => {
    const employee = await tx.employee.update({
      data: {
        ...(input.firstName !== undefined
          ? { firstName: input.firstName }
          : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
      select: employeeSelect,
      where: { id },
    });

    await createEmployeeAuditLog({
      ...auditLog,
      entityId: employee.id,
      metadata: {
        changedFields: Object.keys(input),
        selfService: true,
      },
      tx,
    });

    return employee;
  });

export const updateEmployeeAndAccountStatus = async ({
  accountStatus,
  employeeId,
  employeeAuditLog,
  employeeStatus,
  userAuditLog,
}: {
  accountStatus?: UserStatus;
  employeeId: string;
  employeeAuditLog?: StatusMutationAuditLog;
  employeeStatus?: EmploymentStatus;
  userAuditLog?: StatusMutationAuditLog;
}) =>
  prisma.$transaction(async (tx) => {
    const companySettings =
      employeeStatus === "TERMINATED"
        ? await tx.companySettings.findUnique({
            select: { timezone: true },
            where: { id: SETTINGS_SINGLETON_IDS.company },
          })
        : null;
    const employee = await tx.employee.update({
      data: {
        ...(employeeStatus !== undefined ? { status: employeeStatus } : {}),
        ...(employeeStatus === "TERMINATED"
          ? {
              terminationDate: getCompanyDate(
                new Date(),
                companySettings?.timezone ?? "UTC",
              ),
            }
          : {}),
        ...(employeeStatus === "ACTIVE" ? { terminationDate: null } : {}),
        ...(accountStatus !== undefined
          ? {
              user: {
                update: {
                  status: accountStatus,
                },
              },
            }
          : {}),
      },
      select: employeeSelect,
      where: { id: employeeId },
    });

    if (accountStatus === "DISABLED" && employee.userId) {
      await tx.session.updateMany({
        data: {
          revokedAt: new Date(),
        },
        where: {
          revokedAt: null,
          userId: employee.userId,
        },
      });
    }

    if (employeeAuditLog) {
      await createEmployeeAuditLog({
        ...employeeAuditLog,
        tx,
      });
    }

    if (userAuditLog) {
      await createUserAuditLogForEmployee({
        ...userAuditLog,
        tx,
      });
    }

    return employee;
  });

export type EmployeeRecord = NonNullable<
  Awaited<ReturnType<typeof findEmployeeById>>
>;
