-- Add indexes for standardized list-page filters and sorting.
CREATE INDEX "AttendanceRecord_status_date_idx" ON "AttendanceRecord"("status", "date");

CREATE INDEX "LeaveRequest_leaveTypeId_createdAt_idx" ON "LeaveRequest"("leaveTypeId", "createdAt");

CREATE INDEX "Payslip_status_year_month_uploadedAt_idx" ON "Payslip"("status", "year", "month", "uploadedAt");

CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

CREATE INDEX "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");
