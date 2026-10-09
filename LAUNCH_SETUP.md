# Launch setup

Production values live in `.env.railway` (git-ignored). Next.js must not load that file as `.env.production.local`.

```bash
npm run env:railway:check
npm run env:railway:apply
```

`THEORY_MODE` is `off`, `free` (default) or `full`. `free` shows the 20 practice questions and hides the paid theory product.

## Admin

```bash
railway run npm run admin:grant -- --email name@makina.se
```

The password is typed in the terminal and is not printed. Minimum 12 characters.

## Areas

Farsta and Upplands Väsby are active. Uppsala is coming soon. The seeded boundaries are rough placeholders marked TODO. Replace them in admin, or with `client-data/areas/*.geojson` and `npm run client:apply`.

## Calendar

Set `GOOGLE_CALENDAR_SYNC_ENABLED=1` and `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` (the service-account JSON, base64). Share each teacher's Google calendar with the service account, then save the calendar email on the teacher and press Testa.

## Client import

Put `teachers.json`, `photos/` and `areas/*.geojson` in `client-data/` (git-ignored).

```bash
npm run client:check
railway run npm run client:apply
```

## Railway schedules

Do not put a cron schedule on the web service. Add two Railway cron services:

1. Every 15 minutes: `POST https://www.makina.se/api/cron/core` with header `Authorization: Bearer <CRON_SECRET>`.
2. Nightly at 01:00 UTC: `npm run backup:db`.

## Dashboard steps only a person can click

1. Stripe → Developers → Webhooks. Keep exactly one enabled endpoint at `https://www.makina.se/api/webhooks/stripe`. Disable any endpoint whose URL is `makina.se/sv` or anything else. Subscribe `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `payment_intent.succeeded`, `payment_intent.payment_failed` and `charge.refunded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
2. Google Cloud → APIs & Services → Credentials. Create an OAuth client for `https://www.makina.se` and put the id and secret in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
3. Google Cloud → enable Maps JavaScript API and Places API (New). Restrict the browser key to `https://www.makina.se/*` and `https://makina.se/*`. Create a Map ID and set `GOOGLE_MAPS_BROWSER_KEY` and `GOOGLE_MAPS_MAP_ID`.
4. Google Workspace → share each teacher calendar with the service account email. Put the JSON in `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` and set `GOOGLE_CALENDAR_SYNC_ENABLED=1`.
5. Cloudflare R2 → confirm the backup bucket and the upload bucket credentials in `.env.railway`.
6. Sentry → confirm `SENTRY_DSN` is the project DSN for this app.
7. Google Business Profile → create or claim the Farsta location and link `https://www.makina.se`.
