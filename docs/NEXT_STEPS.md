# Makina Trafikskola — Next Steps

This is the ordered path from the current build to a safe public launch.

## 1. Finish the real instructor data

For every instructor, collect and approve:

1. Public portrait photo.
2. Teaching languages.
3. Manual, automatic, or both.
4. Years of teaching experience.
5. Public teaching/base location — never a home address or live GPS location.
6. Weekly working hours.
7. Vehicle model and transmission.
8. A short approved biography.

Load the data through the admin interface, verify each public profile, and then
remove the temporary initials portraits. Keep all private phone numbers,
personal email addresses, identity numbers, and residential addresses out of
the public site.

## 2. Finish production account configuration

Configure these as Railway environment variables. Never commit their values:

1. Rotate the Stripe restricted key and webhook secret that were shared in
   chat, then set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Create Google OAuth web credentials and set `AUTH_GOOGLE_ID` and
   `AUTH_GOOGLE_SECRET`. Add the production Auth.js callback URL in Google
   Cloud.
3. Keep the browser Maps key restricted to the production domain and set
   `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.
4. Configure `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.
5. Enable R2 in Cloudflare and configure the R2 upload and backup variables.
6. Confirm `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, and the
   production PostgreSQL URL.

## 3. Complete payment acceptance

1. Confirm the Stripe restricted key can create, retrieve, and cancel Payment
   Intents.
2. Configure the live webhook endpoint:
   `https://<production-domain>/api/webhooks/stripe`.
3. Subscribe it to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
4. Make one low-value live card purchase and refund.
5. Make one live Swish purchase and refund.
6. Test Klarna only after it is enabled for the Stripe account.
7. Confirm each webhook changes the order and credit ledger exactly once.
8. Confirm failed and late payments do not create duplicate bookings.

## 4. Complete SMS and Google sign-in

1. Send a consented test SMS to a client-approved number.
2. Test OTP request limits and the daily cap in production.
3. Test Google sign-in with a new user.
4. Confirm Google sign-in requires Swedish phone verification.
5. Confirm an existing phone account is linked instead of duplicated.
6. Verify login and account creation in all five locales.

## 5. Finish theory content

The build includes three original free sample questions in all five languages.
Before selling full theory access:

1. Confirm ownership or licensing for the complete question bank.
2. Import the licensed questions with `npm run theory:import`.
3. Review every translation and explanation with qualified speakers.
4. Add and verify required question images.
5. Confirm at least 65 eligible questions exist for the mock exam.
6. Test the 50-minute timer, 52/65 pass threshold, and paid-access gate.

## 6. Enable backup, restore, monitoring, and cron

1. Enable Cloudflare R2 and create a private backup bucket.
2. Install PostgreSQL client tools on the backup runner.
3. Run `npm run backup:db`.
4. Restore the newest backup into a disposable database whose name contains
   `restore` or `test`.
5. Record the successful restore date.
6. Configure Sentry and verify a scrubbed test error from browser and server.
7. Schedule `/api/cron/core` with the bearer secret.
8. Verify hold expiry, credit expiry, reminders, pickup-data purging, and
   instructor rating updates.
9. Monitor `/api/health`.

## 7. Complete content and migration

1. Replace temporary staff portraits.
2. Confirm every product, package inclusion, validity period, and course time.
3. Confirm the full cancellation and package-refund policy with the client.
4. Export the old WordPress sitemap.
5. Add a permanent redirect for every indexed old URL.
6. Verify legal company details and public contact channels.
7. Confirm no placeholder office, instructor, vehicle, or course data remains.

## 8. Run final launch QA

1. Test Swedish, English, Tigrinya, Arabic, and Somali on mobile.
2. Test Arabic RTL for overflow and icon direction.
3. Test keyboard navigation, labels, focus states, and touch targets.
4. Test homepage performance on a throttled mobile connection.
5. Test instructor filtering by language, location, and transmission.
6. Test map movement, marker selection, instructor details, and list fallback.
7. Complete the full booking, payment, cancellation, and refund journey.
8. Verify account export and deletion.
9. Run typecheck, lint, unit tests, database integration tests, browser tests,
   translation parity, and the production build.
10. Require a green GitHub CI run on the exact launch commit.

## 9. Controlled launch

Only after the previous steps pass:

1. Activate the approved products.
2. Set `INSTRUCTORS_ENABLED=1`.
3. Verify public instructor pages against production data.
4. Set `BOOKING_ENABLED=1`.
5. Perform one final production booking from a normal phone.
6. Switch DNS only after redirects, monitoring, backups, and rollback are
   ready.
7. Watch errors, payment failures, SMS delivery, and booking conflicts closely
   during the first 48 hours.
