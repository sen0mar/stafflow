# Dependency Audit

## 2026-07-16 — Section 02

The canonical root npm lockfile was patched without `npm audit fix --force`.
The Express production dependency graph has no remaining high or moderate audit
finding. Multer is fixed at 2.2.0, and compatible client/build and transitive
patches include React Router DOM 7.18.1, Vite 8.1.4, qs 6.15.3, form-data 4.0.6,
undici 7.28.0, Hono 4.12.30, and Babel Core 7.29.7.

### Remaining findings

| Audit item                                                              | Severity                                            | Reachability                                                                                                                                                                                 | Mitigation                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@hono/node-server@1.19.11` via `@prisma/dev@0.24.3` and `prisma@7.8.0` | Moderate (reported as three dependency-chain items) | Toolchain-only. Stafflow serves production traffic with Express; it does not import Hono or expose Hono `serveStatic`. Prisma CLI is used only for trusted schema generation and migrations. | Keep Prisma on the supported 7.x line instead of accepting npm's forced downgrade to 6.19.3. Run migration commands only from trusted source and update when Prisma publishes a compatible CLI dependency patch. |
| `esbuild@0.27.7` via `tsx@4.21.0` and Vite                              | Low                                                 | Toolchain-only. The advisory concerns a Windows development server; Stafflow's deployed Express server does not execute esbuild, and CI/deployment run on Linux.                             | Do not expose local development servers to untrusted users. Keep builds on trusted source and update once `tsx` accepts the fixed esbuild 0.28.1 range.                                                          |

The full audit reports four toolchain-only items (three moderate
dependency-chain entries and one low item), with zero high or critical
findings. npm's hoisted peer-dependency metadata keeps these tools visible even
with `--omit=dev`, so reachability is classified from the dependency and import
paths above rather than from that flag alone.

## 2026-07-16 — Clean npm and CI baseline

The canonical root lockfile is generated for the npm 10.9.4 version pinned in
`package.json`. It includes optional peer packages required by npm 10's strict
`npm ci` validation and no longer contains the stale extraneous `backend`
workspace record. CI uses the Node 24-based checkout/setup actions while testing
the application on Node.js 22.
