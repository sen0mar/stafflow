# Architecture Context

## Stack

| Layer                | Technology                        | Role                                                                                                               |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Frontend             | React + TypeScript + Vite         | Authenticated single-page web app for admins and employees                                                         |
| Routing              | React Router                      | Protected app routes and feature pages                                                                             |
| UI                   | Tailwind CSS + shadcn/ui          | Styling, reusable primitives, dashboard components                                                                 |
| Server state         | TanStack Query                    | API fetching, caching, invalidation, loading/error state                                                           |
| Client state         | Zustand                           | Lightweight UI/application state such as sidebar, theme, filters, and local preferences                            |
| Forms and validation | React Hook Form + Zod             | Form state, client validation, shared schema-style validation where useful                                         |
| API                  | Node.js + Express.js + TypeScript | REST API, auth/session handling, RBAC, business workflows                                                          |
| Database             | PostgreSQL on Neon                | Relational data for users, employees, departments, attendance, leave, payslips, settings, sessions, and audit logs |
| ORM                  | Prisma                            | Type-safe database access, schema modeling, migrations                                                             |
| Auth                 | First-party session auth          | Email/password login, database-backed sessions, HTTP-only secure cookies, no public registration                   |
| Password hashing     | bcrypt                            | Password hashing with a tuned cost factor                                                                          |
| File storage         | Cloudflare R2                     | Payslip PDF storage and future private file objects, protected from public-demo abuse                              |
| Logging              | Pino + `pino-http`                | Structured technical logs and request logs                                                                         |
| Frontend hosting     | Vercel                            | Client deployment                                                                                                  |
| Backend hosting      | Render                            | Express API deployment                                                                                             |
| Domain model         | One custom domain with subdomains | Example: `app.company.com` for frontend and `api.company.com` for backend                                          |
| Public demo model    | Seeded read-only workspace        | Visitors can log in and browse seeded data; demo mode rejects persistent business and identity mutations           |

## System Boundaries

- `client/src/app` — App composition: router, providers, query client, global guards, and app shell wiring.
- `client/src/shared` — Reusable UI, layout components, utility functions, shared hooks, API client wrapper, permission helpers, and shared types.
- `client/src/features` — Feature modules: auth, employees, departments, attendance, leave, payslips, settings, and audit logs.
- `server/src/app.ts` — Express app composition: middleware, CORS, cookies, security headers, routing, and error handling.
- `server/src/server.ts` — Server bootstrap only: environment validation, port binding, graceful shutdown hooks if needed.
- `server/src/core` — Shared backend infrastructure: environment config, errors, logging, auth/session middleware, RBAC middleware, CSRF, request IDs, pagination, and utilities.
- `server/src/modules` — Backend feature modules: each module owns routes, controllers, services, repositories, schemas, and policies.
- `server/src/prisma` — Prisma client singleton and database-related infrastructure.
- `prisma` — Prisma schema and migrations.
- `storage` / R2 integration module — Cloudflare R2 client, upload helpers, delete helpers, signed URL helpers, and file validation.
- `scripts` — Database seeding, demo user seeding, admin bootstrap, local utilities, and maintenance scripts.

Backend request flow:

1. Route receives request.
2. Input is validated with Zod or a feature schema.
3. Auth middleware attaches `req.auth` when required.
4. RBAC middleware verifies broad permission.
5. Resource policy checks verify ownership or self-vs-any access when needed.
6. Controller calls service.
7. Service applies business rules and calls repository/storage helpers.
8. Repository performs Prisma queries using safe `select`/`include` patterns.
9. Controller returns a consistent response shape.

Controllers must stay thin. Services own business rules. Repositories own database access. Policies own resource-specific authorization checks.

## Storage Model

- **PostgreSQL / Neon** stores relational application data:
  - Users, sessions, employee profiles, departments, attendance records, leave types, leave requests, leave balances, payslip metadata, company settings, audit logs, invitation tokens, and the retained but runtime-unused password-reset table.
- **Cloudflare R2** stores large private files:
  - Payslip PDFs and future employee documents.
  - PostgreSQL stores only metadata and the R2 object key, not the file contents.
  - The server lazily configures one private R2 client per process. Soft-deleted payslip metadata retains its key so an idempotent manual/daily maintenance command can retry failed object deletion; missing objects count as successful cleanup.
- **Render stdout logs** store structured technical logs emitted by Pino:
  - Operational logs are not a source of business truth.
- **PostgreSQL AuditLog** stores business/security history:
  - Admin changes, attendance corrections, leave approvals/rejections, payslip uploads/deletions, role changes, password changes, and account status changes.

Never store large PDFs directly in PostgreSQL. Never log raw file contents, passwords, cookies, session tokens, reset tokens, or signed R2 URLs with sensitive query parameters. Public demo deployments must not expose unrestricted R2 writes.

## Auth and Collaboration Model

The MVP is for a single company and does not include real-time collaboration. Access control is based on authenticated user identity, role, permissions, and resource ownership. The portfolio deployment is demo-first: it can expose seeded credentials, but it must not expose public registration or public company onboarding.

Auth model:

- Auth is first-party, not Clerk/Auth0 for MVP.
- Users log in with email and password.
- There is no public `register`/`sign-up` route or login-page account creation flow.
- New users are created by admins inside the app, seeded by scripts, or activated through controlled invitation/password setup flows.
- Passwords are hashed with bcrypt.
- Sessions are stored in PostgreSQL.
- Session cookies are HTTP-only, secure in production, and use `SameSite=Lax` when frontend and API are under the same parent domain.
- The database stores a hash of the session token, not the raw session token.
- Session invalidation must be possible after logout, password change, account disable, and suspicious activity.
- Frontend route guards are UX-only; the backend is the security boundary.
- Public demo mode must prevent storage abuse through disabled uploads, strict quotas, automatic cleanup, or another explicit guardrail before unrestricted R2 writes are exposed.
- Public demo mode must reject employee/account creation, invitation generation and acceptance, account-status mutations, and account elevation with `DEMO_READ_ONLY`.
- Public auth request bodies are JSON-only and bounded at validation. Missing-user login attempts perform the same cost-12 bcrypt comparison path as bad-password attempts.
- Login and invitation-acceptance traffic must be throttled at the provider edge across application instances. The production target is a Cloudflare-proxied API custom domain with the default Render hostname disabled; the deploy-time rule is documented under `deployment/`.
- Password recovery is deferred. The API exposes no public forgot-password or reset-password routes until email delivery, atomic single-use token consumption, seeded-demo-account protection, throttling, expiry cleanup, and end-to-end tests are delivered as one feature. The existing `PasswordResetToken` model and migrations remain temporarily to avoid an unnecessary destructive migration, but runtime code does not read or write that table.
- Retained credential transitions are atomic database operations. Password changes compare-and-set the verified current hash before updating it, revoking every active session, and writing the audit record in one Prisma transaction. Invitation acceptance conditionally consumes one unexpired, unused token; requires any matching account to remain `INVITED` with the invitation's expected identity and role; and activates the account, revokes every session, and writes the audit record in the same transaction.
- Successful login persists the hashed session and the non-demo `lastLoginAt` update in one Prisma transaction. Demo login keeps `lastLoginAt` unchanged and serializes per-user session creation/pruning so concurrent shared-account logins cannot exceed the 100-row cap.
- Terminal auth rows have seven-day retention with strict cutoff semantics: maintenance deletes sessions whose `expiresAt` or `revokedAt` is older than the cutoff, invitation tokens whose `expiresAt` or `acceptedAt` is older, and retained legacy password-reset tokens whose `expiresAt` or `usedAt` is older. One atomic daily run uses one cutoff, preserves live/current/boundary rows, and is safe to retry.
- Newly generated invitation links carry the raw token only in the URL fragment. The acceptance page synchronously captures the fragment token into component memory and replaces browser history with the token-free path before any token-bearing API request; legacy query-token links remain transition-compatible but receive the same immediate scrub. Auth/session/CSRF responses and signed-payslip-URL responses use `Cache-Control: no-store`, and technical access logs redact legacy query tokens and exclude referrer headers.

### Public Demo Mutation Policy

When `DEMO_MODE=true`, the deployed public workspace is read-only for persistent business and identity data. The backend rejects every exposed non-read mutation across employees, departments, attendance, leave, payslips, settings, invitations, and password/profile changes with the stable `DEMO_READ_ONLY` error. This shared middleware is the security boundary; frontend-disabled controls and the demo banner are explanatory UX only.

Login, logout, `/auth/me`, authenticated app configuration, GET routes, and the non-mutating CSRF bootstrap remain available. Login/logout are the bounded session lifecycle exception required to enter and leave the seeded demo. Demo login does not update `lastLoginAt`, and successful login atomically prunes stored sessions to the newest 100 rows per shared demo account while serializing concurrent logins for that account. The cap remains deliberately generous for shared portfolio access; it should not be lowered without observed concurrency evidence. Invitation generation/regeneration/acceptance and other credential or identity changes are blocked because they create tokens, sessions, audit entries, or lasting identity changes and can grow PostgreSQL. Existing authentication, CSRF, RBAC, ownership, validation, and upload protections remain in place; demo enforcement is additive and does not weaken private deployments.

Interactive public mutations may be enabled only after documenting enforceable quotas and implementing an automated full-state reset for the entire seeded workspace. The existing development reset helper is not sufficient for public mutation safety.

MVP roles:

- `ADMIN` — can manage company employees, departments, attendance records, leave requests, payslips, settings, and audit logs.
- `EMPLOYEE` — can access and manage only their own attendance, leave requests, payslips, and allowed profile fields.

Future roles must be easy to add, but the MVP should not overbuild custom database permissions unless required. Start with a static permission map in code and resource policy checks.

Authorization layers:

1. `requireAuth` verifies the session and attaches `req.auth`.
2. `requirePermission(permission)` checks route-level access.
3. Feature policy files verify resource-specific ownership and self-vs-any behavior.
4. Services enforce business rules before persistence.

### Leave Request Date Policy

For the simple MVP, leave duration is the inclusive count of calendar dates from
the start date through the end date. Weekends and holidays are included; the MVP
does not maintain a business-day or holiday calendar. A request must start and
end in the same UTC calendar year and may span at most 365 inclusive calendar
days. This keeps each approved request attributable to one annual balance and
prevents a duration outside the supported product and database bounds from
reaching Prisma.

### Calendar Date and Timestamp Contracts

Calendar values use PostgreSQL `date` columns and `YYYY-MM-DD` API strings:
`Employee.hireDate`, `Employee.terminationDate`, `AttendanceRecord.date`,
`LeaveRequest.startDate`, and `LeaveRequest.endDate`. Server and client code
must parse and format these through explicit date-only helpers; a bare
`YYYY-MM-DD` must never be passed through browser-local `Date` conversion.

All other Prisma `DateTime` fields are instants and use ISO timestamps,
including authentication/session lifecycle times, clock-in/out times,
created/updated/reviewed/uploaded/deleted times, and audit-log timestamps.
Attendance date filters accept inclusive date-only bounds. The current
attendance date is derived from the company IANA timezone and then persisted as
the resulting calendar date; Section 11 schedule, status, and concurrency
behavior remains instant-based and unchanged.

### Attendance Self Clock Policy

Employee self clock actions use the company IANA timezone for the attendance
calendar date, weekday, scheduled start, and scheduled end. The linked employee
must be active, and the local weekday must be included in
`weeklyWorkingDays`. `allowEmployeeClockIn` controls new self clock-ins; it does
not prevent an already clocked-in employee from closing that record.

Automatic self attendance uses the precedence `PARTIAL` over `LATE` over
`PRESENT`. Clock-in is `LATE` only when it occurs after `workdayStart` plus
`lateGracePeriodMinutes`. At clock-out, a record is `PARTIAL` when its elapsed
minutes are below `workdayMinutes` or clock-out occurs before `workdayEnd`;
otherwise its prior `LATE` state is preserved, and the remaining result is
`PRESENT`. The MVP supports same-day schedules only; overnight shifts and
holiday calendars remain out of scope.

The existing unique employee/date constraint is the clock-in concurrency
boundary and duplicate inserts map to HTTP 409. Clock-out conditionally updates
only a record whose `clockOutAt` is still null and requires exactly one updated
row, so stale or concurrent repeats also map to HTTP 409 without overwriting the
first committed time.

Examples:

- Employees must not be able to access another employee's payslip by guessing an ID.
- Employees must not be able to submit another employee's attendance or leave request.
- Admins can manage all records, but sensitive admin actions must create audit logs.
- Employee self routes should derive `employeeId` from `req.auth`, not from the request body.

## Feature Module Model

Frontend features should be organized by domain:

- `auth`
- `dashboard`
- `employees`
- `departments`
- `attendance`
- `leave`
- `payslips`
- `settings`
- `audit-logs`

Each frontend feature may contain:

- `api` — fetch-based API functions and TanStack Query keys.
- `components` — feature-specific presentational and interactive components.
- `hooks` — feature-specific hooks and query/mutation wrappers.
- `pages` — route-level page components.
- `schemas` — Zod schemas and form validation.
- `types` — feature-local types.
- `stores` — Zustand stores only when local/global client state is truly needed.

Backend modules should mirror the domain structure:

- `auth`
- `employees`
- `departments`
- `attendance`
- `leave`
- `payslips`
- `settings`
- `audit-logs`

Each backend module may contain:

- `*.routes.ts`
- `*.controller.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.schema.ts`
- `*.policy.ts`

Do not group all controllers, services, and repositories into global folders. Keep domain code close together.

## API and Data Flow Model

The API is REST-based. GraphQL is out of scope for the MVP.

API rules:

- Use JSON request/response bodies except file uploads.
- Use `multipart/form-data` for payslip uploads.
- Use pagination on all list endpoints.
- Accept pagination pages only as safe integers from 1 through 10,000; with the shared 100-row limit ceiling, Prisma offsets therefore remain finite and safely bounded.
- Use search and filters through query parameters.
- Bound API IDs to 128 characters, search terms to 200 characters, emails to 254 characters, and public invitation tokens to 128 characters through shared boundary schemas.
- Use consistent error responses.
- Use `fetch` on the frontend through a small typed API wrapper. Do not use Axios.
- Include credentials in frontend requests because auth uses cookies.
- Keep API response payloads narrow; return only fields needed by the current view.

Expected high-level route groups:

- `/auth/*`
  - No public `/auth/register` endpoint for the MVP/demo.
- `/employees/*`
- `/departments/*`
- `/attendance/*`
- `/leave-types/*`
- `/leave-requests/*`
- `/payslips/*`
- `/settings/*`
- `/audit-logs/*`

## Performance Model

The app should feel fast under normal single-company usage. Performance is achieved through bounded data access, caching, and clean rendering — not by overengineering early.

Frontend performance rules:

- Use TanStack Query for server state and cache invalidation.
- Use Zustand only for client/UI state.
- Avoid fetching all records when a paginated table is needed.
- Use route-level code splitting where appropriate.
- Use skeleton states for slow network actions.
- Debounce search inputs.
- Memoize expensive derived values only when there is a measured or obvious benefit.
- Virtualize large tables when row counts can become large.
- Keep feature components small and reusable.

Backend/database performance rules:

- All list endpoints are paginated.
- Use Prisma `select` to avoid overfetching sensitive or unnecessary fields.
- Avoid N+1 queries.
- Add indexes for common filters and joins.
- Log slow requests and slow database paths.
- Keep heavy calculations out of page-load endpoints where possible.
- Do not upload files to R2 before authentication, authorization, and file validation.

Important indexes to consider early:

- `User.email`
- `Session.tokenHash`
- `Employee.userId`
- `Employee.departmentId`
- `Employee.employeeCode`
- `Employee.status`
- `AttendanceRecord.employeeId + date`
- `LeaveRequest.employeeId + status`
- `LeaveRequest.status + createdAt`
- `Payslip.employeeId + year + month`
- `AuditLog.actorUserId + createdAt`
- `AuditLog.entityType + entityId`

## Deployment and Environment Model

Production target:

- Frontend on Vercel.
- Backend on Render.
- Database on Neon PostgreSQL.
- File storage on Cloudflare R2.

Recommended domain setup:

- Buy one domain.
- Use `app.<domain>` for the Vercel frontend.
- Use `api.<domain>` for the Render backend.
- Configure CORS to allow only the exact frontend origin.
- Configure the Vercel frontend with `VITE_API_URL` pointing at the Render API origin unless production uses the documented `app.<domain>` and `api.<domain>` sibling-subdomain pattern.
- Configure frontend `fetch` with `credentials: "include"`.
- Production auth cookies use `SameSite=None; Secure` so credentialed Vercel-to-Render requests can carry the HTTP-only session cookie.
- Auth responses may include a non-secret CSRF token for state-changing requests; the session token must remain HTTP-only and never be returned in JSON.
- Configure Express `trust proxy` correctly on Render so secure cookies and client IPs work as intended.
- Activate and verify the provider-level public-auth rate-limit rule in `deployment/public-auth-edge-throttling.md`; repository code does not imply that external Cloudflare state is active.
- Activate and verify the daily Render auth-table maintenance cron declared in `render.yaml` by following `deployment/auth-table-maintenance.md`; repository configuration does not prove that the external cron service or its database secret is active.
- Activate and verify the daily Render payslip-storage maintenance cron declared in `render.yaml` by following `deployment/payslip-storage-maintenance.md`; it requires private R2 credentials and retries only soft-deleted payslip objects.
- Keep the baseline Vercel browser headers aligned in both Vercel configurations. CSP remains deployment-specific until the concrete frontend, API, and R2 preview origins are known; follow `deployment/browser-security-headers.md` rather than shipping guessed or wildcard directives.

Environment variables must be validated at server startup. Missing required variables should fail fast.

Expected backend environment groups:

- App URLs and environment mode.
- Database URLs: pooled `DATABASE_URL` and direct `DIRECT_URL` for migrations.
- Session/cookie secrets.
- Cloudflare R2 credentials and bucket config.
- Email provider credentials once email-backed invitations or password recovery are implemented.
- Demo-mode flags, if used, such as `DEMO_MODE`, `DEMO_UPLOADS_ENABLED`, upload quotas, or cleanup settings.

## Complex Patterns and Failure Modes

Auth/session risks:

- Public registration is accidentally added and lets visitors create fresh accounts or company workspaces.
- Demo admin access allows unrestricted mutations or storage-consuming actions without guardrails.
- Demo admin access creates or activates a reusable private identity, changes account status, or elevates a role.
- Cookies fail in production because custom domains, CORS, `credentials: "include"`, `SameSite`, or `trust proxy` are misconfigured.
- Role changes do not take effect if permissions are cached incorrectly.
- Session tokens are stored raw instead of hashed.
- Password hashes, cookies, or reset tokens are accidentally logged.
- Password reset and invitation tokens are stored unsafely.
- Invitation tokens remain in query-string history or leak through referrer/request access logs, or sensitive auth and signed-download responses are cached.

RBAC/resource-access risks:

- Frontend hides buttons but backend does not enforce permissions.
- Employee IDs from the request body are trusted for self-service routes.
- Employees access another employee's payslip, attendance, or leave request by guessing an ID.
- Admin actions are not audit logged.
- Sensitive fields such as salary or passwordHash leak through broad API responses.
- Concurrent leave creation or review bypasses overlap/status checks, loses a shared balance update, duplicates an audit event, or commits request and balance state inconsistently.

Performance risks:

- Employee, attendance, leave, audit, or payslip lists are returned without pagination.
- Prisma `include` loads too many nested relations.
- Tables render thousands of rows without pagination or virtualization.
- Search fires on every keystroke without debounce.
- File upload endpoints perform expensive work before validation.

Storage risks:

- Public portfolio visitors consume R2 storage through unrestricted demo uploads.
- Payslip PDFs are stored in PostgreSQL instead of R2.
- R2 object keys are predictable without adequate authorization checks.
- Signed URLs live too long or are exposed in logs.
- R2 uploads succeed but database writes fail, leaving orphan files.
- Database writes succeed but R2 operations fail, leaving broken metadata.
- Private R2 keys or signed URLs reach technical logs during storage failures.
- Soft-deleted payslip objects remain in R2 because the deletion retry command or its scheduled deployment is inactive.

Operational risks:

- Demo seed data is missing, stale, or not reset, making the public demo confusing or abusable.
- An audit-worthy database mutation commits separately from its audit row, leaving a sensitive change without its required business record when auditing fails.
- Logs are unstructured or inconsistent.
- Request IDs are missing, making production debugging difficult.
- Untrusted request IDs reach logs or response headers; incoming IDs must be 1-64 ASCII characters matching `[A-Za-z0-9][A-Za-z0-9._:-]*`, otherwise the API generates a UUID.
- Technical logs and audit logs are treated as the same thing.
- Environment variables are missing or inconsistent across Vercel, Render, Neon, and R2.

## Invariants

1. Backend auth, RBAC, and resource ownership checks are mandatory for protected data.
2. Frontend route guards and hidden buttons are never treated as security controls.
3. Employee self-service routes derive identity from `req.auth`, not from request body parameters.
4. Controllers stay thin; services own business rules; repositories own Prisma access.
5. All list endpoints are paginated unless explicitly documented otherwise.
6. Prisma queries must avoid unnecessary fields and obvious N+1 patterns.
7. Passwords are hashed with bcrypt and never logged or returned.
8. Session tokens are stored hashed in the database and sent only through HTTP-only cookies.
9. Large private files are stored in Cloudflare R2, not PostgreSQL.
10. Sensitive admin actions create audit log entries.
11. Technical logs use Pino and redact secrets, cookies, tokens, and password fields.
12. CORS, cookies, and proxy settings must be verified in production-like deployment.
13. The MVP supports `ADMIN` and `EMPLOYEE`; future roles must be possible without rewriting the whole auth model.
14. Public self-registration is not allowed; account creation is admin-only, seeded, or controlled by invitation/password setup.
15. Public demo deployments must protect Cloudflare R2 from unrestricted uploads and storage abuse.
16. Public demo deployments must enforce `DEMO_READ_ONLY` on identity-persistence mutations; frontend hiding is not a security control.
17. Leave request overlap checks, expected-status transitions, balance adjustments, and review audit logs commit atomically; balance-changing operations use serializable transactions with bounded serialization retries.
18. Calendar-only fields use PostgreSQL `date` and `YYYY-MM-DD` API contracts; timestamp instants remain ISO strings, and browsers never timezone-convert date-only values.
19. Every audit-worthy database mutation and its audit row use the same Prisma transaction client; related session revocation is part of that transaction.
20. Payslip multipart parsing and display filenames are bounded; private R2 object keys and signed URLs never enter technical logs, and soft-deleted object removal has an idempotent retry path.
21. Invitation tokens are fragment-based for new links, captured only in component memory, and synchronously removed from browser-visible URLs; legacy query tokens are scrubbed and redacted from access logs, and sensitive auth/CSRF and signed-download URL responses are never cacheable.
22. Generic scalar inputs are bounded at API schemas before service or repository work; pagination pages are safe integers no greater than 10,000, and only short allowlisted ASCII request IDs may be reflected.
