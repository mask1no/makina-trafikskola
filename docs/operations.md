# Operations

## Monitoring

Set `SENTRY_DSN` for server and edge reporting and
`NEXT_PUBLIC_SENTRY_DSN` for browser reporting. Reporting stays disabled when
the relevant DSN is absent. Events remove default PII, request bodies,
headers, cookies, query strings, user data, and known contact/lesson-note
fields before transmission.

## Database backups

The backup host needs PostgreSQL client tools (`pg_dump` and `pg_restore`) and
R2 credentials. Set `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, and `R2_BACKUP_BUCKET`. `BACKUP_PREFIX` is optional.

Recommended Railway cron schedule: `0 2 * * *` (UTC), command:

```sh
npm run backup:db
```

Periodically restore the newest backup into a disposable, isolated database:

```sh
npm run verify:restore
```

Set `RESTORE_DATABASE_URL` before running it. The target database name must
contain `restore` or `test`; the script refuses any other target. Set
`BACKUP_OBJECT_KEY` to verify a specific object, otherwise the newest object
under `BACKUP_PREFIX` is used. The restore runs with `--clean --if-exists`, so
the disposable target must not contain data that needs to be kept.

The scripts never print connection URLs or credentials. A real R2 backup and
restore still must be executed and recorded after client-owned credentials
and an isolated target database are available.
