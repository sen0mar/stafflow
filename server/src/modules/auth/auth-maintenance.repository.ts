import { prisma } from "../../prisma/prisma.client";

export const authTerminalRecordRetentionMs = 7 * 24 * 60 * 60 * 1000;

export interface AuthMaintenanceResult {
  cutoff: Date;
  invitationTokensDeleted: number;
  passwordResetTokensDeleted: number;
  sessionsDeleted: number;
}

export const getAuthMaintenanceCutoff = (now = new Date()) =>
  new Date(now.getTime() - authTerminalRecordRetentionMs);

// A row is eligible only when a terminal timestamp is strictly older than the
// shared cutoff. Keeping equality makes retries deterministic at the boundary.
export const deleteRetainedAuthRecords = async (
  cutoff: Date,
): Promise<AuthMaintenanceResult> =>
  prisma.$transaction(async (tx) => {
    const sessions = await tx.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }],
      },
    });
    const invitationTokens = await tx.invitationToken.deleteMany({
      where: {
        OR: [{ acceptedAt: { lt: cutoff } }, { expiresAt: { lt: cutoff } }],
      },
    });
    const passwordResetTokens = await tx.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: cutoff } }, { usedAt: { lt: cutoff } }],
      },
    });

    return {
      cutoff,
      invitationTokensDeleted: invitationTokens.count,
      passwordResetTokensDeleted: passwordResetTokens.count,
      sessionsDeleted: sessions.count,
    };
  });
