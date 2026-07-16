# Environment Configuration

Only tracked examples are documented here. Never copy values from an existing
`.env`, shell session, or provider secret store. Start from the safe placeholders
in [`.env.local.example`](../.env.local.example),
[`client/.env.local.example`](../client/.env.local.example), or
[`.env.production.example`](../.env.production.example).

## Ownership map

| Variable                                                                      | Owner                                          | Required and behavior                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                    | Local root / Render API                        | `development`, `test`, or `production`. Render sets `production`; production enables secure cookies and HTTPS `CLIENT_URL` validation.                                                                                                                                                                                                                                                               |
| `PORT`                                                                        | Local root / Render platform                   | Local API port, default `4000`. Render supplies it; valid startup range is 1–65535.                                                                                                                                                                                                                                                                                                                  |
| `CLIENT_URL`                                                                  | Local root / Render API                        | Exact frontend origin used for credentialed CORS. Production requires HTTPS. Use only the origin, with no path or wildcard.                                                                                                                                                                                                                                                                          |
| `VITE_API_URL`                                                                | `client/.env.local` / Vercel build environment | Exact API origin. Local Vite defaults to `http://localhost:4000`. Production can infer `api.` from an `app.` sibling domain; set this explicitly for every other topology.                                                                                                                                                                                                                           |
| `DATABASE_URL`                                                                | Local root / Render API and cron               | Pooled PostgreSQL URL for API traffic and all Prisma-backed scripts. Required. Never point guarded tests or destructive fixtures at production/shared demo.                                                                                                                                                                                                                                          |
| `DIRECT_URL`                                                                  | Local root / migration environment             | Optional direct PostgreSQL URL for Prisma migration commands; Prisma falls back to `DATABASE_URL`. The API and cron jobs do not need it.                                                                                                                                                                                                                                                             |
| `DEMO_MODE`                                                                   | Local root / Render API                        | `true` makes the public workspace backend-enforced read-only except bounded login/logout/session behavior and reads. Use `false` for a private/local mutable workspace.                                                                                                                                                                                                                              |
| `DEMO_UPLOADS_ENABLED`                                                        | Local root / Render API                        | Must be `false`. Startup rejects `true` in every mode because quotas and automated cleanup do not exist.                                                                                                                                                                                                                                                                                             |
| `PAYSLIP_MAX_UPLOAD_BYTES`                                                    | Local root / Render API                        | Positive byte ceiling used by multipart parsing and PDF validation; default and deployment example are 2,097,152 bytes (2 MiB). Keep 2 MiB unless the user-facing upload message and its regressions are updated in the same change.                                                                                                                                                                 |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Local root / Render API / payslip retry cron   | Each is optional at startup because R2 is lazy. Every private payslip read, upload, or delete requires all four; a missing/partial group fails the storage operation as unconfigured. Configure the complete group for reads in any deployment, and for writes/retry only in a mutable private deployment. The bucket and objects must be private; code does not activate provider privacy settings. |

Stafflow has no session-secret variable. It generates high-entropy opaque session
tokens, sends the raw value only in an HTTP-only cookie, and stores only a hash.
Do not invent email-provider variables: public password recovery is deferred and
invitation delivery is currently a controlled copyable link, not email delivery.

## Guarded scripts

All commands below also require `DATABASE_URL`. Values shown are acknowledgements,
not secrets; set them only for the relevant invocation.

| Command                                    | Additional variables or guard                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run db:bootstrap-demo-auth`           | Requires `BOOTSTRAP_DEMO_AUTH=true` and a non-empty `DEMO_AUTH_PASSWORD`. Optional overrides: `DEMO_ADMIN_EMAIL`, `DEMO_EMPLOYEE_EMAIL`, and `DEMO_EMPLOYEE_CODE`. A non-empty user table additionally requires the explicit high-risk acknowledgement `ALLOW_BOOTSTRAP_ON_NON_EMPTY_DB=true`. |
| `npm run db:reset-added-users`             | Refuses `NODE_ENV=production` and is a dry run unless invoked with `-- --confirm`. It is development-only and is not a public-demo reset.                                                                                                                                                      |
| `npm run db:seed:check`                    | Requires a dedicated database whose parsed database name contains `test`; never weaken this guard.                                                                                                                                                                                             |
| `npm run db:preflight-settings-singletons` | Requires `SETTINGS_SINGLETON_PREFLIGHT_ACK=read-only`; performs read-only settings queries.                                                                                                                                                                                                    |
| `npm run db:verify-duplicate-indexes`      | Requires `DUPLICATE_INDEX_VERIFY_ACK=read-only` and `DUPLICATE_INDEX_VERIFY_PHASE=before` or `after`; performs read-only catalog/plan checks.                                                                                                                                                  |
| `npm run db:maintain-auth`                 | Uses only pooled `DATABASE_URL`; retention is fixed in code at seven days and has no environment override.                                                                                                                                                                                     |
| `npm run db:retry-payslip-deletes`         | Uses pooled `DATABASE_URL` and all four R2 values; there is no batch/retry environment override.                                                                                                                                                                                               |

## Provider placement

- **Vercel frontend:** set only `VITE_API_URL` when explicit API-origin selection
  is needed. Vite reads it at build time; a root server env file is not a client
  env source.
- **Render API:** set `NODE_ENV=production`, exact HTTPS `CLIENT_URL`, pooled
  `DATABASE_URL`, demo flags, and the upload byte limit. Render owns `PORT`.
  Add all four R2 secrets when private payslip reads are needed, including in a
  read-only demo with existing payslips; writes remain prohibited in the public
  demo. `DIRECT_URL` belongs to migration execution, not API runtime.
- **Render auth-maintenance cron:** only pooled `DATABASE_URL`.
- **Render payslip-maintenance cron:** pooled `DATABASE_URL` plus all four private
  R2 values.
- **Local root:** the API and Prisma/scripts load root `.env.local`. The Vite
  client uses `client/.env.local`; keep browser-visible `VITE_*` values non-secret.

After configuring providers, complete the
[deployment verification checklist](verification-checklist.md). Repository code
and `render.yaml` declarations do not prove that provider secrets, Cloudflare
rules, cron services, monitors, TLS, or bucket privacy are active.
