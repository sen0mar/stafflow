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

## Entry Format

- Feature 01: Feature Name — concise summary of what was added, changed, verified, or migrated.

## Notes

- Add an entry only after the feature works end to end within its defined scope and the user asks to commit and merge.
- Include important migrations, security changes, storage changes, and deployment changes when relevant.
- Do not duplicate all details from `features/current-feature.md`.
