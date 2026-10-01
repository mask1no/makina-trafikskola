# Makina Trafikskola

Driving school site for Makina Trafikskola in Upplands Väsby. Students book lessons, buy packages and practise theory. The site is in Swedish, English, Tigrinya, Arabic (RTL) and Somali. Teaching is in Swedish, English, Tigrinya and Arabic. Somali teaching is not offered yet.

The app does not send email. Codes, booking messages and the 24-hour reminder are SMS. Stripe sends payment receipts.

## Architecture

Next.js App Router, React server components, and a client leaf only where the screen needs state. Prisma talks to Postgres. Route handlers validate with Zod, then `requireRole`, then ownership, then the action.

Business rules live in `src/lib` and take `now: Date` when time matters. Prices are integer öre. Times are stored in UTC and shown in Europe/Stockholm with Latin digits.

Notifications are queued, rendered from `src/emails`, and sent by 46elks. `/api/cron/core` runs the queue, reminders and credit expiry. The Stripe webhook reads the raw body, checks the signature, and inserts `StripeEvent` before it fulfils an order.

## Local setup

```bash
docker compose up -d
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The app is at http://localhost:3000. Postgres from Compose is on port 5433:

```
DATABASE_URL=postgresql://makina:makina_local_dev@localhost:5433/makina
```

`npm run theory:import` loads the question bank. The bank file stays out of git.

## Environment

Required in production (`src/lib/env.ts`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection |
| `AUTH_SECRET` | Session signing |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin |
| `ELKS_API_USERNAME` / `ELKS_API_PASSWORD` | 46elks SMS |
| `CRON_SECRET` | Bearer token for `/api/cron/core` |

Also used:

| Variable | Purpose |
| --- | --- |
| `AUTH_URL` | Auth.js callback base |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Maps and pickup autocomplete |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Advanced markers |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring. Events are scrubbed before send |
| `R2_*` | Instructor photos and database backups |
| `BOOKING_ENABLED` | `1` shows booking. `0` replaces it with a phone call |
| `INSTRUCTORS_ENABLED` | `1` shows instructor pages and the map |
| `CANCELLATION_WINDOW_HOURS` | Free-cancel cutoff. Default 24 |
| `MIN_BOOKING_NOTICE_HOURS` | Shortest notice for a new booking |
| `BOOKING_HOLD_MINUTES` | Unpaid booking hold |
| `DEV_CRON_SECRET` / `DEV_OTP_CODE` | Local-only helpers. Ignored in production |

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build. Start runs `prisma migrate deploy` first |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run test:run` | Unit tests |
| `npm run check:translations` | The five message files have the same keys |
| `npm run test:concurrency` | Booking lock integration test. Needs `RUN_DB_INTEGRATION=1` |
| `npm run test:webhook-replay` | Stripe webhook replay. Needs `RUN_DB_INTEGRATION=1` |
| `npm run test:e2e` | Seed, build, Playwright |
| `npm run theory:import` | Import the question bank |
| `npm run backup:db` / `npm run verify:restore` | Backup to R2 and test a restore |

## Launch flags

`BOOKING_ENABLED=0` and `INSTRUCTORS_ENABLED=0` are the production defaults until real availability and instructor profiles are confirmed. Product feature lists stay in the database and are not shown as a sales promise while products are inactive.

## Deployment

Railway builds the app, then the start command runs `prisma migrate deploy` and `next start`. Set the production variables above. Point a scheduler at `POST /api/cron/core` every 15 minutes with `Authorization: Bearer <CRON_SECRET>`.

Stripe webhook: `POST /api/webhooks/stripe`. Payment methods are automatic (card, Swish, Klarna). The handler must receive the raw body.

46elks: set the API user and password. SMS goes only to Swedish `+46` numbers.

Google OAuth: create a web client. Redirect URIs are `https://www.example/api/auth/callback/google` and the apex host. Publish the consent screen before real students sign in.

Teacher phones are stored on the user and shown to the teacher in the portal. The calendar feed is `/api/teachers/calendar/[token]`. The token is created in the portal and must not be logged.

Backups upload a `pg_dump` to the R2 backup bucket. `npm run verify:restore` checks that a dump can be restored into `RESTORE_DATABASE_URL`.

## Unconfirmed addresses

An address that starts with `TODO` is treated as unconfirmed. `publicAddress()` hides it on public pages and APIs. A boolean column would be cleaner later.

## Content security policy

`Content-Security-Policy-Report-Only` allows this origin, Stripe, Google Maps, Google sign-in, Sentry and the public R2 host. Rename that header to `Content-Security-Policy` in `next.config.mjs` when the reports are clean.

## Testing

Unit tests run with Vitest. Integration tests stay skipped until `RUN_DB_INTEGRATION=1`. End-to-end tests use Playwright against a seeded database. CI runs the unit, integration and build checks on every push, and Playwright on pull requests and on `cursor/makina-foundation`.
