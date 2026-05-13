import type { Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";
import type { ListAuditLogsInput } from "./audit-logs.schema";

export interface AuditLogListFilters extends ListAuditLogsInput {
  skip: number;
  take: number;
}

export const auditLogSelect = {
  action: true,
  actorUser: {
    select: {
      email: true,
      id: true,
      role: true,
      status: true,
    },
  },
  actorUserId: true,
  createdAt: true,
  entityId: true,
  entityType: true,
  id: true,
  ipAddress: true,
  metadata: true,
  userAgent: true,
} satisfies Prisma.AuditLogSelect;

const getCreatedAtFilter = ({
  createdAtFrom,
  createdAtTo,
}: Pick<
  ListAuditLogsInput,
  "createdAtFrom" | "createdAtTo"
>): Prisma.DateTimeFilter | undefined => {
  if (!createdAtFrom && !createdAtTo) {
    return undefined;
  }

  return {
    ...(createdAtFrom ? { gte: new Date(createdAtFrom) } : {}),
    ...(createdAtTo ? { lte: new Date(createdAtTo) } : {}),
  };
};

const getAuditLogWhere = ({
  action,
  actorUserId,
  createdAtFrom,
  createdAtTo,
  entityId,
  entityType,
}: ListAuditLogsInput): Prisma.AuditLogWhereInput => ({
  ...(action ? { action } : {}),
  ...(actorUserId ? { actorUserId } : {}),
  ...(entityId ? { entityId } : {}),
  ...(entityType ? { entityType } : {}),
  ...(getCreatedAtFilter({ createdAtFrom, createdAtTo })
    ? { createdAt: getCreatedAtFilter({ createdAtFrom, createdAtTo }) }
    : {}),
});

export const listAuditLogs = async ({
  action,
  actorUserId,
  createdAtFrom,
  createdAtTo,
  entityId,
  entityType,
  skip,
  take,
}: AuditLogListFilters) => {
  const where = getAuditLogWhere({
    action,
    actorUserId,
    createdAtFrom,
    createdAtTo,
    entityId,
    entityType,
    limit: take,
    page: Math.floor(skip / take) + 1,
  });

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      select: auditLogSelect,
      skip,
      take,
      where,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total };
};

export const findAuditLogById = (id: string) =>
  prisma.auditLog.findUnique({
    select: auditLogSelect,
    where: { id },
  });

export type AuditLogRecord = NonNullable<
  Awaited<ReturnType<typeof findAuditLogById>>
>;
