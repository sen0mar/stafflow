import type { Prisma } from "@prisma/client";

import { prisma } from "../../prisma/prisma.client";

type AuditMetadata = Prisma.InputJsonValue | undefined;
type AuditTx = Prisma.TransactionClient | typeof prisma;

export interface AuditLogInput {
  action: string;
  actorUserId: string | null;
  entityId?: string | null;
  entityType: string;
  ipAddress?: string;
  metadata?: AuditMetadata;
  tx?: AuditTx;
  userAgent?: string;
}

const redactedValue = "[REDACTED]";

const sensitiveKeyPattern =
  /(password|passcode|token|secret|cookie|hash|authorization|signedurl|signed_url|objectkey|object_key|r2objectkey|privateurl|private_url)/i;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const redactMetadataValue = (value: unknown, key?: string): unknown => {
  if (key && sensitiveKeyPattern.test(key)) {
    return redactedValue;
  }

  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactMetadataValue(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redactMetadataValue(entryValue, entryKey),
      ]),
    );
  }

  return value;
};

export const redactAuditMetadata = (metadata: AuditMetadata): AuditMetadata => {
  if (metadata === undefined) {
    return undefined;
  }

  return redactMetadataValue(metadata) as AuditMetadata;
};

export const createAuditLog = ({
  action,
  actorUserId,
  entityId = null,
  entityType,
  ipAddress,
  metadata,
  tx = prisma,
  userAgent,
}: AuditLogInput) =>
  tx.auditLog.create({
    data: {
      action,
      actorUserId,
      entityId,
      entityType,
      ipAddress,
      metadata: redactAuditMetadata(metadata),
      userAgent,
    },
    select: {
      id: true,
    },
  });
