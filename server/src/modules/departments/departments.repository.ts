import type { Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import {
  createAuditLog,
  type AuditLogInput,
} from "../audit-logs/audit-log.service";
import type {
  CreateDepartmentInput,
  ListDepartmentsInput,
  UpdateDepartmentInput,
} from "./departments.schema";

export interface DepartmentListFilters extends ListDepartmentsInput {
  skip: number;
  take: number;
}

const departmentSelect = {
  _count: {
    select: {
      employees: true,
    },
  },
  createdAt: true,
  description: true,
  id: true,
  isActive: true,
  name: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

const getDepartmentWhere = ({
  isActive,
  search,
}: Pick<
  ListDepartmentsInput,
  "isActive" | "search"
>): Prisma.DepartmentWhereInput => ({
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

export const listDepartments = async ({
  isActive,
  search,
  skip,
  take,
}: DepartmentListFilters) => {
  const where = getDepartmentWhere({ isActive, search });

  const [items, total] = await Promise.all([
    prisma.department.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      select: departmentSelect,
      skip,
      take,
      where,
    }),
    prisma.department.count({ where }),
  ]);

  return { items, total };
};

export const findDepartmentById = (id: string) =>
  prisma.department.findUnique({
    select: departmentSelect,
    where: { id },
  });

export const findDepartmentByName = (name: string) =>
  prisma.department.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: { name },
  });

type DepartmentAuditLog = Omit<
  AuditLogInput,
  "entityId" | "entityType" | "metadata" | "tx"
>;

export const createDepartmentWithAuditLog = ({
  auditLog,
  input,
}: {
  auditLog: DepartmentAuditLog;
  input: CreateDepartmentInput;
}) =>
  prisma.$transaction(async (tx) => {
    const department = await tx.department.create({
      data: {
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        name: input.name,
      },
      select: departmentSelect,
    });

    await createAuditLog({
      ...auditLog,
      entityId: department.id,
      entityType: "Department",
      metadata: {
        isActive: department.isActive,
        name: department.name,
      },
      tx,
    });

    return department;
  });

export const updateDepartmentWithAuditLog = ({
  auditLog,
  current,
  id,
  input,
}: {
  auditLog: DepartmentAuditLog;
  current: {
    description: string | null;
    isActive: boolean;
    name: string;
  };
  id: string;
  input: UpdateDepartmentInput;
}) =>
  prisma.$transaction(async (tx) => {
    const department = await tx.department.update({
      data: {
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
      },
      select: departmentSelect,
      where: { id },
    });

    await createAuditLog({
      ...auditLog,
      entityId: department.id,
      entityType: "Department",
      metadata: {
        changedFields: Object.keys(input),
        from: current,
        to: {
          description: department.description,
          isActive: department.isActive,
          name: department.name,
        },
      },
      tx,
    });

    return department;
  });

export const deleteDepartmentWithAuditLog = ({
  auditLog,
  employeeCount,
  id,
  name,
}: {
  auditLog: DepartmentAuditLog;
  employeeCount: number;
  id: string;
  name: string;
}) =>
  prisma.$transaction(async (tx) => {
    const department = await tx.department.delete({
      select: departmentSelect,
      where: { id },
    });

    await createAuditLog({
      ...auditLog,
      entityId: department.id,
      entityType: "Department",
      metadata: { employeeCount, name },
      tx,
    });

    return department;
  });

export const countDepartmentEmployees = (departmentId: string) =>
  prisma.employee.count({
    where: { departmentId },
  });

export type DepartmentRecord = Awaited<ReturnType<typeof findDepartmentById>>;
