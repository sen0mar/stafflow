# Code Standards

[Context map](../README.md). Feature planning and verification follow the [workflow](workflow.md).

## General

- Use arrow functions unless a regular function is necessary.
- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component, hook, service, route, or repository.
- Respect the system boundaries defined in [architecture overview](../architecture/overview.md).
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
- Keep server data in TanStack Query rather than duplicating it in a client-state store.
- Keep query keys centralized per feature.
- Keep mutation invalidation explicit and predictable.
- Avoid large client-side transformations during render; derive once or memoize if needed.

## Protected Foundation Components

Do not modify generated shadcn/ui primitives (`client/src/shared/components/ui/*`), third-party internals, generated Prisma output, or build-generated files unless the task explicitly requires it. Compose app/feature components around the foundation instead.

## Styling

- Use Tailwind CSS and shadcn/ui for styling and component composition.
- Build project-specific components on top of the foundation components.
- Keep class composition readable; use a `cn()` helper for conditional classes.
- Use the semantic theme tokens defined in `../design/ui.md`; do not hardcode hex values or raw Tailwind palette classes in feature components.
- Prefer consistent spacing, typography, and layout primitives across pages.
- Use accessible form labels, button states, focus states, and error messages.
- Avoid deeply nested layout components that make dashboard pages hard to maintain.

## Express API

- Validate and parse request input before business logic runs.
- Return consistent, predictable response shapes.
- Follow the layer responsibilities in the [architecture overview](../architecture/overview.md#system-boundaries).
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

Follow [data and storage](../architecture/data-and-storage.md) for persistence, migrations, transactions, audits, and file lifecycle; [API and performance](../architecture/api-and-performance.md) owns query bounds and indexing.

## File Organization

Follow [system boundaries](../architecture/overview.md#system-boundaries) and the [feature module model](../architecture/overview.md#feature-module-model); keep domain files together.

- `client/src/app/`: providers, router, query-client setup.
- `client/src/shared/`: reusable components (`ui/`, `layout/`, `data-table/`, `forms/`), hooks, types, and focused `lib/` helpers such as `api-client.ts`, `cn.ts`, `dates.ts`, and `permissions.ts`.
- `server/src/core/`: shared auth, errors, logger, middleware, security, and utilities; `server/src/prisma/prisma.client.ts` owns the client singleton.
- `prisma/`: schema and migrations.

Name files by responsibility, e.g. `employees.service.ts`, `employees.policy.ts`, `use-employees.ts`, or `employee-form.tsx`; avoid vague names such as `misc.ts` or `helpers.ts`.

## Auth, Security, and RBAC

Follow [security](../architecture/security.md) for sessions, CSRF, permissions, resource ownership, and demo restrictions.

## Logging and Audit Logs

Follow [operations](../architecture/operations.md#technical-logging) for technical logs and redaction, and [data and storage](../architecture/data-and-storage.md) for transactional business audits.

## Performance

Follow [API and performance](../architecture/api-and-performance.md) for pagination, fetching, rendering, caching, and database access.
