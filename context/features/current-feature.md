# Current Feature

Update this file only for the active feature after the user and agent agree on its scope.

This file tracks the current feature branch. After implementation is complete, reset this file to placeholders and add a concise summary to `features/feature-history.md` only when the user asks to commit and merge into `main`.

## Current Phase

- Implementation.

## Current Goal

- Create the initial Express backend source folder scaffold and align backend tooling with the `server` package boundary.

## Active Feature

- Feature 07: Backend Server Scaffold

## Scope

- Add the `server/src` folder structure for backend app composition, config, shared core infrastructure, feature modules, and Prisma client access.
- Move backend package ownership from `backend` to `server` so TypeScript and dependency imports resolve correctly.
- Add minimal Prisma 7 schema/config scaffolding required to generate the Prisma client.

## Out Of Scope

- Implementing API routes, auth/session behavior, Prisma schema changes, migrations, business logic, or deployment wiring.

## Implementation Checklist

- [x] Requirements are clear.
- [x] Data model impact is understood.
- [x] API changes are defined.
- [x] Frontend changes are defined.
- [x] Auth/RBAC/policy requirements are defined.
- [x] Performance risks are considered.
- [x] Error states are considered.
- [x] Audit log requirements are considered.
- [x] Tests or verification steps are defined.
- [x] Documentation updates are complete.

## In Progress

- None.

## Next Up

- Feature 01: Project setup and tooling foundation.
- Feature 02: Backend foundation, environment validation, Prisma migrations, health check, and demo seed plan.
- Feature 03: Auth foundation with bcrypt, database sessions, cookies, CSRF, no public registration, and rate limiting.

## Open Questions

- None.

## Architecture Decisions

- Current global decisions are documented in `architecture-context.md`.
- Backend package ownership now follows the documented `server/` boundary instead of the old empty `backend/` workspace.
- Prisma 7 stores the datasource URL in `prisma.config.ts`; `prisma/schema.prisma` only declares the PostgreSQL provider until models are added.
- Move project-wide decisions to `architecture-context.md` once confirmed.

## Session Notes

- User confirmed no new branch is needed for this scaffold. Work continued on the current branch.
