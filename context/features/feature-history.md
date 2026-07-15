# Feature History

Use this file to record concise bullet points after each feature is successfully implemented and the user asks to commit and merge into `main`.

Keep entries short. This file should explain what changed, not become a detailed implementation log.

## Completed Features

- Feature 01: UI Foundation Setup — initialized Tailwind CSS v4 and shadcn/ui foundation files, translated semantic light/dark UI tokens into `client/src/index.css`, added shared UI utilities and a minimal button primitive, and documented dependency-install sandbox handling.
- Feature 02: Client Foundations — added root workspace scripts, frontend application dependencies, shadcn/ui primitives, Vite-compatible Geist font loading, and the initial `client/src` app/shared/features folder structure.
- Feature 03: App Foundation Providers — wired React Query, React Router, next-themes, and Sonner providers; added the initial app router; and normalized the native cookie-authenticated API client error handling.
- Feature 04: Route Placeholder Scaffold — added public and protected frontend route placeholders, a dashboard app shell with sidebar navigation, an `/app` dashboard redirect, and a future `/auth/me` protected-route integration point.
- Feature 05: Landing Page Shell — added the Stafflow public homepage with dark/light theme support, a themed dashboard preview, module cards, metrics strip, footer, and a dedicated homepage feature folder.
- Feature 06: Reactive Homepage Polish — added a canvas-based reactive homepage dot background, tightened first-load hero spacing, and enhanced the dashboard preview with initials avatars.
- Feature 08: Black/Grey/Orange Theme Test — updated semantic theme tokens with charcoal surfaces, black-to-grey card gradients, professional amber accents, chart colors, shadows, and matching UI documentation.
- Feature 09: Server Middleware Foundation — composed the Express middleware stack with trust proxy, request IDs, Pino HTTP logging, Helmet, exact-origin credentialed CORS via `CLIENT_URL`, parsers, routes, not-found handling, and global error handling.
- Feature 10: Server Foundation Cleanup — added shared API response contracts, replaced `HttpError` with `AppError`, limited Render trust proxy to production, tightened Pino redaction, and verified health/error responses locally.
- Feature 11: Database Schema Foundation — configured the PostgreSQL datasource, added initial Stafflow enums and Prisma models for auth, employees, departments, attendance, leave, payslips, settings, audit logs, password resets, and invitations, and verified early common-lookup indexes without creating migrations.
- Feature 12: Initial Prisma Migration — created and applied the first Prisma migration, updated Prisma 7 datasource/runtime configuration, generated Prisma Client, and verified the singleton client with a lightweight database query.
- Feature 13: Demo Seed Data — added Prisma demo seeding for baseline admin and employee accounts, departments, attendance, leave data, demo upload guardrails, and a development-only dry-run reset script for deleting users added after the seed baseline.
- Feature 14: First-Party Auth Backend — added bcrypt password helpers, hashed database sessions with HTTP-only cookies, CSRF-protected auth mutations, `/auth` login/logout/me/change-password routes, auth middleware, and sanitized validation errors.
- Feature 15: Auth Reset and Invitation Scaffolding — added password reset and invitation acceptance auth endpoints, expanded authenticated request context with role permissions, and invalidated sessions on logout, password reset, invitation acceptance, and password change.
- Feature 16: Auth Login Flow — added safe failed-login logging, frontend auth API functions and TanStack Query hooks, a demo-friendly login page without public registration, `/auth/me` route protection, logout wiring, CSRF-aware fetch handling, and themed input fixes.
- Feature 17: Authorization Primitives — replaced coarse role permissions with typed MVP permission maps, added backend `requirePermission` middleware, seeded feature policy helpers for self-vs-any access, and typed frontend UI-only permission utilities.
- Feature 18: Reusable UI Foundations — split the protected app shell and homepage into reusable layout/landing components, added dashboard card/status/empty/loading foundations, and replaced the dashboard placeholder with a responsive reference-style dashboard.
- Feature 19: Dashboard API and Role-Based UI — added protected admin and employee dashboard summary endpoints, wired TanStack Query dashboard hooks, replaced static dashboard data with role-aware API-backed views, and polished dashboard previews, sorting, priority indicators, and card alignment.
- Feature 20: Production Demo Auth Bootstrap — added a guarded Prisma bootstrap for the two production demo auth accounts, protected demo account password changes in demo mode, and verified the bootstrap against the production demo database.
- Feature 21: Department CRUD — added authenticated department read APIs, admin-only create/update/delete with CSRF, conflict and safe-delete handling, audit logs, a paginated department management UI, query invalidation, and corrected shared foreground tokens for badges and buttons.
- Feature 22: Production Deployment Fixes — added Vercel SPA rewrites, production-safe API origin resolution, cross-site secure auth cookies, and response-backed CSRF handling for Vercel-to-Render deployments.
- Feature 23: Employee Management — added admin employee CRUD, invite-token account creation, self-profile APIs, soft-disable/session revocation, audit logs, paginated employee UI, detail/profile pages, and employee query/form components.
- Feature 24: Attendance Management — added employee clock-in/out with confirmation, self attendance history, admin attendance filtering and corrections, audited correction logs, and an attendance date index migration.
- Feature 25: Leave Management — added leave type management, employee leave requests, admin approval/rejection with reversible reviews, simple balance updates, audit logs, cancellation hiding, and role-specific leave notes.
- Feature 26: Bulk Pagination Navigation — added a shared compact pagination control with first/last and ±10 page skips, and reused it across employee, department, attendance, and leave list screens.
- Feature 27: Payslip R2 Storage — added private Cloudflare R2 payslip PDF upload, replacement, deletion, preview, and signed download flows with backend ownership checks, demo upload blocking, audit logs, env validation, and quieter development server logging.
- Feature 28: Basic Settings — added admin-only company, attendance, and leave settings APIs with audited mutations, a Prisma migration for basic settings fields, seeded defaults, and an editable settings page with a backend-driven demo notice.
- Feature 29: Settings Save Confirmations — added confirmation dialogs before company, attendance, and leave settings saves, preserving validation before confirmation and audited mutations after confirmation.
- Feature 30: Codebase Cleanup — added route-level lazy loading with route fallbacks, server ESLint coverage, removed unused starter SVG assets, and reduced the initial client JS chunk below the Vite warning threshold.
- Feature 31: Audit Logs — added admin-only audit log APIs and UI with filters, pagination, detail previews, centralized redacted audit writes, password change/reset completion audit events, and an audit log created-at index migration.
- Feature 32: List Page Standardization — normalized list APIs to `data`/`meta` pagination, added shared table/filter/query-state helpers, persisted table filters in URL params, debounced text search, and added list-query indexes.
- Feature 33: Polish and Resilience States — added route error boundaries, shared loading/empty/error/unauthorized UI states, safe mutation error messages, and global protected-session expiration handling.
- Feature 34: Testing and CI Guardrails — added strict client TypeScript, Prettier formatting, Vitest unit/component/integration tests for security-critical flows, guarded database smoke scripts, and GitHub Actions CI.
- Feature 35: Custom Domain Branding Cleanup — updated the app document title, homepage brand mark, and favicon so the deployed Stafflow experience no longer exposes starter-template branding.
- Feature 36: Portfolio Demo Safety Hardening — added a demo safety and monitoring checklist, regression coverage for absent public registration, employee authorization boundaries, employee payslip isolation, admin audit logs, and demo upload blocking.
- Feature 37: Recruiter README Polish — added a root project README with overview, stack, architecture, security, setup, deployment, screenshots, and QA notes, and replaced the client starter README with a project pointer.
- Feature 38: Rate Limiting Scope Removal — removed Upstash/rate-limiting dependencies and scrubbed rate-limiting configuration and MVP claims from README and context docs.
- Feature 39: Smoother Homepage Dots — refined the reactive homepage dot canvas so pointer movement still pushes dots away while removing the constant ripple shimmer.
- Feature 40: Invitation Acceptance Page — added a public invitation setup page, wired invitation acceptance through the existing auth API, and changed employee creation to show a copyable setup link.
- Feature 41: Persistent Pending Invitations — added admin pending-invitation APIs, secure setup-link regeneration, and a persistent Employees page invitation list that hides accepted or expired invites.
- Feature 42: Mobile Form and Chrome Issues Cleanup — fixed mobile control overflow, added stronger form labels and autocomplete hints, made the mobile sidebar focus-safe, and verified the admin pages in a mobile browser viewport.
- Feature 43: README and Screenshot Refresh — rewrote the root project guide in simpler, more complete language and replaced outdated reference images with current light/dark homepage and admin dashboard screenshots captured from the running app.
- Feature 44: 4K Layout Density — added a dedicated wide-screen scale tier, fluid authenticated layouts, a wider desktop sidebar, and expanded homepage containers while preserving existing desktop and mobile sizing.

## Entry Format

- Feature 01: Feature Name — concise summary of what was added, changed, verified, or migrated.

## Notes

- Add an entry only after the feature works end to end within its defined scope and the user asks to commit and merge.
- Include important migrations, security changes, storage changes, and deployment changes when relevant.
- Do not duplicate all details from `features/current-feature.md`.
