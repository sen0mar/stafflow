import { Prisma } from "@prisma/client";

import type { AuthContext } from "../../core/auth/auth.types";
import { hashPassword } from "../../core/auth/password.service";
import { createSessionToken, hashSessionToken } from "../../core/auth/session.service";
import { AppError } from "../../core/errors/app-error";
import {
  getPaginationParams,
  toPaginatedResult,
} from "../../core/pagination/pagination";
import { findUserAccountByEmail } from "../users/users.repository";
import {
  createEmployeeAuditLog,
  createInvitedEmployeeAccount,
  createUserAuditLogForEmployee,
  findDepartmentForEmployee,
  findEmployeeByCode,
  findEmployeeById,
  listEmployees,
  updateEmployee,
  updateEmployeeAndAccountStatus,
  updateSelfEmployeeProfile,
  type EmployeeRecord,
} from "./employees.repository";
import { requireSelfEmployeeId } from "./employees.policy";
import type {
  CreateEmployeeInput,
  DisableEmployeeInput,
  ListEmployeesInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
  UpdateSelfProfileInput,
} from "./employees.schema";

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

const invitationTtlMs = 7 * 24 * 60 * 60 * 1000;

const toEmployeeDto = (employee: EmployeeRecord) => ({
  account: employee.user
    ? {
        createdAt: employee.user.createdAt.toISOString(),
        email: employee.user.email,
        id: employee.user.id,
        lastLoginAt: employee.user.lastLoginAt?.toISOString() ?? null,
        role: employee.user.role,
        status: employee.user.status,
        updatedAt: employee.user.updatedAt.toISOString(),
      }
    : null,
  createdAt: employee.createdAt.toISOString(),
  department: employee.department,
  departmentId: employee.departmentId,
  employeeCode: employee.employeeCode,
  firstName: employee.firstName,
  fullName: `${employee.firstName} ${employee.lastName}`,
  hireDate: employee.hireDate?.toISOString() ?? null,
  id: employee.id,
  jobTitle: employee.jobTitle,
  lastName: employee.lastName,
  phone: employee.phone,
  status: employee.status,
  terminationDate: employee.terminationDate?.toISOString() ?? null,
  updatedAt: employee.updatedAt.toISOString(),
});

const assertEmployeeExists = async (id: string) => {
  const employee = await findEmployeeById(id);

  if (!employee) {
    throw new AppError({
      code: "EMPLOYEE_NOT_FOUND",
      message: "Employee was not found.",
      statusCode: 404,
    });
  }

  return employee;
};

const assertUniqueEmployeeCode = async (
  employeeCode: string,
  currentId?: string,
) => {
  const existingEmployee = await findEmployeeByCode(employeeCode);

  if (existingEmployee && existingEmployee.id !== currentId) {
    throw new AppError({
      code: "EMPLOYEE_CODE_CONFLICT",
      message: "An employee with this code already exists.",
      statusCode: 409,
    });
  }
};

const assertUniqueEmail = async (email: string) => {
  const existingUser = await findUserAccountByEmail(email);

  if (existingUser) {
    throw new AppError({
      code: "USER_EMAIL_CONFLICT",
      message: "A user account with this email already exists.",
      statusCode: 409,
    });
  }
};

const assertDepartmentIsAssignable = async (departmentId?: string | null) => {
  if (!departmentId) {
    return;
  }

  const department = await findDepartmentForEmployee(departmentId);

  if (!department) {
    throw new AppError({
      code: "DEPARTMENT_NOT_FOUND",
      message: "Department was not found.",
      statusCode: 404,
    });
  }

  if (!department.isActive) {
    throw new AppError({
      code: "DEPARTMENT_INACTIVE",
      message: "Inactive departments cannot be assigned to employees.",
      statusCode: 409,
    });
  }
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const isMissingRecordError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

const withEmployeeWriteErrors = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError({
        code: "EMPLOYEE_CONFLICT",
        message: "Employee or account details conflict with an existing record.",
        statusCode: 409,
      });
    }

    if (isMissingRecordError(error)) {
      throw new AppError({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee was not found.",
        statusCode: 404,
      });
    }

    throw error;
  }
};

export const getEmployees = async (input: ListEmployeesInput) => {
  const page = input.page;
  const limit = input.limit;
  const { items, total } = await listEmployees({
    ...input,
    ...getPaginationParams({ limit, page }),
  });

  return toPaginatedResult({
    data: items.map(toEmployeeDto),
    limit,
    page,
    total,
  });
};

export const getEmployee = async (id: string) => {
  const employee = await assertEmployeeExists(id);

  return toEmployeeDto(employee);
};

export const getSelfEmployee = async (auth: AuthContext) => {
  const employeeId = requireSelfEmployeeId(auth);

  return getEmployee(employeeId);
};

export const createNewEmployee = async (
  input: CreateEmployeeInput,
  auditContext: AuditContext,
) => {
  await assertUniqueEmployeeCode(input.employeeCode);
  await assertUniqueEmail(input.email);
  await assertDepartmentIsAssignable(input.departmentId);

  const invitationToken = createSessionToken();
  const tokenHash = hashSessionToken(invitationToken);
  const passwordHash = await hashPassword(createSessionToken());
  const expiresAt = new Date(Date.now() + invitationTtlMs);
  const employee = await withEmployeeWriteErrors(() =>
    createInvitedEmployeeAccount({
      ...auditContext,
      expiresAt,
      input,
      passwordHash,
      tokenHash,
    }),
  );

  return {
    employee: toEmployeeDto(employee),
    invitation: {
      expiresAt: expiresAt.toISOString(),
      token: invitationToken,
    },
  };
};

export const updateExistingEmployee = async (
  id: string,
  input: UpdateEmployeeInput,
  auditContext: AuditContext,
) => {
  const currentEmployee = await assertEmployeeExists(id);

  if (input.employeeCode !== undefined) {
    await assertUniqueEmployeeCode(input.employeeCode, id);
  }

  if (input.departmentId !== undefined) {
    await assertDepartmentIsAssignable(input.departmentId);
  }

  const employee = await withEmployeeWriteErrors(() => updateEmployee(id, input));
  await createEmployeeAuditLog({
    ...auditContext,
    action: "EMPLOYEE_UPDATED",
    entityId: employee.id,
    metadata: {
      changedFields: Object.keys(input),
      from: {
        departmentId: currentEmployee.departmentId,
        employeeCode: currentEmployee.employeeCode,
        firstName: currentEmployee.firstName,
        jobTitle: currentEmployee.jobTitle,
        lastName: currentEmployee.lastName,
        phone: currentEmployee.phone,
      },
      to: {
        departmentId: employee.departmentId,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        jobTitle: employee.jobTitle,
        lastName: employee.lastName,
        phone: employee.phone,
      },
    },
  });

  return toEmployeeDto(employee);
};

export const updateEmployeeStatuses = async (
  id: string,
  input: UpdateEmployeeStatusInput,
  auditContext: AuditContext,
) => {
  const currentEmployee = await assertEmployeeExists(id);
  const employee = await withEmployeeWriteErrors(() =>
    updateEmployeeAndAccountStatus({
      accountStatus: input.accountStatus,
      employeeId: id,
      employeeStatus: input.employeeStatus,
    }),
  );

  if (
    input.employeeStatus !== undefined &&
    input.employeeStatus !== currentEmployee.status
  ) {
    await createEmployeeAuditLog({
      ...auditContext,
      action:
        input.employeeStatus === "ACTIVE"
          ? "EMPLOYEE_ENABLED"
          : "EMPLOYEE_DISABLED",
      entityId: employee.id,
      metadata: {
        from: currentEmployee.status,
        to: input.employeeStatus,
      },
    });
  }

  if (
    input.accountStatus !== undefined &&
    currentEmployee.user &&
    input.accountStatus !== currentEmployee.user.status
  ) {
    await createUserAuditLogForEmployee({
      ...auditContext,
      action: "USER_STATUS_CHANGED",
      entityId: currentEmployee.user.id,
      metadata: {
        from: currentEmployee.user.status,
        to: input.accountStatus,
      },
    });
  }

  return toEmployeeDto(employee);
};

export const disableExistingEmployee = async (
  id: string,
  input: DisableEmployeeInput,
  auditContext: AuditContext,
) =>
  updateEmployeeStatuses(
    id,
    {
      accountStatus: "DISABLED",
      employeeStatus: input.employeeStatus,
    },
    auditContext,
  );

export const updateSelfProfile = async (
  auth: AuthContext,
  input: UpdateSelfProfileInput,
  auditContext: AuditContext,
) => {
  const employeeId = requireSelfEmployeeId(auth);
  const employee = await withEmployeeWriteErrors(() =>
    updateSelfEmployeeProfile(employeeId, input),
  );

  await createEmployeeAuditLog({
    ...auditContext,
    action: "EMPLOYEE_UPDATED",
    entityId: employee.id,
    metadata: {
      changedFields: Object.keys(input),
      selfService: true,
    },
  });

  return toEmployeeDto(employee);
};
