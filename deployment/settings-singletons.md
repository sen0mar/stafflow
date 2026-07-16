# Settings Singleton Migration

The company, attendance, and leave settings tables each have one deterministic
record. Before deploying migration `20260716130000_enforce_settings_singletons`,
inspect the configured deployment database with the read-only preflight:

```sh
SETTINGS_SINGLETON_PREFLIGHT_ACK=read-only npm run db:preflight-settings-singletons
```

Run it only with `DATABASE_URL` pointing at the intended deployment database.
The command reads IDs and row counts from the three settings tables; it does not
write data.

- A count of zero is safe: the migration creates the default stable record.
- A count of one is safe: the migration preserves its values and re-keys it to
  the stable ID when necessary.
- A count above one is not safe. Stop the deployment and request explicit
  approval for a separately reviewed cleanup plan. Do not delete, merge, or
  select a winning row implicitly.

The migration repeats the count check inside its transaction and raises an
exception before changing any table if duplicates exist. After a successful
migration, primary keys plus stable-ID check constraints prevent additional
settings records. Re-run the preflight to verify count `1` and the expected ID
for all three tables.
