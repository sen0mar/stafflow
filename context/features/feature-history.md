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

- Feature 17: Homepage 2K Density — widened the homepage layout at very large breakpoints, gave the dashboard preview more space, and kept existing laptop and mobile layouts unchanged.

## Entry Format

- Feature 01: Feature Name — concise summary of what was added, changed, verified, or migrated.

## Notes

- Add an entry only after the feature works end to end within its defined scope and the user asks to commit and merge.
- Include important migrations, security changes, storage changes, and deployment changes when relevant.
- Do not duplicate all details from `features/current-feature.md`.
