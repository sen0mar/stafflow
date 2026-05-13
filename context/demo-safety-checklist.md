# Demo Safety Checklist

Use this checklist before sharing the public portfolio demo and after any auth, storage, or deployment change.

## Access Model

- Public sign-up is not available. The backend exposes login, password reset, invitation acceptance, logout, password change, and `/auth/me`, but no `/auth/register` route.
- The login page must not include a registration CTA, create-account link, or company onboarding path.
- Company onboarding is intentionally absent. The demo is a single seeded workspace, not a self-service SaaS workspace.
- Users are created only by admin employee creation flows, controlled invitation/password setup flows, seed scripts, or the demo bootstrap script.

## Demo Upload Policy

- The public demo must run with:

```txt
DEMO_MODE=true
DEMO_UPLOADS_ENABLED=false
```

- If demo uploads are ever enabled, add strict per-demo quotas and automatic cleanup before enabling public traffic.
- Payslip uploads must stay authenticated, admin-only, CSRF-protected, PDF-only, size-limited, and validated before R2 writes.

## Private File Access

- Cloudflare R2 objects must remain private. Users access payslips only through backend endpoints that enforce auth, role permissions, and employee ownership.
- Payslip signed URLs are generated only after backend authorization and expire after 5 minutes.
- Do not log signed URLs, R2 object keys, cookies, auth headers, session tokens, reset tokens, invitation tokens, password hashes, or raw file data.

## Employee Restrictions

Employee users must not access:

- Admin-only endpoints, including employee management, attendance administration, payslip administration, settings, and audit logs.
- Other employees' records.
- Other employees' payslips or payslip download URLs.
- Audit logs.
- Settings mutations.

Frontend route guards are only UX. Backend RBAC and ownership checks are the security boundary.

## Audit And Logs

- Sensitive admin actions must create audit logs, including employee changes, attendance corrections, leave reviews, payslip upload/delete, settings changes, password changes, and password reset completion.
- Audit metadata is redacted before storage for sensitive key names such as password, token, cookie, hash, authorization, signed URL, object key, R2 object key, secret, and private URL.
- Pino technical logs redact sensitive request/response headers and common secret fields.

## Provider Monitoring

- Render logs: check backend deploy health, request failures, 5xx spikes, upload failures, and redaction behavior.
- Vercel deployment logs: check frontend build/deploy status, runtime errors, and API origin configuration.
- Neon usage monitoring: check connection, storage, compute, and query usage for abnormal public-demo activity.
- Cloudflare R2 usage checks: check object count, storage growth, and request volume; unexpected growth means disable uploads and rotate credentials if needed.
- Upstash usage checks: check rate-limit request volume, denied requests, and quota exhaustion.

## Deferred

- Sentry frontend/backend error tracking is deferred. Add it later only with explicit dependency install approval and environment setup.
