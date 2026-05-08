# Current Feature

Update this file only for the active feature after the user and agent agree on its scope.

This file tracks the current feature branch. After implementation is complete, reset this file to placeholders and add a concise summary to `features/feature-history.md` only when the user asks to commit and merge into `main`.

## Current Phase

- Verification complete.

## Current Goal

- Add demo seed data and demo-mode storage guardrails for the public portfolio environment.

## Active Feature

- Demo seed data and upload protection.

## Scope

- Add a Prisma seed script for demo users, departments, employees, attendance, leave types, leave balances, and pending leave requests.
- Add demo-mode environment flags with uploads disabled by default.
- Add a backend guard helper that future storage-consuming endpoints must use before R2 work in demo mode.
- Verify public registration remains absent and no demo payslips are seeded without real R2 objects.

## Out Of Scope

- Full auth/login endpoint implementation.
- Payslip upload/download route implementation.
- Seeding payslip metadata without real R2 object keys.
- Public registration or company onboarding.

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

- Demo seed data and demo-mode configuration are implemented and verified.

## Next Up

- Await user review, then commit and merge when requested.

## Open Questions

- None. Demo password is `StafflowDemo`; payslip metadata is not seeded without real R2 objects.

## Architecture Decisions

- Current global decisions are documented in `architecture-context.md`.
- Move project-wide decisions to `architecture-context.md` once confirmed.

## Session Notes

- Demo uploads are disabled by default with `DEMO_MODE=true` and `DEMO_UPLOADS_ENABLED=false`.
- Seed verification produced 6 users, 5 employees, 60 attendance records, 3 pending leave requests, and 0 payslips.
