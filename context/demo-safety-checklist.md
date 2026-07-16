# Demo Safety Checklist

Use this checklist before sharing the public portfolio demo and after any auth, storage, or deployment change.

## Access Model

- Public sign-up is not available. In demo mode the backend exposes login, logout, `/auth/me`, authenticated app configuration, read routes, and the non-mutating CSRF bootstrap; password reset, password change, and invitation mutations are blocked.
- The login page must not include a registration CTA, create-account link, or company onboarding path.
- Company onboarding is intentionally absent. The demo is a single seeded workspace, not a self-service SaaS workspace.
- Outside demo mode, users are created only by admin employee creation flows, controlled invitation/password setup flows, seed scripts, or the demo bootstrap script.

## Demo Read-Only Policy

- With `DEMO_MODE=true`, the backend must return `DEMO_READ_ONLY` for every persistent business or identity mutation across auth, employees, departments, attendance, leave, payslips, and settings.
- Login and logout are the bounded session lifecycle exception. GET routes, `/auth/me`, authenticated app configuration, and the non-mutating CSRF bootstrap remain available.
- Demo login skips the persistent `lastLoginAt` update and retains at most the newest 100 session rows per shared demo account after each successful login.
- Public auth mutations accept JSON only, enforce bounded email/password/token inputs, and keep missing-email login failures on a fixed cost-12 bcrypt comparison path.
- Verify the Cloudflare public-auth rate-limit rule from `deployment/public-auth-edge-throttling.md` is active and the bypassable Render default hostname is disabled before treating brute-force volume as externally bounded.
- Forgot/reset-password, password change, invitation create/regenerate/accept, and profile changes are blocked because they mutate credentials/identity or can grow token, session, audit, and application tables.
- The MVP exposes no general `/users/:id` role or status mutation route. Public demo credentials cannot elevate an identity to `ADMIN`.
- A concise authenticated banner explains the policy and mutation controls are disabled or hidden, but the API middleware is the security boundary. Blocked requests must not reach controllers, repositories, storage writes, or audit writes.
- Interactive public mutations require documented quotas plus an automated full-state reset for the seeded workspace before they can be enabled. The development-only user reset script is not an adequate public reset mechanism.

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

## Deferred

- Sentry frontend/backend error tracking is deferred. Add it later only with explicit dependency install approval and environment setup.
