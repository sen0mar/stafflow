# Operations

Session and demo policy belong to [security](security.md); release/provider checks are in the [demo safety checklist](../checklists/demo-safety.md).

## Deployment and Environment Model

Production target:

- Frontend on Vercel.
- Backend on Render.
- Database on Neon PostgreSQL.
- File storage on Cloudflare R2.

Recommended domain setup:

- Buy one domain.
- Use `app.<domain>` for the Vercel frontend.
- Use `api.<domain>` for the Render backend.
- Configure CORS to allow only the exact frontend origin.
- Configure the Vercel frontend with `VITE_API_URL` pointing at the Render API origin unless production uses the documented `app.<domain>` and `api.<domain>` sibling-subdomain pattern.
- Verify the [cookie/session contract](security.md#auth-and-collaboration-model) and [credentialed fetch contract](api-and-performance.md#api-and-data-flow-model) across the deployed frontend and API origins. Non-secret CSRF tokens may be returned in auth responses.
- Configure Express `trust proxy` correctly on Render so secure cookies and client IPs work as intended.
- Activate and verify the provider-level public-auth rate-limit rule in [deployment/public-auth-edge-throttling.md](../../deployment/public-auth-edge-throttling.md); repository code does not imply that external Cloudflare state is active.
- Activate and verify the daily Render auth-table maintenance cron declared in `render.yaml` by following [deployment/auth-table-maintenance.md](../../deployment/auth-table-maintenance.md); repository configuration does not prove that the external cron service or its database secret is active.
- Activate and verify the daily Render payslip-storage maintenance cron declared in `render.yaml` by following [deployment/payslip-storage-maintenance.md](../../deployment/payslip-storage-maintenance.md); it requires private R2 credentials and retries only soft-deleted payslip objects.
- Keep the baseline Vercel browser headers aligned in both Vercel configurations. CSP remains deployment-specific until the concrete frontend, API, and R2 preview origins are known; follow [deployment/browser-security-headers.md](../../deployment/browser-security-headers.md) rather than shipping guessed or wildcard directives.
- Keep Render's platform health check on dependency-free `/health`. Use the
  bounded database-backed `/ready` contract for dependency-aware monitoring or
  traffic readiness without turning database incidents into application restart
  loops. Vercel serves only the frontend and does not own API health routes.
- On `SIGTERM` or `SIGINT`, stop accepting HTTP connections, drain or force-close
  them, and attempt exactly one Prisma disconnect inside the documented
  10-second total shutdown budget. Bootstrap imports do not install signal
  listeners, and registered listeners are removed when the server closes.

Environment variables must be validated at server startup. Missing required variables should fail fast.

Production `CLIENT_URL` must use HTTPS and `PORT` must be an integer from 1
through 65535. Because upload quotas and automated cleanup are not implemented,
startup fails closed whenever the demo-upload enablement flag is true.

The authoritative variable/owner map is
[deployment/environment-configuration.md](../../deployment/environment-configuration.md). The implemented server schema contains
only `NODE_ENV`, provider-owned/defaulted `PORT`, exact `CLIENT_URL`, pooled
`DATABASE_URL`, optional migration-only `DIRECT_URL`, `DEMO_MODE`, fail-closed
`DEMO_UPLOADS_ENABLED`, `PAYSLIP_MAX_UPLOAD_BYTES`, and four independently
optional R2 credential/bucket fields. Startup permits missing or partial R2
configuration because the client is lazy; every storage read/write/delete
operation requires the complete four-value group and otherwise fails safely as
unconfigured. `VITE_API_URL` is a Vercel/client build variable,
not a server variable. Stafflow has no session-secret or email-provider variable:
session tokens are randomly generated and hashed, and password recovery/email
delivery remain deferred. Script-only bootstrap and read-only acknowledgement
variables are documented separately from runtime settings.

## Technical logging

Use Pino and pino-http: structured JSON in production, readable pretty output only in development. Include request ID, method, path, status, duration, and authenticated user ID when available. Technical logs are distinct from PostgreSQL business audit records; see [data and storage](data-and-storage.md).

Never log passwords, hashes, cookies, tokens, secrets, raw files, private object keys, or signed URLs. Redact sensitive headers and query/body fields.

## Production verification

Verify CORS, cookies, and proxy settings in a production-like deployment. Expected 4xx responses emit one info-level access log unless replaced by one explicit security warning; 5xx responses log at error level. Preserve request IDs without exposing sensitive values.

## Failure modes

- Missing or stale seeded data makes the demo misleading; verify it before release.
- Database failures must not turn liveness checks into restart loops; readiness errors must not expose connection details.
- Provider settings, maintenance crons, and credentials can differ from repository configuration; verify external activation through the linked runbooks.
- Preserve the [API request-ID boundary](api-and-performance.md#api-and-data-flow-model) through proxies and logging.
