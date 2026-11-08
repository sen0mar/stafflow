# Architecture Overview

## Stack

| Layer                | Technology                        | Role                                                                                                               |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Frontend             | React + TypeScript + Vite         | Authenticated single-page web app for admins and employees                                                         |
| Routing              | React Router                      | Protected app routes and feature pages                                                                             |
| UI                   | Tailwind CSS + shadcn/ui          | Styling, reusable primitives, dashboard components                                                                 |
| Server state         | TanStack Query                    | API fetching, caching, invalidation, loading/error state                                                           |
| Client state         | React state                       | Local UI state; add a dedicated shared-state library only when a concrete cross-feature need appears               |
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
- `stores` — dedicated client-state stores only when a concrete local/global shared-state need justifies them.

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

## Critical invariants

- The backend enforces authentication, permissions, and ownership; frontend guards provide UX only.
- Public demo business/identity data stays read-only; public registration and unrestricted uploads are absent.
- Controllers coordinate, services apply business rules, repositories access data, and policies authorize resources.
- Data access is bounded; sensitive mutations and their audit records commit atomically.
- Secrets and private file access remain protected throughout storage, transport, and logging.

Read only the affected contracts: [security](security.md), [data/storage](data-and-storage.md), [domain policies](domain-policies.md), [API/performance](api-and-performance.md), or [operations](operations.md). For product, UI, and workflow ownership use [the context map](../README.md).
