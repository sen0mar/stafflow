# Security and Access

Business audit atomicity and file lifecycle belong to [data and storage](data-and-storage.md); deployment controls belong to [operations](operations.md). Verify public releases with the [demo safety checklist](../checklists/demo-safety.md).

## Auth and Collaboration Model

The MVP is for a single company and does not include real-time collaboration. Access control is based on authenticated user identity, role, permissions, and resource ownership. The portfolio deployment is demo-first: it can expose seeded credentials, but it must not expose public registration or public company onboarding.

Auth model:

- Auth is first-party, not Clerk/Auth0 for MVP.
- Users log in with email and password.
- There is no public `register`/`sign-up` route or login-page account creation flow.
- New users are created by admins inside the app, seeded by scripts, or activated through controlled invitation/password setup flows.
- Passwords are hashed with bcrypt; passwords and hashes are never logged or returned.
- Sessions are stored in PostgreSQL.
- Session cookies are HTTP-only and use `SameSite=None; Secure` in production; local/test cookies use `SameSite=Lax` without `Secure`.
- The database stores a hash of the session token, not the raw session token.
- Session invalidation must be possible after logout, password change, account disable, and suspicious activity.
- Frontend route guards are UX-only; the backend is the security boundary.
- Protected frontend routes mount only after `/auth/me` confirms a user. HTTP 401 is treated as unauthenticated, while network and non-401 failures show a full-page retry state without mounting the app shell. Logout clears cached auth state and navigates away only after the server confirms session revocation.
- Public demo uploads are disabled. Startup rejects upload enablement until enforceable quotas and automated cleanup exist; mutation rules are defined below.
- Public auth request bodies are JSON-only and bounded at validation. Missing-user login attempts perform the same cost-12 bcrypt comparison path as bad-password attempts.
- Login and invitation-acceptance traffic must be throttled at the provider edge across application instances. The production target is a Cloudflare-proxied API custom domain with the default Render hostname disabled; the deploy-time rule is documented under `deployment/`.
- Password recovery is deferred. The API exposes no public forgot-password or reset-password routes until email delivery, atomic single-use token consumption, seeded-demo-account protection, throttling, expiry cleanup, and end-to-end tests are delivered as one feature. The existing `PasswordResetToken` model and migrations remain temporarily to avoid an unnecessary destructive migration, but runtime code does not read or write that table. The 404 behavior and guarded non-persistence coverage are mapped under audit Section 06 in [regression matrix](../audits/audit-25-regression-matrix.md).
- Retained credential transitions are atomic database operations. Password changes compare-and-set the verified current hash before updating it, revoking every active session, and writing the audit record in one Prisma transaction. Invitation acceptance conditionally consumes one unexpired, unused token; requires any matching account to remain `INVITED` with the invitation's expected identity and role; and activates the account, revokes every session, and writes the audit record in the same transaction.
- Successful login persists the hashed session and the non-demo `lastLoginAt` update in one Prisma transaction. Demo-specific session behavior is defined below.
- Terminal auth rows have seven-day retention with strict cutoff semantics: maintenance deletes sessions whose `expiresAt` or `revokedAt` is older than the cutoff, invitation tokens whose `expiresAt` or `acceptedAt` is older, and retained legacy password-reset tokens whose `expiresAt` or `usedAt` is older. One atomic daily run uses one cutoff, preserves live/current/boundary rows, and is safe to retry.
- Newly generated invitation links carry the raw token only in the URL fragment. The acceptance page synchronously captures the fragment token into component memory and replaces browser history with the token-free path before any token-bearing API request; legacy query-token links remain transition-compatible but receive the same immediate scrub. Auth/session/CSRF responses and signed-payslip-URL responses use `Cache-Control: no-store`, and technical access logs redact legacy query tokens and exclude referrer headers.

## Public Demo Mutation Policy

When `DEMO_MODE=true`, the deployed public workspace is read-only for persistent business and identity data. The backend rejects every exposed non-read mutation across employees, departments, attendance, leave, payslips, settings, invitations, and password/profile changes with the stable `DEMO_READ_ONLY` error. This shared middleware is the security boundary; frontend-disabled controls and the demo banner are explanatory UX only.

Exact middleware, UI, attack-chain, and guarded route-matrix regressions are
mapped under audit Sections 03–04 in [regression matrix](../audits/audit-25-regression-matrix.md).

Login, logout, `/auth/me`, authenticated app configuration, GET routes, and the non-mutating CSRF bootstrap remain available. Login/logout are the bounded session lifecycle exception required to enter and leave the seeded demo. Demo login does not update `lastLoginAt`, and successful login atomically prunes stored sessions to the newest 100 rows per shared demo account while serializing concurrent logins for that account. The cap remains deliberately generous for shared portfolio access; it should not be lowered without observed concurrency evidence. Invitation generation/regeneration/acceptance and other credential or identity changes are blocked because they create tokens, sessions, audit entries, or lasting identity changes and can grow PostgreSQL. Existing authentication, CSRF, RBAC, ownership, validation, and upload protections remain in place; demo enforcement is additive and does not weaken private deployments.

Interactive public mutations may be enabled only after documenting enforceable quotas and implementing an automated full-state reset for the entire seeded workspace. The existing development reset helper is not sufficient for public mutation safety.

## Roles and authorization

MVP roles:

- `ADMIN` — can manage company employees, departments, attendance records, leave requests, payslips, settings, and audit logs.
- `EMPLOYEE` — can access and manage only their own attendance, leave requests, payslips, and allowed profile fields.

Future roles must be easy to add, but the MVP should not overbuild custom database permissions unless required. Start with a static permission map in code and resource policy checks.

Authorization layers:

1. `requireAuth` verifies the session and attaches `req.auth`.
2. `requirePermission(permission)` checks route-level access.
3. Feature policy files verify resource-specific ownership and self-vs-any behavior.
4. Services enforce business rules before persistence.

Examples:

- Employees must not be able to access another employee's payslip by guessing an ID.
- Employees must not be able to submit another employee's attendance or leave request.
- Admins can manage all records, but sensitive admin actions must create audit logs.
- Employee self routes should derive `employeeId` from `req.auth`, not from the request body.

## Request protection

- Never store auth tokens in localStorage or return session tokens in JSON.
- Use CSRF protection for state-changing cookie-authenticated requests.
- Never trust employeeId, userId, role, or permissions supplied by a caller for self-service identity or authorization.
- Signed payslip URLs require backend authorization and expire after five minutes; R2 objects remain private.
- Audit metadata redacts password, token, cookie, hash, authorization, signed URL, object key, secret, and private URL fields.

## Review risks

- Permission caching must not delay role changes.
- Review routes for guessed resource IDs, self-service identity spoofing, and broad payloads leaking salary or passwordHash.
- Verify production cookie/CORS/proxy behavior using [operations](operations.md).
- Invitation tokens must remain protected in browser history, referrers, access logs, and caches as well as storage.
