# Demo Safety Checklist

Use before sharing the public demo and after auth, storage, or deployment changes. The authoritative policy is [security](../architecture/security.md); code evidence is in the [regression matrix](../audits/audit-25-regression-matrix.md). Provider activation requires the separate [deployment verification checklist](../../deployment/verification-checklist.md).

## Application checks

- Verify no public registration, company onboarding, or password-recovery routes/CTAs exist.
- Exercise the demo mutation route matrix: persistent business/identity mutations return `DEMO_READ_ONLY` before controller, database, storage, or audit writes. Verify the documented session exceptions and bounded demo session lifecycle.
- Verify the demo banner and disabled/hidden mutation controls explain read-only behavior.
- Run with `DEMO_MODE=true` and `DEMO_UPLOADS_ENABLED=false`; verify upload enablement fails startup until policy prerequisites are implemented.
- Verify PDF uploads in private mode require auth, admin permission, CSRF protection, type/size/multipart limits, and validation before storage writes.
- Attempt cross-employee attendance, leave, profile, and payslip access; verify admin endpoints, settings mutations, and audit logs remain inaccessible to employees.
- Verify private R2 objects and authorized five-minute download URLs; inspect logs for token, object-key, file-content, and signed-URL leakage.
- Verify sensitive changes and audit records commit together, and sensitive audit metadata is redacted. See [data and storage](../architecture/data-and-storage.md).

## Provider checks

- Verify the Cloudflare public-auth throttling rule is active and the default Render hostname cannot bypass it: [edge throttling](../../deployment/public-auth-edge-throttling.md).
- Verify the daily auth maintenance cron has the correct pooled database URL and a successful run within 24 hours: [auth maintenance](../../deployment/auth-table-maintenance.md).
- Verify private R2 configuration and daily soft-deleted-object retry activation: [storage maintenance](../../deployment/payslip-storage-maintenance.md).
- Keep Render's platform check on `/health`; monitor `/ready` separately. Review deploy failures, 5xx spikes, upload errors, graceful shutdown, and redaction behavior.
- Check Vercel build/deploy health and API origin configuration; monitor Neon connections/storage/compute/query usage and R2 object count/storage/request volume.
- Investigate unexpected R2 growth; disable uploads and rotate credentials if needed. Record provider verification externally without secrets, object keys, or signed URLs.

Repository tests/configuration do not establish that provider controls are active. Sentry remains deferred pending explicit dependency-install approval and environment setup.
