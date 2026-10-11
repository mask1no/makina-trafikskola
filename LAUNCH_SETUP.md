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

## Ordered launch runbook

1. Complete and approve real instructor photos, teaching languages, transmissions, experience, public teaching/base locations, weekly hours, vehicles and biographies. Remove test and fixture rows from the production database operationally; application queries do not hide them by name.
2. Rotate any production Stripe credentials previously shared outside the client-owned secret store. Configure Railway with Stripe, Google OAuth, restricted Maps, 46elks, Sentry and R2 values. Never commit them.
3. Test one low-value live card purchase and refund, then one live Swish purchase and refund. Enable Klarna only after the account supports it. Confirm webhook replays grant each entitlement once and failed/late payments do not duplicate bookings.
4. Send a consented production SMS, exercise OTP limits, and verify new and existing-account Google sign-in with Swedish phone confirmation in all four locales.
5. Confirm theory-bank ownership before selling access. Import with `npm run theory:import`, review every translation, explanation, citation and image, and verify at least 65 eligible questions for the 50-minute mock exam.
6. Run `npm run backup:db`, restore the newest object into an isolated `restore`/`test` database with `npm run verify:restore`, record the successful date, verify scrubbed Sentry events, schedule cron, and monitor `/api/health`.
7. Confirm products, package inclusions, VAT, validity, cancellation/refund wording, legal details and contact channels. Export the old WordPress sitemap and add permanent redirects for every indexed URL.
8. Run mobile, keyboard, touch-target and RTL QA in `sv`, `en`, `ti` and `ar`; complete booking, payment, cancellation, refund, export and deletion; run all automated checks and require green CI on the exact launch commit.
9. Activate approved products, set `RISK2_CONFIRMED=1` and `GUARANTEE_CONFIRMED=1` only for client-approved offerings, set `INSTRUCTORS_ENABLED=1`, verify production instructor data, then set `BOOKING_ENABLED=1`. Make one final phone booking before DNS cutover and watch errors, payments, SMS and booking conflicts for 48 hours.

Booking must remain disabled until real availability, production payment acceptance, SMS delivery, backups, monitoring and the final four-locale QA pass are complete.
