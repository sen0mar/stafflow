# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component, hook, service, route, or repository.
- Respect the system boundaries defined in `architecture-context.md`.
- Prefer readable code over clever abstractions.
- Avoid premature abstraction, but do not duplicate security-sensitive logic.
- Use feature-based organization for both frontend and backend.
- Keep MVP implementation simple while preserving clean extension points for future roles and modules.
- Treat the portfolio demo as a constrained demo environment, not a public self-service onboarding product.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces, inferred generics, or narrowly scoped unknown parsing.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts where extension is useful.
- Use `type` for unions, mapped types, utility types, and narrow aliases.
- Avoid broad shared types that become dumping grounds.
- Do not expose Prisma model types directly to the frontend when the API response should be narrower.
- Never return `passwordHash`, session token hashes, reset token hashes, or other secrets from API functions.

## React and Vite

- Keep route-level page components focused on composition.
- Extract reusable logic into hooks only when it is reused or meaningfully simplifies the component.
- Keep feature components small and named after their responsibility.
- Prefer controlled form libraries for real forms: React Hook Form + Zod.
- Use TanStack Query for server state, mutations, cache invalidation, loading state, and error state.
- Keep local client/UI state in React until a demonstrated cross-feature need justifies a dedicated store library.
- Keep server data in TanStack Query rather than duplicating it in a client-state store.
- Do not use Axios. Use a small typed wrapper around native `fetch`.
- All API requests that require auth cookies must use `credentials: "include"`.
- Keep query keys centralized per feature.
- Keep mutation invalidation explicit and predictable.
- Avoid large client-side transformations during render; derive once or memoize if needed.
- Use route-level lazy loading for heavy feature pages when the app grows.

## Styling

- Use Tailwind CSS and shadcn/ui for styling and component composition.
- Do not modify generated shadcn/ui foundation components unless explicitly required.
- Build project-specific components on top of the foundation components.
- Keep class composition readable; use a `cn()` helper for conditional classes.
- Use the semantic theme tokens defined in `ui-context.md`; do not hardcode hex values or raw Tailwind palette classes in feature components.
- Prefer consistent spacing, typography, and layout primitives across pages.
- Use accessible form labels, button states, focus states, and error messages.
- Avoid deeply nested layout components that make dashboard pages hard to maintain.

## Express API

- Validate and parse request input before business logic runs.
- Enforce auth before accessing protected resources.
- Enforce RBAC before protected mutations.
- Enforce resource ownership/policy checks for self-vs-any routes.
- Return consistent, predictable response shapes.
- Keep controllers thin — push business logic into services.
- Keep Prisma access in repositories or well-contained data-access helpers.
- Use async error handling consistently.
- Do not leak internal stack traces in production responses.
- Use request IDs in logs and error paths.
- Do not perform long or expensive work before auth, authorization, and validation.
- Use explicit HTTP status codes: `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `500` where appropriate.

Recommended response shape:

```ts
interface ApiSuccess<T> {
  data: T;
}

interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}
```

## Data and Storage

- Relational business data belongs in PostgreSQL via Prisma.
- Payslip PDFs and future large private files belong in Cloudflare R2.
- Prisma stores R2 object keys and metadata, not file contents.
- Use Neon pooled connection URL for normal application traffic.
- Use Neon direct connection URL for Prisma migrations/schema operations.
- Use Prisma migrations for schema changes. Do not use `prisma db push` in normal development unless explicitly requested.
- Do not reset/drop production or shared demo databases unless explicitly requested.
- Add indexes for common filters, joins, and sort orders.
- Do not overuse Prisma `include`; prefer explicit `select`.
- All list endpoints must be paginated.
- Use database transactions for multi-step operations that must stay consistent.
- Public demo deployments must not allow unrestricted R2 writes; use demo-mode guards, strict limits, or cleanup.
- For R2 + database operations, handle failure states carefully:
  - If R2 upload succeeds but DB write fails, attempt cleanup or record a recoverable orphan state.
  - If DB write succeeds but later R2 access fails, expose a safe error and log the issue.
- Audit logs are business records and should be written for sensitive changes.

## File Organization

Recommended repository shape:

```txt
client/
  src/
    app/
      providers/
      router/
      query-client.ts
    shared/
      components/
        ui/
        layout/
        data-table/
        forms/
      hooks/
      lib/
        api-client.ts
        cn.ts
        dates.ts
        permissions.ts
      types/
    features/
      auth/
      dashboard/
      employees/
      departments/
      attendance/
      leave/
      payslips/
      settings/
      audit-logs/

server/
  src/
    app.ts
    server.ts
    config/
    core/
      auth/
      errors/
      logger/
      middleware/
      security/
      utils/
    modules/
      auth/
      users/
      employees/
      departments/
      attendance/
      leave/
      payslips/
      settings/
      audit-logs/
    prisma/
      prisma.client.ts

prisma/
  schema.prisma
  migrations/

context/
  project-overview.md
  architecture-context.md
  code-standards.md
  ai-workflow-rules.md
  ui-context.md
  features/
    current-feature.md
    feature-history.md
  images/
    dashboard/
      dashboard-dark-reference.png
      dashboard-light-reference.png
    homepage/
      homepage-dark-reference.png
      homepage-light-reference.png
```

Name files after the responsibility they contain, not the technology.

Examples:

- Good: `employees.service.ts`, `employees.policy.ts`, `use-employees.ts`, `employee-form.tsx`.
- Bad: `helpers.ts`, `misc.ts`, `data.ts`, `component.tsx`.

## Auth, Security, and RBAC

- Use first-party session auth with HTTP-only cookies.
- Do not implement public self-registration or login-page sign-up.
- Create users only through admin flows, seed scripts, or controlled invitation/password setup flows.
- Store only hashed session tokens in the database.
- Passwords must be hashed with bcrypt.
- Do not use localStorage for auth tokens.
- Use CSRF protection for state-changing cookie-authenticated requests.
- Configure CORS with a specific allowed origin, not `*`.
- Configure Express `trust proxy` intentionally for Render.
- Use static permissions for `ADMIN` and `EMPLOYEE` in MVP.
- Add resource policy checks for self-vs-any access.
- Never trust `employeeId`, `userId`, `role`, or permission values from the request body.
- Redact sensitive values from logs.
- Public demo users must not be allowed to bypass demo-mode restrictions or storage quotas.

## Logging and Audit Logs

- Use Pino for technical logs.
- Use `pino-http` for request logging.
- Use structured JSON logs in production.
- Use readable pretty logs only in development.
- Include request ID, method, path, status code, duration, and authenticated user ID when available.
- Do not log passwords, password hashes, cookies, session tokens, reset tokens, invitation tokens, or private signed URLs.
- Keep technical logs separate from audit logs.
- Store audit logs in PostgreSQL for sensitive business/security actions.

Audit-log-worthy actions include:

- Admin creates, updates, disables, or deletes an employee.
- Admin changes role or account status.
- Admin edits attendance records.
- Admin approves or rejects leave requests.
- Admin uploads, replaces, or deletes payslips.
- User changes password.
- Settings are changed.

## Performance

- Design list pages around pagination from day one.
- Do not fetch entire datasets for tables.
- Keep API response payloads narrow.
- Debounce search and filter inputs.
- Use TanStack Query cache invalidation instead of manually refetching everything.
- Avoid duplicated network calls by centralizing query hooks per feature.
- Avoid N+1 Prisma patterns.
- Add indexes for common query patterns.
- Validate file size and file type before uploading to R2.
- Add slow request logging once basic infrastructure exists.
