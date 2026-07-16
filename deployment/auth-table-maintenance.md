# Auth table maintenance

Stafflow retains terminal authentication rows for seven days, then removes them with the idempotent `npm run db:maintain-auth` command. The command runs all deletions in one Prisma transaction with one cutoff and deletes only rows whose terminal timestamp is strictly older than that cutoff:

- sessions: `expiresAt < cutoff` or `revokedAt < cutoff`;
- invitation tokens: `expiresAt < cutoff` or `acceptedAt < cutoff`;
- retained legacy password-reset tokens: `expiresAt < cutoff` or `usedAt < cutoff`.

Rows exactly at the cutoff, unexpired/unrevoked sessions, unused unexpired tokens, users, and audit logs are preserved. A retry with the same cutoff deletes nothing after a successful run.

## Render schedule

The repository's existing backend deployment target is Render. The root `render.yaml` declares a Render cron service named `stafflow-auth-table-maintenance` on the daily UTC schedule `17 3 * * *`. Render prevents overlapping executions by delaying the next occurrence while an earlier run is still active.

The repository cannot activate the service or provide production credentials by itself. To activate it:

1. In the Render Dashboard, create a Blueprint from this repository and select the root `render.yaml`.
2. Confirm that the Blueprint proposes only the `stafflow-auth-table-maintenance` cron service; the existing manually managed web service remains unchanged.
3. Set the cron service's secret `DATABASE_URL` to the same pooled Neon PostgreSQL URL used by the API. Do not commit the URL. `DIRECT_URL` is not required for this runtime cleanup.
4. Apply the Blueprint and wait for `npm ci && npm exec -- prisma generate` to finish.
5. Open the cron service and use **Trigger Run** once. Confirm that it exits successfully and emits one JSON `auth_table_maintenance_completed` event containing the cutoff and three deletion counts.
6. Confirm the next-run time is 03:17 UTC and check after the next scheduled occurrence that Render records a successful run within the preceding 24 hours.

For a non-production verification, point `DATABASE_URL` only at a dedicated test database, insert live/current/boundary and past-terminal fixtures, run `npm run db:maintain-auth` twice, and confirm that the first run deletes only eligible rows while the second reports zero deletions. Never use destructive verification fixtures in the shared demo or production database.

Render cron and Blueprint behavior are documented in the official [Cron Jobs](https://render.com/docs/cronjobs) and [Blueprint YAML Reference](https://render.com/docs/blueprint-spec) documentation.
