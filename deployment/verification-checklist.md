# Deployment Verification Checklist

Use this checklist after environment or provider changes and before sharing the
public demo. The linked [Section 25 regression matrix](../context/audit-25-regression-matrix.md)
records code-level coverage. Items marked **external/manual** cannot be proven by
the repository or `render.yaml` alone.

- [ ] **Exact origin, HTTPS, and cookies (code-enforced + external/manual):** Set
      Render `CLIENT_URL` to the one exact HTTPS frontend origin and Vercel
      `VITE_API_URL` to the exact HTTPS API origin. From that frontend, log in and
      confirm authenticated requests succeed with credentials included. Confirm
      `stafflow_session` is `HttpOnly; Secure; SameSite=None`; the readable CSRF
      cookie is `Secure; SameSite=None`. A request with a different `Origin` must not
      receive an allowing CORS header. Startup must reject an HTTP production
      `CLIENT_URL`. Environment validation is covered by
      [`env.test.ts`](../server/src/config/env.test.ts); cookie attributes are
      enforced in [`session.service.ts`](../server/src/core/auth/session.service.ts)
      and [`csrf.service.ts`](../server/src/core/auth/csrf.service.ts) but require the
      production browser/header verification above.
- [ ] **Public demo is read-only (code-tested):** Deploy with `DEMO_MODE=true`
      and `DEMO_UPLOADS_ENABLED=false`. Confirm GET pages and login/logout work, the
      read-only banner is visible, and representative admin and employee mutation
      requests return `403` with `error.code="DEMO_READ_ONLY"`. The exhaustive route
      matrix is [`api-flows.test.ts`](../server/test/integration/api-flows.test.ts)
      (guarded DB) and is mapped under audit Sections 03–04 in the Section 25 matrix.
- [ ] **No public identity persistence or recovery (code-tested):** Confirm there
      is no registration UI; invitation create/regenerate/accept, employee/account
      create/status changes, password change, and profile mutation return
      `DEMO_READ_ONLY`. `POST /auth/forgot-password` and
      `POST /auth/reset-password` must both return `404 NOT_FOUND`. Evidence:
      [`deferred-password-reset.test.ts`](../server/test/integration/deferred-password-reset.test.ts)
      plus the demo attack-chain/route-matrix and reset non-persistence risks named
      under audit Sections 03, 04, and 06 in the Section 25 matrix. Do not claim
      email recovery is available.
- [ ] **Private R2 and safe downloads (code-tested + external/manual):** If
      private payslip reads are enabled in any deployment (including a read-only demo
      with existing payslips), configure all four R2 variables, disable public
      bucket/object access in Cloudflare, and verify a raw
      object URL is not public. Confirm only an authorized backend request can obtain
      a five-minute signed URL and that logs contain neither that URL nor its object
      key. Evidence: the storage/log-safety risks under audit Sections 14–15 in the
      Section 25 matrix and
      [`payslips.service.test.ts`](../server/src/modules/payslips/payslips.service.test.ts).
- [ ] **Uploads are prohibited or bounded (code-tested):** In the public demo,
      an upload mutation must fail with `DEMO_READ_ONLY` before controller/storage
      work; startup must reject `DEMO_UPLOADS_ENABLED=true`. In a private non-demo
      deployment, a PDF above `PAYSLIP_MAX_UPLOAD_BYTES` (default 2 MiB) must return
      `413 PAYSLIP_FILE_TOO_LARGE`, and malformed/non-PDF multipart inputs must be
      rejected before R2 work. Evidence: the upload-DoS, demo route-matrix, and
      storage-hardening risks under audit Sections 02, 04, and 14 in the Section 25
      matrix.
- [ ] **Liveness and readiness (code-tested + external/manual):** Keep Render's
      platform health path at `GET /health`; expect
      `200 {"data":{"status":"ok"}}`. Monitor `GET /ready` separately; expect
      `200 {"data":{"status":"ready"}}` with PostgreSQL available and sanitized
      `503 {"data":{"status":"not_ready"}}` otherwise. Evidence:
      [`routes.operational.test.ts`](../server/src/routes.operational.test.ts).
- [ ] **Scheduled controls are active (external/manual):** In Render, activate
      both declared daily cron services, set only their documented secrets, trigger
      an initial run, and confirm a successful run within 24 hours. Auth maintenance
      emits `auth_table_maintenance_completed`; payslip retry emits
      `payslip_object_delete_retry_completed` and must not print object keys. Also
      activate and verify the Cloudflare public-auth throttling rule and disable the
      direct Render hostname. Follow
      [`auth-table-maintenance.md`](auth-table-maintenance.md),
      [`payslip-storage-maintenance.md`](payslip-storage-maintenance.md), and
      [`public-auth-edge-throttling.md`](public-auth-edge-throttling.md).
- [ ] **Safe logging and request IDs (code-tested + external/manual):** Send a
      request with a valid short `X-Request-Id` and confirm it appears in the response
      and one structured access log. Send an invalid/oversized value and confirm a
      generated ID replaces it. Check that expected 4xx responses log once at info,
      5xx responses log at error, and cookies, authorization/CSRF headers, passwords,
      tokens, files, private URLs, signed URLs, and object keys are absent. Evidence:
      the audit Section 15 and additional operational log-safety risks in the
      Section 25 matrix plus
      [`http-logger.test.ts`](../server/src/core/logger/http-logger.test.ts).

Record the deployed frontend/API origins, provider service names, verification
time, and operator outside the repository. Never paste credentials, cookies,
database URLs, R2 keys, raw files, or signed URLs into tickets or logs.
