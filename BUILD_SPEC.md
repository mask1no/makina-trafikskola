# Makina Trafikskola — Build Spec

Authoritative spec for the build. **If code and this file disagree, this file
wins.** If this file is silent on something, ask before inventing.

Stockholm driving school. Students are largely newly arrived Swedes. The site
sells driving lessons and theory, lets students book a specific instructor
who speaks their language from a map, and runs in Swedish, English, Tigrinya,
Arabic and Somali.

---

## Quickstart

Everything you need is in this one file. Nothing else to fetch.

**Step 1 — create the files in §12.** Copy them out verbatim:
`prisma/schema.prisma`, the booking-exclusion migration, `prisma/seed.ts`, and
the five `.cursor/rules/*.mdc` files. Save this document itself as
`/BUILD_SPEC.md` in the repo root.

Rename the migration folder to a timestamp **later** than your init migration
so it runs second — e.g. after `20260904120000_init`, call it
`20260904120100_booking_exclusion`.

**Step 2 — install and migrate.**

```bash
npm i -D prisma vitest @vitest/coverage-v8 tsx
npm i @prisma/client next-intl zod date-fns date-fns-tz bcryptjs \
      next-auth@beta stripe resend @vis.gl/react-google-maps

# package.json:  "prisma": { "seed": "tsx prisma/seed.ts" }

npx prisma validate
npx prisma migrate dev --name init
npx prisma db seed
```

**Step 3 — work through §9, one task at a time.** Each task has a
copy-pasteable prompt, the files it may touch, and acceptance criteria. Do not
start a task until the previous one's criteria pass. "It looks right" is not a
criterion; "20 parallel requests produce one booking" is.

**Two habits that save the most time.** When Cursor proposes a schema change,
reject it and point at §4. And run the §9 acceptance criteria before moving on.

**Before going live**, the canonical price list from the client is still
mandatory (§11). Every `Product` is seeded `active: false` for exactly that
reason. The theory bank is the school's own 585 questions (§11.2).

---

## 0. Invariants

These are violated most often by generated code. Check every diff against them.

| # | Rule |
|---|---|
| I1 | **Money is integer öre.** No floats, no `Decimal`, no `number` in kronor. `1845000` = 18 450 kr. |
| I2 | **Prices are resolved server-side from `Product`.** A request may send `productId` and `quantity`. It may never send an amount. If it does, ignore it. |
| I3 | **All timestamps are UTC in the DB.** Business hours are `Europe/Stockholm`. Convert at the edges only. |
| I4 | **No `new Date()` inside business logic.** Take `now: Date` as a parameter. |
| I5 | **The Stripe webhook is the only thing that grants credits.** The browser redirect changes no state. |
| I6 | **Every route handler does four things in order:** Zod-parse input → `requireRole` → verify the caller owns the resource → act. |
| I7 | **No user-facing string is hardcoded.** Use `next-intl` keys, and add the key to all five files in `messages/` in the same change. |
| I8 | **CSS logical properties only** (`ps-4`, `me-2`, `text-start`, `border-s`). The app renders RTL for Arabic. |
| I9 | **Never invent a Prisma model or field.** The schema in `prisma/schema.prisma` is complete. If something is missing, stop and say so. |
| I10 | **No PII in logs or Sentry.** Scrub phone, email, addresses, lesson notes. |
| I11 | **Balances are never stored.** Credit balance is `SUM(CreditTransaction.delta)`. Never write a cached integer. |
| I12 | **Server Components by default.** `"use client"` only for real interactivity, and never on a page that must be indexed. |

---

## 1. Users

**Student.** Arrives from Google, on a phone, in the evening. Switches language.
Sees prices. Filters instructors **by language first**, then location. Picks a
slot. Registers with a phone number. Pays with Swish or Klarna. Gets an SMS in
their language. Returns to see saldo, next lesson, theory progress. Never has
to phone anyone or read Swedish bureaucratic prose.

**Instructor.** Six lessons today, hands full. Opens the phone: today's list
with each student's name, tappable phone, tappable pickup address, one line of
last lesson's note. Logs a lesson report in one tap. Blocks tomorrow morning
when sick, and affected students are notified automatically. If anything takes
more than three taps, they go back to paper and the data rots.

**Admin.** Week calendar across all instructors, click a booking to move,
cancel or reassign. Find a student, see balance and payments, adjust with a
written reason. Add an instructor with languages and hours. That is the whole
day-one admin panel.

---

## 2. Stack

| Layer | Choice | Note |
|---|---|---|
| Framework | Next.js 14 App Router, TypeScript `strict` | |
| Styling | Tailwind + CSS variables from §8.1 | No raw hex in components |
| i18n | `next-intl` | UI strings in `messages/*.json`; content in `*Translation` tables |
| DB | Postgres 16 (Railway) | `btree_gist` extension required |
| ORM | Prisma | Plus one hand-written SQL migration (§6.2) |
| Auth | Auth.js v5 — email+password, Swedish SMS OTP, and Google. JWT session with `role` | Google accounts confirm a Swedish phone before they continue |
| Payments | Stripe Payment Element — card, Swish, Klarna | |
| Maps | `@vis.gl/react-google-maps`, lazy-loaded | |
| Storage | Cloudflare R2, signed uploads | |
| Email | Not sent. Booking notices go out by SMS and in-app | |
| SMS | 46elks | |
| Validation | Zod, one schema per endpoint, shared client/server |
| Dates | `date-fns` + `date-fns-tz` | |
| Test | Vitest + Playwright + Stripe CLI |
| Errors | Sentry |

Single-tenant. If it ever becomes multi-tenant, that means `schoolId` on every
table and it must happen before Phase 1 ships, not after.

---

## 3. Glossary — keep these Swedish in code

| Term | Meaning |
|---|---|
| `korlektion` | driving lesson, 50 min default |
| `riskettan` / `risktvaan` | mandatory Risk 1 (theory) and Risk 2 (skid pad) courses |
| `handledarutbildning` | supervisor course for private practice |
| `korkortstillstand` | learner's permit from Transportstyrelsen |
| `saldo` | remaining lesson credits |
| `utbildningskort` | education card — per-lesson instructor notes against the syllabus |
| `teoriprov` / `kunskapsprov` | the theory exam at Trafikverket |
| `uppkorning` | the practical driving test |
| `halkbana` / `skidbana` | skid pad where Risk 2 runs |

Identifiers, slugs and DB values use these. UI copy is translated via
`messages/`.

---

## 4. Data model

`prisma/schema.prisma` is complete and authoritative. Do not add models.

Shape in one paragraph: a `User` has a role and either a `StudentProfile` or a
`TeacherProfile`. `Product` is the whole catalogue — packages, single lessons,
course seats, theory access — with grant fields (`lessonCredits`,
`includesTheory`, `includesRisk1/2`). Buying creates an `Order` + `OrderItem` +
`Payment`; the Stripe webhook then writes `CreditTransaction` rows and/or a
`TheoryAccess` row (`expiresAt` null = lifetime theory access). A `Booking`
consumes one credit via another `CreditTransaction`. Instructor time comes from
recurring
`TeacherAvailability` minus `AvailabilityException` minus existing `Booking`.
Risk 1 and Risk 2 are **not** bookings — they are `CourseOccasion` rows with
seats, bought as `CourseBooking`.

Three things that look wrong but are deliberate:

- **No `lessonsRemaining` column.** See I11.
- **`Booking` has no `lessonType` enum.** Risk courses are `CourseOccasion`.
- **`OrderItem.unitPriceOre` and `productNameSnapshot` duplicate `Product`.**
  That is the point — a receipt must show what the customer actually saw, not
  today's price.

---

## 5. Business rules

Numbered so you can say "implement R7". Every rule here has a unit test.

### Money and catalogue
- **R1** All prices stored and computed in öre. Display via
  `formatPrice(ore, locale)` → `"18 450 kr"` (non-breaking space, kr after).
  Never `kr18,450.00`.
- **R2** Displayed prices include VAT. Checkout and receipt show the VAT amount
  separately, using `Product.vatRatePct`.
- **R3** `compareAtOre`, when set and higher than `priceOre`, renders as a
  struck-through original price.
- **R4** A `Product` is purchasable only when `active`. Deactivating never
  deletes; existing orders keep their snapshot.

### Credits
- **R5** Purchasing a product with `lessonCredits > 0` writes one
  `CreditTransaction { delta: +lessonCredits, reason: PURCHASE, expiresAt: now
  + creditValidDays }`.
- **R6** Balance = sum of `delta` over rows where `expiresAt` is null or in the
  future. Expired purchase lots are neutralised by an `EXPIRY` row written by
  cron, never by deletion.
- **R7** Booking a lesson writes `{ delta: -1, reason: BOOKING_CONSUMED,
  bookingId }` **inside the same transaction as the booking insert**. If the
  student has no credit, the booking is created as a hold (R12) instead.
- **R8** Every balance change has a `CreditTransaction` row. Admin adjustments
  require a non-empty `note` and write an `AuditLog` entry.

### Booking
- **R9** A slot is bookable only if it is inside a `TeacherAvailability` rule
  for that weekday, not inside a `FULL_DAY_OFF` or `PARTIAL_BLOCK` exception,
  not overlapping an existing `CONFIRMED`/`COMPLETED` booking **including
  `travelBufferMin` on both sides**, and starts at least
  `MIN_BOOKING_NOTICE_HOURS` (default 12) from `now`.
- **R10** Two instructor bookings may never overlap. Enforced by a database
  exclusion constraint (§6.2), not by application code. On violation the API
  returns `409 SLOT_TAKEN` with a refreshed slot list.
- **R11** The same applies keyed on `studentId` — a student cannot be in two
  lessons at once.
- **R12** A booking made without credits is inserted with `creditCharged =
  false` and `holdExpiresAt = now + 15 min`. Cron releases expired holds. The
  Stripe webhook converts a paid hold into a charged booking.
- **R13** `POST /api/bookings` requires an `Idempotency-Key` header. The same
  key returns the same booking, never a second one.

### Cancellation
- **R14** Student cancels **more than** `CANCELLATION_WINDOW_HOURS` (24) before
  `startsAt` → credit refunded (`CANCELLATION_REFUND`).
- **R15** Student cancels **within** the window → credit is kept by the school
  (`LATE_CANCELLATION_CHARGE`), and the UI says so explicitly before confirming.
- **R16** Instructor or admin cancels → credit always refunded, student notified
  by SMS immediately. Email is not sent.
- **R17** The cancellation deadline is always rendered as an absolute local
  time — `"Kan avbokas fram till tisdag 14 jan 09:00"` — never as "24 hours".
- **R18** An instructor cannot be deactivated while they have future bookings.
  Reassign or cancel first.

### Availability
- **R19** `TeacherAvailability.startTime`/`endTime` are local wall-clock strings
  (`"09:00"`). They are expanded in `Europe/Stockholm` and *then* converted to
  UTC. Never store an offset.
- **R20** DST: a 09:00–17:00 rule is 7 real hours on the March switch day and 9
  on the October one. Both have tests.

### Theory
- **R21** Paid question text, answers and explanations are never sent to the
  client without a valid `TheoryAccess` row. Server-side check on every fetch.
  Never hide paid content with CSS. Digital theory is a one-time purchase:
  `TheoryAccess.expiresAt` is nullable and `null` means lifetime access.
  A product grants theory when `includesTheory` is true. Lesson credits still
  expire after `creditValidDays` (default 365).
- **R22** Mock exam mirrors the real kunskapsprov exactly: 65 scored questions,
  50-minute timer, 52 correct to pass. Result shown as `54/65 · Godkänt`.

### Language
- **R23** Instructor search filters on language **before** location. Array
  overlap on `TeacherProfile.languages` (GIN index).
- **R24** Content translation fallback: requested locale → `sv` → first
  available. Never render an empty string; render Swedish with a small
  "endast på svenska" marker.
- **R25** `dir="rtl"` on `<html>` for `ar`. Directional icons mirror; photos,
  logos and the map do not. Numbers stay LTR.

---

## 6. Reference implementations

### 6.1 Slot engine — `src/lib/scheduling/slots.ts`

Pure, no I/O, no `new Date()`.

```ts
export type SlotInput = {
  now: Date;
  from: Date;                  // UTC range start
  to: Date;                    // UTC range end
  lessonMinutes: number;       // 50 | 100
  travelBufferMin: number;
  minNoticeHours: number;
  rules: { dayOfWeek: number; startTime: string; endTime: string;
           validFrom: Date | null; validUntil: Date | null }[];
  exceptions: { date: Date; type: "FULL_DAY_OFF" | "PARTIAL_BLOCK" | "EXTRA_HOURS";
                startTime: string | null; endTime: string | null }[];
  bookings: { startsAt: Date; endsAt: Date }[];
};

export type Slot = { startsAt: Date; endsAt: Date };

export function getAvailableSlots(input: SlotInput): Slot[];
```

Algorithm:
1. For each local calendar day in `[from, to]` (in `Europe/Stockholm`), collect
   matching `rules` by `dayOfWeek` and validity window.
2. Apply exceptions: `FULL_DAY_OFF` removes the day; `PARTIAL_BLOCK` subtracts
   an interval; `EXTRA_HOURS` adds one.
3. Convert each resulting local interval to UTC via `zonedTimeToUtc`.
4. Subtract every booking expanded by `travelBufferMin` on both sides.
5. Step through what remains in `lessonMinutes` increments from each interval's
   start; keep whole slots only.
6. Drop slots where `startsAt < now + minNoticeHours`.

Required tests (table-driven):
`empty rules → []` · `one rule, no bookings → n slots` ·
`booking in the middle splits the day` · `buffer blocks the adjacent slot` ·
`FULL_DAY_OFF removes everything` · `PARTIAL_BLOCK splits` ·
`EXTRA_HOURS adds outside the rule` · `minNotice drops today's early slots` ·
`March DST switch day yields 7 hours` · `October DST switch day yields 9` ·
`100-minute lessons never straddle the end of a rule`.

### 6.2 No double-booking

Application checks lose the race. Ship the hand-written migration in
`prisma/migrations/00000000000000_booking_exclusion/migration.sql`. Catch
Postgres SQLSTATE `23P01`:

```ts
try { /* insert */ }
catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.meta?.code === "23P01")
    return conflict("SLOT_TAKEN");
  throw e;
}
```

Booking creation is one transaction: read balance → insert `Booking` → insert
`CreditTransaction` → commit.

### 6.3 Stripe webhook — `src/app/api/webhooks/stripe/route.ts`

```ts
export const runtime = "nodejs";           // not edge — needs the raw body

const raw = await req.text();              // NEVER req.json() first
const event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET);

// idempotency: insert first, bail on duplicate
try { await db.stripeEvent.create({ data: { id: event.id, type: event.type } }); }
catch { return new Response(null, { status: 200 }); }
```

Handle: `checkout.session.completed` → mark `Order` PAID, write credits
(R5) and/or `TheoryAccess`, convert any held booking (R12), send receipt.
`payment_intent.payment_failed` → leave PENDING. No email is sent.
`charge.refunded` → update `Payment.refundedOre`, write a compensating
`CreditTransaction`.

Checkout line items are built from `Product` rows by id (I2).

### 6.4 i18n

Two separate systems, never mixed:
- **UI strings** → `messages/{sv,en,ti,ar,so}.json`, keyed by feature:
  `booking.step.when.title`, `errors.SLOT_TAKEN`, `pricing.perLesson`.
- **Content** → `*Translation` tables, edited by the client.

Fonts: Tigrinya is Ge'ez script and most Windows/Android devices have no
default font — self-host **Noto Sans Ethiopic**. Arabic needs **Noto Sans
Arabic**. Subset per locale so Swedish visitors don't download Ethiopic glyphs.

### 6.5 Instructor query (R23)

```sql
SELECT t.* FROM "TeacherProfile" t
WHERE t.active
  AND ($1::text[] IS NULL OR t.languages && $1)     -- language first
  AND ($2::text IS NULL OR EXISTS (
        SELECT 1 FROM "TeacherLocation" tl
        WHERE tl."teacherId" = t.id AND tl."locationId" = $2))
  AND ($3::"Transmission" IS NULL OR $3 = ANY(t.transmissions))
ORDER BY cardinality(t.languages & $1) DESC, t."ratingAvg" DESC;
```

GIN index on `languages` is in the schema.

---

## 7. API contracts

Every response error: `{ error: { code, message, fields? } }` where `code` is a
stable key translated client-side (`SLOT_TAKEN`, `NO_CREDITS`,
`OUTSIDE_CANCELLATION_WINDOW`, `PRODUCT_INACTIVE`, `RATE_LIMITED`).

```
POST   /api/auth/[...nextauth]
POST   /api/auth/otp/request      { phone }                       → 204   rate-limited 3/h/phone
POST   /api/auth/otp/verify       { phone, code }                 → session
GET    /api/locations                                             → Location[]
GET    /api/teachers              ?languages=sv,ti&locationId=&transmission=
                                                                  → TeacherCard[]
GET    /api/teachers/[slug]                                       → TeacherDetail
GET    /api/availability          ?teacherId&from&to&lessonMinutes → Slot[]
POST   /api/bookings              { teacherId, startsAt, lessonMinutes,
                                    locationId? , pickupAddress?, studentNote? }
                                    header: Idempotency-Key       → Booking | 409 SLOT_TAKEN
PATCH  /api/bookings/[id]         { action: "cancel" | "reschedule", startsAt? }
GET    /api/me/credits                                            → { balance, lots[] }
GET    /api/products                                              → Product[] (locale-resolved)
POST   /api/checkout              { productId, quantity, bookingId? } → { url }
POST   /api/webhooks/stripe       raw body, signed, idempotent
GET    /api/courses/occasions     ?kind=RISK1&language=ti          → Occasion[] with seatsLeft
POST   /api/courses/bookings      { occasionId }
GET    /api/theory/questions      ?category=&mode=study|exam       → gated by R21
POST   /api/theory/attempts       { questionId, answerId, sessionId? }
POST   /api/theory/exam           → session;  PATCH /api/theory/exam/[id] → result
POST   /api/reviews               { bookingId, rating, comment? }
GET    /api/me/export             → GDPR JSON
DELETE /api/me                    → soft delete + anonymise
GET    /api/health
/api/admin/*                      same shapes, ADMIN only, plus writes + AuditLog
```

Routes (Swedish slugs for the `sv` locale):

```
/[locale]/                        Hem
/[locale]/korlektioner            Lessons + pricing
/[locale]/paket/[slug]            Package detail
/[locale]/larare                  Map + list
/[locale]/larare/[slug]           Instructor profile (indexable)
/[locale]/boka                    Booking flow, 4 steps
/[locale]/kurser                  Riskettan / Risktvåan occasions
/[locale]/teori                   Theory landing + free questions
/[locale]/teori/[kategori]        Quiz
/[locale]/teori/prov              Mock exam
/[locale]/trafikskola/[stad]      Local SEO landing page
/[locale]/logga-in · /skapa-konto
/[locale]/mina-sidor              Student dashboard
/[locale]/mina-sidor/{bokningar,saldo,teori,profil}
/[locale]/larare-portal           Instructor dashboard
/[locale]/admin/*                 Admin
/[locale]/{villkor,integritet,cookies}
```

---

## 8. UI system

### 8.1 Tokens

Put these in `src/app/globals.css` and reference them from `tailwind.config.ts`.
No component ever contains a hex value.

```css
:root {
  --surface:        #0D0D0F;   /* dark nav, hero, footer */
  --surface-raised: #17171A;
  --page:           #F5F5F7;   /* logged-in background */
  --card:           #FFFFFF;
  --border:         #E5E5EA;

  --ink:            #0D0D0F;
  --ink-inverse:    #FFFFFF;
  --ink-muted:      #6B6B73;

  --accent:         #F5B429;   /* gold */
  --accent-hover:   #E0A21C;
  --accent-ink:     #0D0D0F;   /* text ON gold — always near-black */

  --success:        #1FA971;
  --danger:         #DC2626;

  --radius-sm: 12px;  --radius-md: 16px;  --radius-lg: 20px;
}
```

Tier accents are **data on `Product`**, not CSS classes: bas `#8A8A93`,
silver `#2563EB`, guld `#F5B429`, premium `#7C3AED`.

Rules: gold is for surfaces, borders and primary buttons — never small text on
white (contrast fails). Spacing is a 4px scale. Minimum touch target 44px,
which the slot grid will violate unless you watch it. Every input has a real
`<label>`.

### 8.2 Components to build first

`Button` (primary gold / secondary ghost-on-dark / tertiary) · `Input` with
label + error · `Select` · `PillFilter` (used for the language chips) ·
`Card` · `ProductCard` · `TeacherCard` · `SlotChip` · `BottomSheet` ·
`Stepper` · `BottomTabBar` · `LanguageSwitcher` · `EmptyState`.

### 8.3 Shell

Under `md`: bottom tab bar — Hem, Paket, Mina bokningar, Meddelanden, Profil —
plus a sticky dark header with a call button and gold "Boka nu".
Above `md`: top navigation. Same routes, same components.

Add manifest, icons, offline fallback and a service worker so it installs as a
PWA. That is what makes a later native wrapper a wrapper rather than a rewrite.

### 8.4 Booking flow screens

One step per screen on mobile, progress bar on top, never a long-scroll form.

1. **Vad** — enstaka lektion / använd mitt paket / testlektion
2. **Var** — two large cards: "Jag kommer till er" (location picker) or
   "Hämta mig" (Google Places autocomplete, restricted to SE)
3. **Vem** — instructor list, **language filter first**, map/list toggle
4. **När** — 14-day date strip + slot grid, "Första lediga tid" pinned on top

Then inline account creation: full name, email, phone (+46 only), password,
and an SMS code. There is no separate signup wall. Login is an SMS code, email
or phone plus password, or Google. Google users verify their phone once by SMS.
Then credits or checkout → confirmation showing the absolute cancellation
deadline (R17), plus an SMS. Email is not sent.

### 8.5 Performance

Budget: LCP under 2.0 s on 4G mobile, homepage JS under 180 kB gzipped.

Google Maps JS is the main threat and it is metered against the client's card.
Render a **static map image** on the homepage; load the interactive map only on
`/larare` or on tap. Restrict the API key by HTTP referrer. Geocode an address
once and store `lat`/`lng` — never geocode during render. Keep the map behind a
thin interface so MapLibre is a one-day swap if billing bites.

---

## 9. Build order

Nine tasks. Do not start one until the previous acceptance criteria pass. Each
task lists the files it may touch — reject diffs that touch anything else.

### Task 1 — Foundation
**Files:** `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts`,
`src/lib/db.ts`, `.env.example`
**Prompt:** *"Create the files in BUILD_SPEC §12 exactly as written, then set
up Prisma against Railway Postgres. Run the initial migration, then apply
the hand-written booking_exclusion migration. Wire prisma/seed.ts. Do not
modify the schema."*
**Done when:** `npx prisma migrate dev` succeeds, `npx prisma db seed` inserts
the §A2 catalogue, and `\d "Booking"` shows the `booking_no_overlap` constraint.

### Task 2 — Auth
**Files:** `src/auth.ts`, `src/middleware.ts`, `src/app/api/auth/**`,
`src/lib/auth/guards.ts`, `src/app/[locale]/(auth)/**`
**Prompt:** *"Implement Auth.js v5 with email+password, Swedish phone SMS OTP, and Google. Google sign-in links an existing account only when that account's email is already verified; otherwise the phone step links them. Session carries userId and role. Add requireRole(session, roles) in src/lib/auth/guards.ts and middleware gating /mina-sidor, /larare-portal and /admin. Rate-limit OTP to 3/hour/phone with a hard daily cap. SMS only to +46 numbers."*
**Done when:** you can register and log in as STUDENT, TEACHER and ADMIN; each
dashboard route rejects the wrong role; a fourth OTP request in an hour is
rejected.

### Task 3 — Slot engine
**Files:** `src/lib/scheduling/slots.ts`, `src/lib/scheduling/slots.test.ts`
**Prompt:** *"Implement getAvailableSlots from BUILD_SPEC §6.1 as a pure
function — no I/O, no new Date(). Then write the eleven table-driven Vitest
cases listed in §6.1, including both DST switch days."*
**Done when:** all eleven pass, and the file imports nothing but `date-fns`.

### Task 4 — Booking API
**Files:** `src/app/api/bookings/**`, `src/app/api/availability/**`,
`src/lib/credits/ledger.ts`, `src/lib/bookings/**`
**Prompt:** *"Implement GET /api/availability and POST /api/bookings per §7,
enforcing R7, R9–R13. One transaction: balance check, booking insert, credit
transaction. Catch SQLSTATE 23P01 and return 409 SLOT_TAKEN with refreshed
slots. Require an Idempotency-Key header."*
**Done when:** 20 parallel requests for one slot produce exactly one booking
and nineteen 409s; the same Idempotency-Key twice returns one booking.

### Task 5 — Cancellation + notifications
**Files:** `src/app/api/bookings/[id]/**`, `src/lib/notifications/**`
**Prompt:** *"Implement PATCH /api/bookings/[id] per R14–R18, and the
Notification queue. SMS via 46elks. The app does not send email. Templates in all five
locales: booking_confirmed, booking_cancelled_by_student,
booking_cancelled_by_teacher, booking_reminder_24h."*
**Done when:** cancelling 25 h out refunds a credit, 23 h out does not, and an
instructor cancellation sends an SMS.

### Task 6 — Catalogue + checkout
**Files:** `src/app/api/checkout/**`, `src/app/api/webhooks/stripe/**`,
`src/lib/stripe.ts`, `src/app/[locale]/paket/**`, `src/lib/pricing/format.ts`
**Prompt:** *"Implement POST /api/checkout building Stripe line items from
Product rows server-side (I2), and the webhook per §6.3 with StripeEvent
idempotency. Enable card, Swish and Klarna. formatPrice(ore, locale) renders
'18 450 kr' with a non-breaking space."*
**Done when:** replaying one webhook event twice grants credits once;
`formatPrice(1845000,'sv')` returns `18 450 kr`; a tampered client amount is
ignored.

### Task 7 — Public site
**Files:** `src/app/[locale]/(marketing)/**`, `src/components/**`,
`messages/*.json`
**Prompt:** *"Build the homepage, /korlektioner, /paket/[slug], /larare with
the instructor map and list, and /larare/[slug]. Use tokens from §8.1 only.
Language filter renders before location (R23). Map is lazy-loaded behind a
static image (§8.5). Add every string to all five message files."*
**Done when:** Lighthouse mobile performance ≥ 90 on the homepage; no hex
literal in any component; switching to `ar` flips `dir` with no overflow.

### Task 8 — Booking flow UI + dashboards
**Files:** `src/app/[locale]/boka/**`, `src/app/[locale]/mina-sidor/**`,
`src/app/[locale]/larare-portal/**`
**Prompt:** *"Build the four-step booking flow from §8.4 against the real APIs,
plus the student and instructor dashboards from §1. Cancellation deadlines
render as absolute local times (R17)."*
**Done when:** an end-to-end Playwright test books, pays with a Stripe test
card and cancels — in Swedish and again in Arabic.

### Task 9 — Admin + launch
**Files:** `src/app/[locale]/admin/**`, `src/app/api/admin/**`,
`src/app/[locale]/{villkor,integritet,cookies}/**`, `src/app/sitemap.ts`,
`src/app/robots.ts`, `next.config.js` (redirects)
**Prompt:** *"Build the three day-one admin screens from §1 with AuditLog on
every write. Then the compliance pages, per-locale metadata with hreflang,
schema.org DrivingSchool, sitemaps, and 301 redirects from the old WordPress
URLs."*
**Done when:** the launch checklist in §10 is fully ticked.

---

## 10. Launch checklist

- [ ] Real content everywhere — no placeholder instructors, prices or photos
- [ ] Canonical price list confirmed by the client and seeded (§11.1)
- [ ] Stripe live mode; Swish tested end-to-end **including a refund**
- [ ] 301 map from every indexed WordPress URL (`/product/*`, `/korlektion/`,
      `/th/home/`) — export the old sitemap before switching DNS
- [ ] Per-locale metadata, `hreflang` + `x-default`, sitemap per locale
- [ ] schema.org `DrivingSchool` with NAP, `Product`/`Offer` on packages
- [ ] Cookie banner, privacy policy, köpvillkor with 12-month credit validity
      and the 24 h rule, self-serve account deletion, GDPR export
- [ ] Ångerrätt (14-day distance-selling) checkbox and terms at checkout
- [ ] Nightly `pg_dump` to R2 **with a restore you have actually tested**
- [ ] Sentry live, `/api/health` monitored
- [ ] Cron running: release expired holds, expire credits, send 24 h reminders,
      recompute instructor ratings
- [ ] Full mobile QA in all five locales including RTL
- [ ] Google Maps key referrer-restricted; billing alerts on the client's account
- [ ] Every recurring service (Railway, Stripe, Google Cloud, 46elks, domain)
      on accounts owned and paid for by the client's company

---

## 11. Blocked on the client

Defaults are already applied in the seed and config, so nothing stops you
building today. These change data, not architecture.

1. **Canonical price list.** The mockup and the live site disagree: mockup BAS
   is 5 lessons + Risk 1 & 2 at 6 125 kr; live Körpaket B5 is 5 lessons, no
   risk courses, 3 634 kr. Silver/Guld/Platinum match. *Blocks Task 6 going
   live.* Default: seeded live prices, marked `PROVISIONAL`.
2. **Theory question bank** — the school's own bank of 585 questions, imported
   with `npm run theory:import`. The real bank file is not committed to the
   repository.
3. **Fifth language** — their own copy says the theory books exist in Swedish,
   Tigrinya, Arabic and **Amharic**, not Somali. *Blocks translation spend.*
   Default: Somali, matching the mockup.
4. **All locations** with addresses. The live site shows one (Upplands Väsby).
5. **Instructor list** — names, photos, languages, transmissions, hours,
   locations. *Blocks the map having anything real in it.*
6. **Risktvåan** — own halkbana or capacity bought from an external one? If
   bought, online sale means overselling risk.
7. **VAT rate** on lessons, packages and theory access, from their accountant.
8. **Cancellation and refund policy** in their own words, including package
   refunds. Default: 24 h, 12-month validity.
9. **Existing customers** — who currently holds theory access or unused
   credits, and how they migrate. Nobody may lose what they paid for.
10. **Old sitemap export**, before anything changes.

---

## 12. Source of truth

These files are the current copies. Do not paste them into this spec.

- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma/seed.ts`
- `.cursor/rules/00-project.mdc`
- `.cursor/rules/10-money-and-time.mdc`
- `.cursor/rules/20-security.mdc`
- `.cursor/rules/30-ui-and-i18n.mdc`
- `.cursor/rules/40-data-model.mdc`
- `messages/sv.json`, `messages/en.json`, `messages/ti.json`, `messages/ar.json`, `messages/so.json`

Theory questions are imported with `npm run theory:import`, not stored in this file.

Launch flags: `BOOKING_ENABLED=0` hides public booking. `INSTRUCTORS_ENABLED=0` hides public instructor pages. Login is email and password, Swedish SMS, and Google. The app does not send email.

---

## Appendix A1 — Environment

```
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
STRIPE_SECRET_KEY=            STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=   # referrer-restricted
GOOGLE_MAPS_SERVER_KEY=        # IP-restricted, geocoding only
RESEND_API_KEY=                # unused — the app does not send email
ELKS_API_USERNAME=            ELKS_API_PASSWORD=
R2_ACCOUNT_ID=  R2_ACCESS_KEY_ID=  R2_SECRET_ACCESS_KEY=  R2_BUCKET=  R2_PUBLIC_URL=
SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=
BOOKING_ENABLED=0             # 0 hides public booking
INSTRUCTORS_ENABLED=0         # 0 hides public instructor pages
CANCELLATION_WINDOW_HOURS=24
CREDIT_VALIDITY_DAYS=365
MIN_BOOKING_NOTICE_HOURS=12
BOOKING_HOLD_MINUTES=15
```

## Appendix A2 — Seeded catalogue (provisional, from the live site)

| slug | kind | credits | price | compareAt |
|---|---|---|---|---|
| `riskettan` | COURSE_SEAT | 0 | 49500 | 54500 |
| `testlektion` | TEST_LESSON | 1 | 49500 | — |
| `en-korlektion` | SINGLE_LESSON | 1 | 76100 | 89500 |
| `korpaket-b5` | PACKAGE | 5 | 363400 | 427400 |
| `korpaket-b10` | PACKAGE | 10 | 728900 | 857600 |
| `intensivpaket-silver` | PACKAGE | 10 | 1045000 | 1175000 |
| `intensivpaket-guld` | PACKAGE | 20 | 1845000 | 1989000 |
| `intensivpaket-platinum` | PACKAGE | 30 | 2545000 | 2790000 |
| `korkortsgaranti` | GUARANTEE | 35 | 2995000 | 3200000 |
| `korkortsteori` | THEORY_ACCESS | 0 | 9900 | 32000 |

⚠️ The live site lists `korpaket-b10` as "30 körlektion" — a data bug on their
side; seeded as 10. Do not sell any of these publicly until §11.1 is answered.

## Appendix A3 — Commands

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run theory:import
npm run test            # vitest
npm run test:e2e        # playwright
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
