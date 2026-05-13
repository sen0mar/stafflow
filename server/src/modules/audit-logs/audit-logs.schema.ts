import { z } from "zod";

import { limitQuerySchema, pageQuerySchema } from "../../core/pagination/pagination";

export const auditLogIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listAuditLogsSchema = z.object({
  query: z
    .object({
      action: z.string().trim().min(1).max(120).optional(),
      actorUserId: z.string().trim().min(1).optional(),
      createdAtFrom: z.string().datetime().optional(),
      createdAtTo: z.string().datetime().optional(),
      entityId: z.string().trim().min(1).optional(),
      entityType: z.string().trim().min(1).max(120).optional(),
      limit: limitQuerySchema,
      page: pageQuerySchema,
    })
    .refine(
      (value) =>
        !value.createdAtFrom ||
        !value.createdAtTo ||
        new Date(value.createdAtFrom) <= new Date(value.createdAtTo),
      {
        message: "createdAtFrom must be before createdAtTo.",
        path: ["createdAtFrom"],
      },
    ),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>["query"];
