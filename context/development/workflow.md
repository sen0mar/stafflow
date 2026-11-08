# Development Workflow

## Approach

Implement against the documented specs in small, verifiable units. Follow the task-based guide in [AGENTS.md](../../AGENTS.md); use the [context map](../README.md) only when ownership is unclear. Read only affected documents.

## Feature Branch Workflow

- Before starting a new feature, create a new feature branch from `main`; if the user explicitly says not to create a branch, skip this workflow and follow the user's instructions.
- After agreeing on the feature scope with the user and before implementation, fill the placeholders in `../features/current-feature.md`, then ask whether to start implementation.
- After implementation is complete and the user asks to commit and merge into `main`, reset `../features/current-feature.md` back to placeholders and add a concise entry to `../features/feature-history.md`.

Commit messages use a short title and concise description of what changed.

## Dependency Installs

- Use the directory owning the canonical lockfile (currently the repository root).
- Dependency downloads require network access. Request escalation up front only when the execution environment supports and requires it; otherwise use its configured permissions.
- If an install produces no output for about five seconds, stop the stale process and investigate before retrying. Never leave background installs running.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.
- Keep MVP behavior simple unless a future-proof foundation is cheap and clearly useful.
- Security-sensitive behavior must be implemented on the backend, not only hidden in the frontend.
- Performance must be considered before implementation, especially for list pages, database queries, file handling, and authenticated requests.

## When To Split Work

Split an implementation step if it combines:

- Frontend UI changes and backend API changes that cannot be verified independently.
- Auth/session logic and unrelated feature business logic.
- RBAC/policy changes and broad data model changes.
- Multiple unrelated API route groups.
- Database migrations and complex UI behavior.
- File upload/storage work and unrelated employee/attendance/leave logic.
- Behavior that is not clearly defined in the context files.

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior that is not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `../features/current-feature.md` before continuing.
- If implementation must proceed before the question is answered, choose the simplest reversible option and record the assumption in `../features/current-feature.md`.
- Do not add third-party services unless the architecture context explicitly allows them.
- Do not add public registration, public company onboarding, or unrestricted public-demo uploads unless explicitly requested.

Check existing domain and security policies before raising questions. Record only unresolved requirements; do not reopen documented decisions such as attendance schedules, calendar-date handling, manual payslip uploads, or read-only demo behavior.

## Protected Foundation Components

Follow [protected-file conventions](code-standards.md#protected-foundation-components) when generated or third-party files are involved.

## Keeping Docs In Sync

Update the owning document when architecture, storage, security, conventions, UI, scope, deployment, performance constraints, or known risks change. The [context map](../README.md) identifies each owner.

Keep active scope, assumptions, and actual progress in [current feature](../features/current-feature.md). Follow [Feature Branch Workflow](#feature-branch-workflow) for merge bookkeeping. Permanent context records decisions, not long implementation logs.

## Before Moving To The Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in the relevant document under `../architecture/` was violated.
3. Authentication, authorization, and ownership checks were verified where relevant.
4. List endpoints use pagination or have an explicit reason not to.
5. Database queries avoid obvious overfetching and N+1 patterns.
6. Sensitive data is not logged or exposed in API responses.
7. Feature progress and merge bookkeeping follow [Feature Branch Workflow](#feature-branch-workflow).
8. Public registration remains absent, and demo-mode storage guardrails remain intact when relevant.
