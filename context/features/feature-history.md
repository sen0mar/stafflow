# Feature History

Use this file to record concise bullet points after each feature is successfully implemented and the user asks to commit and merge into `main`.

Keep entries short. This file should explain what changed, not become a detailed implementation log.

## Completed Features

- Feature 01: UI Foundation Setup — initialized Tailwind CSS v4 and shadcn/ui foundation files, translated semantic light/dark UI tokens into `client/src/index.css`, added shared UI utilities and a minimal button primitive, and documented dependency-install sandbox handling.
- Feature 02: Client Foundations — added root workspace scripts, frontend application dependencies, shadcn/ui primitives, Vite-compatible Geist font loading, and the initial `client/src` app/shared/features folder structure.
- Feature 03: App Foundation Providers — wired React Query, React Router, next-themes, and Sonner providers; added the initial app router; and normalized the native cookie-authenticated API client error handling.

## Entry Format

- Feature 01: Feature Name — concise summary of what was added, changed, verified, or migrated.

## Notes

- Add an entry only after the feature works end to end within its defined scope and the user asks to commit and merge.
- Include important migrations, security changes, storage changes, and deployment changes when relevant.
- Do not duplicate all details from `features/current-feature.md`.
