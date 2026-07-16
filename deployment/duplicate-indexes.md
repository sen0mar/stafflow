# Duplicate Index Deployment Verification

Migration `20260716140000_remove_duplicate_indexes` removes only the redundant
non-unique indexes on `AttendanceRecord(employeeId, date)` and
`Payslip(employeeId, year, month)`. The equivalent unique indexes remain the
lookup and constraint indexes.

Before deployment, point `DATABASE_URL` at the intended deployment database and
run the read-only catalog and query-plan inspection:

```sh
DUPLICATE_INDEX_VERIFY_ACK=read-only \
DUPLICATE_INDEX_VERIFY_PHASE=before \
npm run db:verify-duplicate-indexes
```

The command opens a read-only transaction, checks exact index names, tables,
column order, uniqueness, validity, access method, predicates, expressions, and
included columns, then prints `EXPLAIN (FORMAT JSON)` output without executing
the lookups. It never applies the migration or changes planner configuration.
If a definition is absent or unexpected, stop deployment; the migration repeats
the exact checks and aborts before dropping either index.

After deployment, run the same command with
`DUPLICATE_INDEX_VERIFY_PHASE=after`. It requires both unique indexes and both
removed non-unique indexes to be absent, captures the normal lookup plans, and
uses a transaction-local planner check to prove each retained unique index can
serve its exact-key lookup. Transaction-local settings disappear when the
read-only transaction ends.

Before proposing trigram, full-text, or other search infrastructure, capture
representative slow-query evidence from the deployment database. If
`pg_stat_statements` is enabled, review normalized search statements by total
and mean execution time; otherwise use the provider's slow-query dashboard or
temporary threshold logging. Record the observation window, call count, row
volume, p95/mean latency, and examined plan. Do not add ordinary B-tree indexes
for `contains`/case-insensitive searches, and do not change offset pagination or
dashboard query fan-out without measurements showing a real problem.
