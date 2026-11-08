# Data and Storage

## Storage Model

- **PostgreSQL / Neon** stores relational application data:
  - Users, sessions, employee profiles, departments, attendance records, leave types, leave requests, leave balances, payslip metadata, company settings, audit logs, invitation tokens, and the retained but runtime-unused password-reset table.
  - Company, attendance, and leave settings are deterministic singleton rows with stable IDs (`company-settings`, `attendance-settings`, and `leave-settings`). Readers use those IDs directly, first access uses idempotent upserts, and database check constraints reject any other settings ID. The singleton migration aborts before changes if a legacy table has duplicates; cleanup is never selected, merged, or deleted implicitly.
- **Cloudflare R2** stores large private files:
  - Payslip PDFs and future employee documents.
  - PostgreSQL stores only metadata and the R2 object key, not the file contents.
  - The server lazily configures one private R2 client per process. Soft-deleted payslip metadata retains its key so an idempotent manual/daily maintenance command can retry failed object deletion; missing objects count as successful cleanup.
- **Render stdout logs** store structured technical logs emitted by Pino:
  - Operational logs are not a source of business truth.
- **PostgreSQL AuditLog** stores business/security history:
  - Admin changes, attendance corrections, leave approvals/rejections, payslip uploads/deletions, role changes, password changes, and account status changes.

Large PDFs must not be stored in PostgreSQL. Access/demo policy belongs to [security](security.md); technical log redaction belongs to [operations](operations.md#technical-logging).

## Database changes and atomicity

Use Prisma migrations only. Never run `prisma db push`, reset/drop a database, delete migrations, or execute destructive SQL unless explicitly requested. Use Neon's pooled URL for runtime traffic and direct URL for migrations.

Leave overlap checks, expected-status transitions, balance changes, and review audits commit atomically, using serializable transactions with bounded serialization retries for balance changes.

Every audit-worthy database mutation uses the same transaction client for its audit record and any related session revocation. Audit-worthy changes include employee/profile/account changes, departments, leave types, attendance corrections, leave reviews, payslip changes, password changes, and settings.

For R2 and database operations, clean up a new object if metadata persistence fails; retain recoverable metadata when deletion fails. Return safe errors for unavailable files.

Validate PDF type, size, multipart limits, and sanitized bounded display filenames before writing to R2. See [security](security.md) for access and demo restrictions and [operations](operations.md) for cleanup scheduling.

## Review risks

Exercise both partial-failure directions: an uploaded object without committed metadata, and committed metadata whose object is unavailable. Ensure the scheduled deletion retry is active; repository configuration alone does not prove cleanup runs.
