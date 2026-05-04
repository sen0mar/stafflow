# Application Building Context

Read these before implementing or making architectural decisions:

- `context/project-overview.md` — product goals, MVP scope, demo constraints, and success criteria.
- `context/architecture-context.md` — stack, boundaries, auth, storage, deployment, invariants, and failure modes.
- `context/ui-context.md` — theme tokens, visual references, layout patterns, and styling rules.
- `context/code-standards.md` — implementation rules, folder structure, and coding conventions.
- `context/ai-workflow-rules.md` — workflow, scoping rules, and documentation expectations.
- `context/features/current-feature.md` — current feature scope, checklist, assumptions, and open questions.
- `context/features/feature-history.md` — concise completed-feature history.

If architecture, UI direction, scope, or standards change, update the relevant context file before continuing.

# Workflow

- Before starting a new feature, create a new feature branch from `main`; if the user explicitly says not to create a branch, skip this workflow and follow the user's instructions.
- After agreeing on the feature scope with the user and before implementation, fill the placeholders in `context/features/current-feature.md`, then ask whether to start implementation.
- After implementation is complete and the user asks to commit and merge into `main`, reset `context/features/current-feature.md` back to placeholders and add a concise entry to `context/features/feature-history.md`.

# Dependency Installs

- Package manager install commands require network access and may hang in the default sandbox. For `npm install`, `npm ci`, `npx`, `pnpm`, `yarn`, or equivalent dependency-download commands, request escalated permissions up front instead of first trying the sandboxed command.
- If a dependency install produces no output for about 5 seconds, treat it as stuck: stop the stale process, rerun with escalated permissions, and do not leave background install sessions running.
- Prefer installing from the package directory that owns the lockfile, for example `client/` for frontend packages.

# Important

- Use Prisma migrations only. Never run `prisma db push`, reset/drop the database, delete migrations, or run destructive SQL unless explicitly requested.
- No public self-registration. Accounts are admin-created/invited only; public demo users must not turn the app into a reusable company workspace.
- Protect Cloudflare R2 in public demo mode: no unrestricted uploads, large files, public object access, or leaked signed URLs.
- Do not use Axios. Use the native `fetch` wrapper with `credentials: "include"`.
- Always use arrow functions instead of regular functions unless a regular function is necessary.
- Never store auth tokens in `localStorage`; use HTTP-only cookie sessions.
- Enforce auth, RBAC, and ownership on the backend. Frontend guards are UX only.
- Never log passwords, hashes, cookies, tokens, secrets, raw files, or private signed URLs.
- Use Context7 MCP for current library/framework docs when implementation details are uncertain or version-sensitive.
