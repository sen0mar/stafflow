import type { Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
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
}: Pick<ListDepartmentsInput, "isActive" | "search">): Prisma.DepartmentWhereInput => ({
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

export const createDepartment = (input: CreateDepartmentInput) =>
  prisma.department.create({
    data: {
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      name: input.name,
    },
    select: departmentSelect,
  });

export const updateDepartment = (id: string, input: UpdateDepartmentInput) =>
  prisma.department.update({
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

export const deleteDepartment = (id: string) =>
  prisma.department.delete({
    select: departmentSelect,
    where: { id },
  });

export const countDepartmentEmployees = (departmentId: string) =>
  prisma.employee.count({
    where: { departmentId },
  });

export const createDepartmentAuditLog = ({
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
  prisma.auditLog.create({
    data: {
      action,
      actorUserId,
      entityId,
      entityType: "Department",
      ipAddress,
      metadata,
      userAgent,
    },
    select: {
      id: true,
    },
  });

export type DepartmentRecord = Awaited<ReturnType<typeof findDepartmentById>>;
