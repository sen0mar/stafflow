# Context Map

Use the task router in [AGENTS.md](../AGENTS.md) first. This directory separates product intent, technical contracts, coding conventions, working process, and historical evidence. Read only the sections affected by the task.

| Document                                                   | Owns                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Project overview](product/overview.md)                    | Goals, user flows, scope, success criteria; capabilities describe private mode unless demo restrictions apply |
| [Architecture overview](architecture/overview.md)          | Stack, system boundaries, module model, critical invariants                                                   |
| [Security](architecture/security.md)                       | Authentication, authorization, invitations, public demo policy, private access                                |
| [Data and storage](architecture/data-and-storage.md)       | Persistence, migrations, transactions, audit records, R2 lifecycle                                            |
| [Domain policies](architecture/domain-policies.md)         | Attendance, leave duration, calendar-date and timestamp contracts                                             |
| [API and performance](architecture/api-and-performance.md) | REST contracts, input bounds, pagination, queries, caching, rendering                                         |
| [Operations](architecture/operations.md)                   | Hosting/environment model, logging, health, shutdown; links to deployment runbooks                            |
| [Code standards](development/code-standards.md)            | Coding conventions, response examples, source layout and naming                                               |
| [UI context](design/ui.md)                                 | Visual direction, tokens, layout, interaction, accessibility                                                  |
| [Workflow](development/workflow.md)                        | Branching, planning, scoping, verification, dependency installs, documentation maintenance                    |
| [Demo safety checklist](checklists/demo-safety.md)         | Release verification of policy and external provider controls                                                 |
| [Regression matrix](audits/audit-25-regression-matrix.md)  | Historical audit findings and exact regression evidence; read for regression/audit work                       |
| [Dependency audit](audits/dependency-audit.md)             | Dated dependency findings and mitigations; not live package status                                            |

[Current feature](features/current-feature.md) owns active scope and progress; [feature history](features/feature-history.md) is consulted for prior decisions or commit/merge bookkeeping. Images and feature documents retain their existing locations.

Visual reference assets remain in [images](images/README.md); active work and historical evidence stay in `features/` and `audits/`. Deployment procedures remain outside context under `deployment/`.

## Maintenance

Update the owning document before continuing when architecture, scope, UI, or standards change. Keep detailed policies in one place; other documents summarize intent or link to them. Checklists verify policies rather than redefine them. Keep deployment procedures in the runbooks linked from [operations](architecture/operations.md), historical evidence under `audits/`, and avoid implementation logs in permanent context.
