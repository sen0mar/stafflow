# Payslip Storage Maintenance

Payslip metadata is soft-deleted before its private R2 object is removed. If R2
is temporarily unavailable, the metadata keeps its object key so deletion can
be retried safely.

Run the idempotent recovery command manually from the repository root:

```sh
npm run db:retry-payslip-deletes
```

The command selects only payslips whose status is `DELETED` and whose
`deletedAt` timestamp is present. It retries each private object deletion,
treats an already-missing object as success, never changes database rows, and
prints counts plus a generated request ID without printing object keys or
signed URLs. A nonzero failed count sets a nonzero exit status so scheduled
operations can alert and retry later.

`render.yaml` declares a daily cron using this command. Configure its pooled
`DATABASE_URL` plus `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` in Render, then verify the cron is
active after deployment. Re-running the command is safe because R2 deletion and
missing objects are treated idempotently. The API also needs the complete R2
group for private payslip reads in any deployment; public-demo writes remain
blocked independently.
