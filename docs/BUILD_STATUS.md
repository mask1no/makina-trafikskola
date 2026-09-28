# Makina Trafikskola — Build Status

Updated: 28 September 2026

## Product goal

Makina Trafikskola needs a modern, multilingual website and operating system
for a Stockholm driving school. Students should be able to compare transparent
prices, find an instructor by language and teaching area, book safely, pay,
receive SMS updates, study theory, and manage their account. Instructors and
administrators need practical daily tools without exposing private data.

The required locales are Swedish, English, Tigrinya, Arabic, and Somali.
Arabic is right-to-left.

## Delivery level

The engineering build is roughly 85% complete. The public-launch programme is
roughly 65% complete because several remaining items depend on client-owned
accounts, approved instructor data, licensed theory content, and real payment
acceptance.

These percentages describe readiness, not source-code volume. Core systems are
implemented; the remaining work is concentrated in high-risk launch steps.

## What has been delivered

### Public experience

- Responsive multilingual homepage and navigation.
- Modern hero, benefit cards, product cards, journey, theory promotion, FAQ,
  footer, and mobile navigation.
- Five-language UI with Arabic RTL support.
- Public pricing and package pages.
- Instructor list with language-first filtering, location and transmission
  filters, map/list relationship, instructor profiles, and marker details.
- Google Maps and Swedish address autocomplete.
- Contact page with the confirmed office, school contact channels, staff roles,
  privacy-safe staff cards, directions, and an interactive map.
- Local SEO pages, sitemap, robots, structured data, legal pages, cookie
  consent, PWA manifest, service worker, and offline page.

### Accounts and authentication

- Email and password registration and login.
- Swedish phone OTP registration, login, password reset, and rate limiting.
- Google provider and phone-linking flow implemented.
- Google account linking avoids duplicate accounts.
- Role-aware sessions and protected student, instructor, and admin routes.
- Google buttons remain visibly disabled until the client-owned OAuth
  credentials are configured.

### Booking and scheduling

- Pure Stockholm-time slot engine with daylight-saving-time tests.
- Availability rules, exceptions, travel buffers, minimum notice, and 50/100
  minute lessons.
- Atomic booking and credit consumption.
- Database-level teacher and student overlap protection.
- Idempotency keys and refreshed slot responses.
- Unpaid booking holds and expiry handling.
- Cancellation rules, credit refunds, late cancellation handling, and
  instructor/admin cancellation behavior.
- Concurrency behavior verified with parallel database requests.

### Payments and credits

- Server-resolved product prices in integer öre.
- Stripe Payment Intent integration for card, Swish, and Klarna-capable flows.
- Signed, raw-body Stripe webhook handling.
- Idempotent payment fulfillment and refund handling.
- Credit ledger with purchase, booking, cancellation, refund, adjustment, and
  expiry transactions.
- Course entitlement and late-payment handling.
- A live restricted Stripe key and publishable key have been validated locally,
  but they must be rotated before production because they were shared in chat.
- A live webhook secret has been configured locally but also requires rotation
  and deployment configuration.

### Theory

- Free and paid theory access gates.
- Category study flow, answer checking, explanations, saved attempts, and image
  handling.
- Mock-exam structure with 65 questions, a 50-minute timer, and a 52/65 pass
  threshold.
- Three original free sample questions with answers and explanations in all
  five locales.
- Import pipeline for a future licensed question bank.

### Staff and administration

- Student dashboard for bookings, credits, theory, payments, profile, messages,
  data export, and account deletion.
- Instructor daily portal and lesson reporting.
- Admin overview, calendar, booking controls, student search, credit
  adjustments, instructor creation, image upload, and review moderation.
- Audit logging for sensitive administrative writes.
- Verified staff names and roles are displayed publicly.
- Identity numbers, residential addresses, and private contact details are not
  stored in public content.

### Operations and security

- Strict validation and role/ownership checks on sensitive routes.
- Rate limits for OTP, login, booking, and reviews.
- PII scrubbing in Sentry configuration.
- Health endpoint and authenticated core cron.
- Database backup and isolated restore scripts.
- R2 signed image-upload flow.
- Security headers and production environment validation.
- GitHub CI covering typecheck, lint, tests, database concurrency, webhook
  replay, translation parity, and production build.

## Current data state

- The only confirmed public office is Centralvägen 5 in Upplands Väsby.
- Staff portraits use initials-based placeholders.
- Staff names and job roles are known.
- Public instructor languages, transmissions, schedules, vehicles, years of
  experience, approved biographies, and teaching bases are not yet complete.
- Residential addresses and live GPS locations will not be used as public
  instructor locations.
- Public map markers represent approved teaching/base locations only.
- Product prices are populated and Swedish private driving education uses 25%
  VAT.
- The full theory bank is not published because ownership/licensing remains
  unconfirmed.

## Verified quality

The current branch has passed:

- TypeScript strict checking.
- ESLint.
- Translation-key parity for all five locales.
- Unit and database integration tests.
- Parallel booking conflict tests.
- Stripe webhook replay tests.
- Production builds.
- Desktop browser launch flows.
- Mobile route checks in all five locales.
- Arabic RTL checks.
- Google Maps and Places loading.
- Health and authenticated cron execution.
- GitHub CI.

## External blockers

The following cannot be completed safely from source code alone:

1. Google OAuth client ID and secret.
2. Rotated production Stripe keys and a real Swish/refund acceptance run.
3. Sentry project DSNs.
4. Cloudflare R2 activation, credentials, backup bucket, and tested restore
   target.
5. Approved public instructor operational data and final photos.
6. Licensed full theory-question content.
7. Old WordPress sitemap and complete redirect inventory.
8. Final client sign-off on cancellation, refunds, products, and course
   delivery.

## Launch state

Public instructor visibility can be enabled in a development environment for
review. Public booking must remain disabled until real instructor availability,
production payment acceptance, SMS delivery, backups, monitoring, and the final
five-language QA pass are complete.

The exact remaining sequence is maintained in `docs/NEXT_STEPS.md`.
