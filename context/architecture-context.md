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
| Public demo model    | Seeded demo users + guard         | Visitors can log in; demo mode blocks persistent account creation, activation, status changes, and elevation       |

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
  - Users, sessions, employee profiles, departments, attendance records, leave types, leave requests, leave balances, payslip metadata, company settings, audit logs, and reset/invitation tokens.
- **Cloudflare R2** stores large private files:
  - Payslip PDFs and future employee documents.
  - PostgreSQL stores only metadata and the R2 object key, not the file contents.
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
- Use search and filters through query parameters.
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

Environment variables must be validated at server startup. Missing required variables should fail fast.

Expected backend environment groups:

- App URLs and environment mode.
- Database URLs: pooled `DATABASE_URL` and direct `DIRECT_URL` for migrations.
- Session/cookie secrets.
- Cloudflare R2 credentials and bucket config.
- Email provider credentials once invitations/password reset are implemented.
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

RBAC/resource-access risks:

- Frontend hides buttons but backend does not enforce permissions.
- Employee IDs from the request body are trusted for self-service routes.
- Employees access another employee's payslip, attendance, or leave request by guessing an ID.
- Admin actions are not audit logged.
- Sensitive fields such as salary or passwordHash leak through broad API responses.

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

Operational risks:

- Demo seed data is missing, stale, or not reset, making the public demo confusing or abusable.
- Logs are unstructured or inconsistent.
- Request IDs are missing, making production debugging difficult.
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
