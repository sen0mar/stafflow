# Operational Readiness

Stafflow exposes two unauthenticated, non-sensitive operational endpoints:

- `GET /health` is process liveness only. It performs no database or storage
  work and returns `200 {"data":{"status":"ok"}}` while Express can serve a
  request.
- `GET /ready` is dependency readiness. It runs a bounded lightweight database
  query and returns either `200 {"data":{"status":"ready"}}` or
  `503 {"data":{"status":"not_ready"}}`. It never returns database errors,
  connection strings, or credentials.

The Render Blueprint uses `/health` as `healthCheckPath`. Keep that platform
health check dependency-free: switching it to `/ready` can turn a recoverable
Neon outage into repeated application restarts. Use `/ready` for an external
dependency-aware monitor, post-deploy verification, or traffic-readiness check
where a `503` will alert or withhold traffic without restarting the process.

Vercel serves only the static frontend and its SPA rewrite. It must not proxy or
claim the API health endpoints; use Vercel's deployment status for the client
and the Render API endpoints for backend health.

Render sends `SIGTERM` during deploys and shutdowns. The server stops accepting
new connections, closes idle connections, drains active HTTP connections, and
attempts one Prisma disconnect inside a single 10-second total budget. At the
deadline it force-closes remaining HTTP connections when the Node runtime
supports it and stops waiting for a hanging disconnect. `SIGTERM` and `SIGINT`
share one idempotent shutdown operation.

Production startup validation requires:

- `CLIENT_URL` to be an HTTPS URL. HTTP remains valid only outside production
  for local development and tests.
- `PORT` to be an integer from 1 through 65535.
- public demo uploads to remain disabled. Any
  `DEMO_UPLOADS_ENABLED=true` value fails startup until enforceable upload
  quotas and automated cleanup are implemented as real configuration and
  behavior. Private non-demo uploads do not depend on this demo-only flag.
