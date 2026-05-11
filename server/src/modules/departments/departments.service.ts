import { Prisma } from "@prisma/client";

import { AppError } from "../../core/errors/app-error";
import type {
  CreateDepartmentInput,
  ListDepartmentsInput,
  UpdateDepartmentInput,
} from "./departments.schema";
import {
  countDepartmentEmployees,
  createDepartment,
  createDepartmentAuditLog,
  deleteDepartment,
  findDepartmentById,
  findDepartmentByName,
  listDepartments,
  updateDepartment,
} from "./departments.repository";

interface AuditContext {
  actorUserId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

const toDepartmentDto = (department: NonNullable<Awaited<ReturnType<typeof findDepartmentById>>>) => ({
  createdAt: department.createdAt.toISOString(),
  description: department.description,
  employeeCount: department._count.employees,
  id: department.id,
  isActive: department.isActive,
  name: department.name,
  updatedAt: department.updatedAt.toISOString(),
});

const getPagination = ({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) => ({
  page,
  pageCount: Math.max(1, Math.ceil(total / pageSize)),
  pageSize,
  total,
});

const assertDepartmentExists = async (id: string) => {
  const department = await findDepartmentById(id);

  if (!department) {
    throw new AppError({
      code: "DEPARTMENT_NOT_FOUND",
      message: "Department was not found.",
      statusCode: 404,
    });
  }

  return department;
};

const assertUniqueDepartmentName = async (name: string, currentId?: string) => {
  const existingDepartment = await findDepartmentByName(name);

  if (existingDepartment && existingDepartment.id !== currentId) {
    throw new AppError({
      code: "DEPARTMENT_NAME_CONFLICT",
      message: "A department with this name already exists.",
      statusCode: 409,
    });
  }
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const isMissingRecordError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

const withDepartmentWriteErrors = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError({
        code: "DEPARTMENT_NAME_CONFLICT",
        message: "A department with this name already exists.",
        statusCode: 409,
      });
    }

    if (isMissingRecordError(error)) {
      throw new AppError({
        code: "DEPARTMENT_NOT_FOUND",
        message: "Department was not found.",
        statusCode: 404,
      });
    }

    throw error;
  }
};

export const getDepartments = async (input: ListDepartmentsInput) => {
  const page = input.page;
  const pageSize = input.pageSize;
  const { items, total } = await listDepartments({
    ...input,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: items.map(toDepartmentDto),
    pagination: getPagination({ page, pageSize, total }),
  };
};

export const getDepartment = async (id: string) => {
  const department = await assertDepartmentExists(id);

  return toDepartmentDto(department);
};

export const createNewDepartment = async (
  input: CreateDepartmentInput,
  auditContext: AuditContext,
) => {
  await assertUniqueDepartmentName(input.name);

  const department = await withDepartmentWriteErrors(() =>
    createDepartment(input),
  );
  await createDepartmentAuditLog({
    ...auditContext,
    action: "DEPARTMENT_CREATED",
    entityId: department.id,
    metadata: {
      isActive: department.isActive,
      name: department.name,
    },
  });

  return toDepartmentDto(department);
};

export const updateExistingDepartment = async (
  id: string,
  input: UpdateDepartmentInput,
  auditContext: AuditContext,
) => {
  const currentDepartment = await assertDepartmentExists(id);

  if (input.name !== undefined) {
    await assertUniqueDepartmentName(input.name, id);
  }

  const department = await withDepartmentWriteErrors(() =>
    updateDepartment(id, input),
  );
  await createDepartmentAuditLog({
    ...auditContext,
    action: "DEPARTMENT_UPDATED",
    entityId: department.id,
    metadata: {
      changedFields: Object.keys(input),
      from: {
        description: currentDepartment.description,
        isActive: currentDepartment.isActive,
        name: currentDepartment.name,
      },
      to: {
        description: department.description,
        isActive: department.isActive,
        name: department.name,
      },
    },
  });

  return toDepartmentDto(department);
};

export const deleteExistingDepartment = async (
  id: string,
  auditContext: AuditContext,
) => {
  const department = await assertDepartmentExists(id);
  const employeeCount = await countDepartmentEmployees(id);

  if (employeeCount > 0) {
    throw new AppError({
      code: "DEPARTMENT_HAS_EMPLOYEES",
      message:
        "Departments with assigned employees cannot be deleted. Mark the department inactive instead.",
      statusCode: 409,
    });
  }

  const deletedDepartment = await withDepartmentWriteErrors(() =>
    deleteDepartment(id),
  );
  await createDepartmentAuditLog({
    ...auditContext,
    action: "DEPARTMENT_DELETED",
    entityId: deletedDepartment.id,
    metadata: {
      employeeCount,
      name: department.name,
    },
  });

  return toDepartmentDto(deletedDepartment);
};
