import type { Prisma } from "@prisma/client";
import { fixturePrefix } from "./fixtures";

export const audit = (
  actorUserId: string,
  id: string,
  action: string,
  entityType: string,
  entityId: string,
  createdAt: Date,
): Prisma.AuditLogCreateManyInput => ({
  id: `${fixturePrefix}-audit-${id}`,
  actorUserId,
  action,
  entityType,
  entityId,
  createdAt,
  metadata: { fictional: true, source: "demo-seed" },
});
