-- Add a focused index for newest-first audit log pagination.
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
