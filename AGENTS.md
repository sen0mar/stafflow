# Working in Stafflow

Read only the documents relevant to the task; follow links when their topic is affected. Do not preload all context files.

- Implementation or feature planning: `context/development/workflow.md`; `context/features/current-feature.md`; relevant sections of `context/development/code-standards.md`
- Product scope or user behavior: `context/product/overview.md`
- Stack, boundaries, module structure: `context/architecture/overview.md`
- Auth, permissions, invitations, demo restrictions: `context/architecture/security.md`
- Prisma, transactions, audit records, files/R2: `context/architecture/data-and-storage.md`
- Attendance, leave, dates/timezones: `context/architecture/domain-policies.md`
- API contracts, queries, caching, performance: `context/architecture/api-and-performance.md`
- Deployment, environment, logging, health/shutdown: `context/architecture/operations.md`
- UI or styling: `context/design/ui.md`
- Public demo release or safety verification: `context/checklists/demo-safety.md`

Documentation map and historical evidence: `context/README.md` (only when needed). Update the owning document when a rule or decision changes; avoid duplicating it.

Critical safeguards: Prisma migrations only; no destructive database operations without explicit instruction. No public registration; demo mutations/uploads stay blocked. Enforce auth/RBAC/ownership on the backend; use HTTP-only sessions. Never log secrets or private file URLs. Use Context7 for uncertain or version-sensitive library details.
