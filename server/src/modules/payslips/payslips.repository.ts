import type { PayslipStatus, Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import { createAuditLog } from "../audit-logs/audit-log.service";
import type {
  CreatePayslipInput,
  ListPayslipsInput,
  ListSelfPayslipsInput,
} from "./payslips.schema";

export interface PayslipListFilters extends ListPayslipsInput {
  skip: number;
  take: number;
}

export interface SelfPayslipListFilters extends ListSelfPayslipsInput {
  employeeId: string;
  skip: number;
  take: number;
}

export const payslipSelect = {
  contentType: true,
  createdAt: true,
  deletedAt: true,
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
  fileName: true,
  fileSize: true,
  id: true,
  month: true,
  r2ObjectKey: true,
  status: true,
  updatedAt: true,
  uploadedAt: true,
  uploadedBy: {
    select: {
      email: true,
      id: true,
    },
  },
  uploadedById: true,
  year: true,
} satisfies Prisma.PayslipSelect;

const activePayslipWhere = { status: "ACTIVE" as PayslipStatus };

const getPayslipWhere = ({
  employeeId,
  month,
  search,
  year,
}: Pick<
  ListPayslipsInput,
  "employeeId" | "month" | "search" | "year"
>): Prisma.PayslipWhereInput => ({
  ...activePayslipWhere,
  ...(employeeId ? { employeeId } : {}),
  ...(month ? { month } : {}),
  ...(year ? { year } : {}),
  ...(search
    ? {
        OR: [
          { fileName: { contains: search, mode: "insensitive" } },
          {
            employee: {
              employeeCode: { contains: search, mode: "insensitive" },
            },
          },
          {
            employee: { firstName: { contains: search, mode: "insensitive" } },
          },
          { employee: { lastName: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {}),
});

export const listPayslips = async ({
  employeeId,
  month,
  search,
  skip,
  take,
  year,
}: PayslipListFilters) => {
  const where = getPayslipWhere({ employeeId, month, search, year });

  const [items, total] = await Promise.all([
    prisma.payslip.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }, { uploadedAt: "desc" }],
      select: payslipSelect,
      skip,
      take,
      where,
    }),
    prisma.payslip.count({ where }),
  ]);

  return { items, total };
};

export const listSelfPayslips = async ({
  employeeId,
  month,
  skip,
  take,
  year,
}: SelfPayslipListFilters) => {
  const where = getPayslipWhere({ employeeId, month, year });

  const [items, total] = await Promise.all([
    prisma.payslip.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }, { uploadedAt: "desc" }],
      select: payslipSelect,
      skip,
      take,
      where,
    }),
    prisma.payslip.count({ where }),
  ]);

  return { items, total };
};

export const findPayslipById = (id: string) =>
  prisma.payslip.findUnique({
    select: payslipSelect,
    where: { id },
  });

export const findEmployeeForPayslip = (employeeId: string) =>
  prisma.employee.findUnique({
    select: {
      employeeCode: true,
      firstName: true,
      id: true,
      lastName: true,
      status: true,
    },
    where: { id: employeeId },
  });

export const createOrReplacePayslipWithAuditLog = async ({
  actorUserId,
  contentType,
  fileName,
  fileSize,
  input,
  ipAddress,
  r2ObjectKey,
  userAgent,
}: {
  actorUserId: string | null;
  contentType: string;
  fileName: string;
  fileSize: number;
  input: CreatePayslipInput;
  ipAddress?: string;
  r2ObjectKey: string;
  userAgent?: string;
}) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.payslip.findUnique({
      select: {
        id: true,
        r2ObjectKey: true,
        status: true,
      },
      where: {
        employeeId_year_month: {
          employeeId: input.employeeId,
          month: input.month,
          year: input.year,
        },
      },
    });

    const payslip = existing
      ? await tx.payslip.update({
          data: {
            contentType,
            deletedAt: null,
            fileName,
            fileSize,
            r2ObjectKey,
            status: "ACTIVE",
            uploadedAt: new Date(),
            uploadedById: actorUserId,
          },
          select: payslipSelect,
          where: { id: existing.id },
        })
      : await tx.payslip.create({
          data: {
            contentType,
            employeeId: input.employeeId,
            fileName,
            fileSize,
            month: input.month,
            r2ObjectKey,
            uploadedById: actorUserId,
            year: input.year,
          },
          select: payslipSelect,
        });

    await createAuditLog({
      action: existing ? "PAYSLIP_REPLACED" : "PAYSLIP_UPLOADED",
      actorUserId,
      entityId: payslip.id,
      entityType: "Payslip",
      ipAddress,
      metadata: {
        employeeId: input.employeeId,
        fileName,
        fileSize,
        month: input.month,
        replacement: Boolean(existing),
        year: input.year,
      },
      tx,
      userAgent,
    });

    return {
      oldObjectKey: existing?.r2ObjectKey ?? null,
      payslip,
    };
  });

export const deletePayslipWithAuditLog = async ({
  actorUserId,
  id,
  ipAddress,
  userAgent,
}: {
  actorUserId: string | null;
  id: string;
  ipAddress?: string;
  userAgent?: string;
}) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.payslip.findUniqueOrThrow({
      select: payslipSelect,
      where: { id },
    });

    const payslip = await tx.payslip.update({
      data: {
        deletedAt: new Date(),
        status: "DELETED",
      },
      select: payslipSelect,
      where: { id },
    });

    await createAuditLog({
      action: "PAYSLIP_DELETED",
      actorUserId,
      entityId: id,
      entityType: "Payslip",
      ipAddress,
      metadata: {
        employeeId: current.employeeId,
        fileName: current.fileName,
        month: current.month,
        year: current.year,
      },
      tx,
      userAgent,
    });

    return payslip;
  });

export type PayslipRecord = NonNullable<
  Awaited<ReturnType<typeof findPayslipById>>
>;
