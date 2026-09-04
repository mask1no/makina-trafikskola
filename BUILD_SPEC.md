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

**Before going live**, two answers from the client are mandatory (§11): the
canonical price list, and whether they own the 1200 theory questions. Every
`Product` is seeded `active: false` for exactly that reason.

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
| Auth | Auth.js v5 — credentials + phone OTP, JWT session with `role` | |
| Payments | Stripe Payment Element — card, Swish, Klarna | |
| Maps | `@vis.gl/react-google-maps`, lazy-loaded | |
| Storage | Cloudflare R2, signed uploads | |
| Email | Resend + React Email | |
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
`theoryDays`, `includesRisk1/2`). Buying creates an `Order` + `OrderItem` +
`Payment`; the Stripe webhook then writes `CreditTransaction` rows and/or a
`TheoryAccess` row. A `Booking` consumes one credit via another
`CreditTransaction`. Instructor time comes from recurring
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
  by SMS **and** email immediately.
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
  Never hide paid content with CSS.
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
`payment_intent.payment_failed` → leave PENDING, email a resume link.
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

Then inline account creation (phone + OTP, three fields, no signup wall) →
credits or checkout → confirmation showing the absolute cancellation deadline
(R17), plus email, SMS and an `.ics` attachment.

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
**Prompt:** *"Implement Auth.js v5 with two providers: email+password
(credentials, bcrypt) and phone+SMS OTP via 46elks. Session carries userId and
role. Add requireRole(session, roles) in src/lib/auth/guards.ts and middleware
gating /mina-sidor, /larare-portal and /admin. Rate-limit OTP to 3/hour/phone
with a hard daily cap."*
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
**Files:** `src/app/api/bookings/[id]/**`, `src/lib/notifications/**`,
`src/emails/**`
**Prompt:** *"Implement PATCH /api/bookings/[id] per R14–R18, and the
Notification queue with Resend and 46elks senders. Templates in all five
locales: booking_confirmed, booking_cancelled_by_student,
booking_cancelled_by_teacher, booking_reminder_24h."*
**Done when:** cancelling 25 h out refunds a credit, 23 h out does not, and an
instructor cancellation sends both SMS and email.

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
- [ ] Cookie banner, privacy policy, köpvillkor with 24-month credit validity
      and the 24 h rule, self-serve account deletion, GDPR export
- [ ] Ångerrätt (14-day distance-selling) checkbox and terms at checkout
- [ ] Nightly `pg_dump` to R2 **with a restore you have actually tested**
- [ ] Sentry live, `/api/health` monitored
- [ ] Cron running: release expired holds, expire credits, send 24 h reminders,
      recompute instructor ratings
- [ ] Full mobile QA in all five locales including RTL
- [ ] Google Maps key referrer-restricted; billing alerts on the client's account
- [ ] Every recurring service (Railway, Stripe, Google Cloud, Resend, 46elks,
      domain) on accounts owned and paid for by the client's company

---

## 11. Blocked on the client

Defaults are already applied in the seed and config, so nothing stops you
building today. These change data, not architecture.

1. **Canonical price list.** The mockup and the live site disagree: mockup BAS
   is 5 lessons + Risk 1 & 2 at 6 125 kr; live Körpaket B5 is 5 lessons, no
   risk courses, 3 634 kr. Silver/Guld/Platinum match. *Blocks Task 6 going
   live.* Default: seeded live prices, marked `PROVISIONAL`.
2. **Theory question source and licensing** — do they own the 1200 questions or
   licence them from a supplier? The real Trafikverket exam is confidential by
   law, so every commercial bank is written in-house; reselling a licensed bank
   through a new platform may breach the licence. *Blocks the theory import.*
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
   refunds. Default: 24 h, 24-month validity.
9. **Existing customers** — who currently holds theory access or unused
   credits, and how they migrate. Nobody may lose what they paid for.
10. **Old sitemap export**, before anything changes.

---

## 12. Files to create verbatim

Copy each block into the path in its heading. Do not edit them while creating
them — if something needs to change, change it in a later task and note why.

### 12.1 `prisma/schema.prisma`

Complete and authoritative. Do not add models. If something you need is
missing, stop and say so.

```prisma
// Makina Trafikskola — complete schema. See BUILD_SPEC.md §4.
// Do not add models. If something is missing, stop and ask.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────────────────────────── identity ─────────────────────────────

enum Role { STUDENT TEACHER ADMIN }
enum Transmission { MANUAL AUTOMATIC }
enum KktStatus { UNKNOWN NOT_APPLIED APPLIED APPROVED }

model User {
  id                 String    @id @default(cuid())
  email              String?   @unique
  phone              String?   @unique          // E.164, +46...
  emailVerifiedAt    DateTime?
  phoneVerifiedAt    DateTime?
  passwordHash       String?                    // null when phone-OTP only
  role               Role      @default(STUDENT)
  localePref         String    @default("sv")
  firstName          String
  lastName           String
  identityVerifiedAt DateTime?                  // reserved for BankID
  deletedAt          DateTime?                  // soft delete + anonymise
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  studentProfile    StudentProfile?
  teacherProfile    TeacherProfile?
  orders            Order[]
  bookings          Booking[]               @relation("BookingStudent")
  cancelledBookings Booking[]               @relation("BookingCancelledBy")
  credits           CreditTransaction[]     @relation("CreditStudent")
  theoryAccess      TheoryAccess[]
  theoryAttempts    TheoryAttempt[]
  theoryExams       TheoryExamSession[]
  courseBookings    CourseBooking[]
  reviews           Review[]                @relation("ReviewStudent")
  notifications     Notification[]
  momentProgress    StudentMomentProgress[]

  @@index([role])
  @@index([deletedAt])
}

model StudentProfile {
  userId                String        @id
  user                  User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  korkortstillstand     KktStatus     @default(UNKNOWN)
  preferredLanguages    String[]      @default([])
  preferredTransmission Transmission?
  defaultPickupAddress  String?
  defaultPickupLat      Float?
  defaultPickupLng      Float?
  notes                 String?       // internal, staff-visible only
}

model TeacherProfile {
  id                String         @id @default(cuid())
  userId            String         @unique
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug              String         @unique
  photoUrl          String?
  languages         String[]       @default([])   // ["sv","ti","ar"] — GIN indexed
  transmissions     Transmission[] @default([])
  yearsExperience   Int            @default(0)
  active            Boolean        @default(true)
  ratingAvg         Float          @default(0)    // denormalised, recomputed by cron
  ratingCount       Int            @default(0)
  travelBufferMin   Int            @default(15)
  maxPickupRadiusKm Int            @default(15)

  translations    TeacherTranslation[]
  locations       TeacherLocation[]
  availability    TeacherAvailability[]
  exceptions      AvailabilityException[]
  bookings        Booking[]
  vehicles        Vehicle[]
  reviews         Review[]
  lessonReports   LessonReport[]
  courseOccasions CourseOccasion[]

  @@index([active])
  @@index([languages(ops: ArrayOps)], type: Gin)  // powers the language filter (R23)
}

model TeacherTranslation {
  id        String         @id @default(cuid())
  teacherId String
  teacher   TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  locale    String
  bio       String

  @@unique([teacherId, locale])
}

// ───────────────────────────── places ─────────────────────────────

model Location {
  id                 String  @id @default(cuid())
  slug               String  @unique
  name               String  // "Upplands Väsby – Huvudkontor"
  address            String
  city               String
  postalCode         String
  lat                Float
  lng                Float
  isPickupZoneCenter Boolean @default(true)
  active             Boolean @default(true)

  teachers     TeacherLocation[]
  bookings     Booking[]
  availability TeacherAvailability[]
}

model TeacherLocation {
  teacherId  String
  locationId String
  teacher    TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  location   Location       @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@id([teacherId, locationId])
}

model Vehicle {
  id           String          @id @default(cuid())
  model        String          // "Volvo XC40"
  registration String          @unique
  transmission Transmission
  photoUrl     String?
  active       Boolean         @default(true)
  teacherId    String?
  teacher      TeacherProfile? @relation(fields: [teacherId], references: [id])

  bookings Booking[]
}

// ───────────────────────────── catalogue ─────────────────────────────

enum ProductKind {
  PACKAGE
  SINGLE_LESSON
  TEST_LESSON
  COURSE_SEAT
  THEORY_ACCESS
  GUARANTEE
}

model Product {
  id              String      @id @default(cuid())
  slug            String      @unique
  kind            ProductKind
  active          Boolean     @default(false)  // nothing sells until confirmed
  sortOrder       Int         @default(0)

  priceOre        Int                          // 1845000 = 18 450 kr
  compareAtOre    Int?
  vatRatePct      Int         @default(25)     // confirm with the accountant
  currency        String      @default("SEK")

  lessonCredits   Int         @default(0)
  lessonMinutes   Int         @default(50)
  theoryDays      Int?
  includesRisk1   Boolean     @default(false)
  includesRisk2   Boolean     @default(false)
  creditValidDays Int         @default(730)

  badge           String?                      // "POPULARAST"
  accentHex       String?                      // tier colour — data, not CSS

  translations ProductTranslation[]
  orderItems   OrderItem[]
  courses      Course[]
}

model ProductTranslation {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  locale    String
  name      String
  shortDesc String?
  features  String[] @default([])

  @@unique([productId, locale])
}

// ───────────────────────────── orders & money ─────────────────────────────

enum OrderStatus { PENDING PAID FAILED REFUNDED PARTIALLY_REFUNDED }
enum PaymentProvider { STRIPE MANUAL }
enum PaymentStatus { PENDING SUCCEEDED FAILED REFUNDED }

model Order {
  id        String      @id @default(cuid())
  studentId String
  student   User        @relation(fields: [studentId], references: [id])
  status    OrderStatus @default(PENDING)
  totalOre  Int
  vatOre    Int
  createdAt DateTime    @default(now())
  paidAt    DateTime?

  items   OrderItem[]
  payment Payment?

  @@index([studentId, createdAt])
}

model OrderItem {
  id                  String  @id @default(cuid())
  orderId             String
  order               Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId           String
  product             Product @relation(fields: [productId], references: [id])
  quantity            Int     @default(1)
  unitPriceOre        Int     // snapshot at time of sale — never re-read from Product
  vatRatePct          Int
  productNameSnapshot String

  credits      CreditTransaction[]
  theoryAccess TheoryAccess[]
}

model Payment {
  id                      String          @id @default(cuid())
  orderId                 String          @unique
  order                   Order           @relation(fields: [orderId], references: [id])
  provider                PaymentProvider @default(STRIPE)
  method                  String?         // "card" | "swish" | "klarna"
  amountOre               Int
  refundedOre             Int             @default(0)
  stripePaymentIntentId   String?         @unique
  stripeCheckoutSessionId String?         @unique
  status                  PaymentStatus   @default(PENDING)
  createdAt               DateTime        @default(now())
}

model StripeEvent {
  id          String   @id            // Stripe's event id — webhook idempotency
  type        String
  processedAt DateTime @default(now())
}

enum CreditReason {
  PURCHASE
  BOOKING_CONSUMED
  CANCELLATION_REFUND
  LATE_CANCELLATION_CHARGE
  TEACHER_CANCELLATION_REFUND
  ADMIN_ADJUSTMENT
  EXPIRY
}

model CreditTransaction {
  id          String       @id @default(cuid())
  studentId   String
  student     User         @relation("CreditStudent", fields: [studentId], references: [id])
  delta       Int          // +10 purchase, -1 booking, +1 refund
  reason      CreditReason
  bookingId   String?
  booking     Booking?     @relation(fields: [bookingId], references: [id])
  orderItemId String?
  orderItem   OrderItem?   @relation(fields: [orderItemId], references: [id])
  expiresAt   DateTime?    // purchase lots expire; consumption never does
  note        String?      // required for ADMIN_ADJUSTMENT
  createdById String?      // admin who did it
  createdAt   DateTime     @default(now())

  @@index([studentId, createdAt])
  @@index([expiresAt])
}

model TheoryAccess {
  id                String     @id @default(cuid())
  studentId         String
  student           User       @relation(fields: [studentId], references: [id])
  grantedAt         DateTime   @default(now())
  expiresAt         DateTime
  sourceOrderItemId String?
  sourceOrderItem   OrderItem? @relation(fields: [sourceOrderItemId], references: [id])

  @@index([studentId, expiresAt])
}

// ───────────────────────────── scheduling ─────────────────────────────

enum ExceptionType { FULL_DAY_OFF PARTIAL_BLOCK EXTRA_HOURS }
enum BookingStatus { CONFIRMED COMPLETED CANCELLED_BY_STUDENT CANCELLED_BY_TEACHER NO_SHOW }

model TeacherAvailability {
  id         String         @id @default(cuid())
  teacherId  String
  teacher    TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  dayOfWeek  Int            // 0 = Sunday
  startTime  String         // "09:00" local Europe/Stockholm — never an offset
  endTime    String         // "17:00"
  locationId String?
  location   Location?      @relation(fields: [locationId], references: [id])
  validFrom  DateTime?
  validUntil DateTime?

  @@index([teacherId, dayOfWeek])
}

model AvailabilityException {
  id        String         @id @default(cuid())
  teacherId String
  teacher   TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  date      DateTime       @db.Date
  type      ExceptionType
  startTime String?        // for PARTIAL_BLOCK / EXTRA_HOURS
  endTime   String?
  reason    String?

  @@index([teacherId, date])
}

model Booking {
  id            String         @id @default(cuid())
  studentId     String
  student       User           @relation("BookingStudent", fields: [studentId], references: [id])
  teacherId     String
  teacher       TeacherProfile @relation(fields: [teacherId], references: [id])
  vehicleId     String?
  vehicle       Vehicle?       @relation(fields: [vehicleId], references: [id])
  locationId    String?        // null when this is a pickup booking
  location      Location?      @relation(fields: [locationId], references: [id])

  pickupAddress String?        // purge 90 days after completion
  pickupLat     Float?
  pickupLng     Float?

  startsAt      DateTime       // UTC
  endsAt        DateTime       // UTC
  status        BookingStatus  @default(CONFIRMED)
  creditCharged Boolean        @default(false)
  holdExpiresAt DateTime?      // set when booked without credits

  cancelledAt   DateTime?
  cancelledById String?
  cancelledBy   User?          @relation("BookingCancelledBy", fields: [cancelledById], references: [id])
  cancelReason  String?

  studentNote    String?
  idempotencyKey String?       @unique
  createdAt      DateTime      @default(now())

  credits      CreditTransaction[]
  lessonReport LessonReport?
  review       Review?

  @@index([teacherId, startsAt])
  @@index([studentId, startsAt])
  @@index([status, holdExpiresAt])
}

// ───────────────────────────── courses ─────────────────────────────

enum CourseKind { RISK1 RISK2 HANDLEDARUTBILDNING INTRO_THEORY }

model Course {
  id        String     @id @default(cuid())
  kind      CourseKind
  productId String
  product   Product    @relation(fields: [productId], references: [id])

  occasions CourseOccasion[]
}

model CourseOccasion {
  id           String          @id @default(cuid())
  courseId     String
  course       Course          @relation(fields: [courseId], references: [id])
  startsAt     DateTime
  endsAt       DateTime
  capacity     Int
  venueName    String          // often an external halkbana for RISK2
  venueAddress String
  language     String          @default("sv")
  teacherId    String?
  teacher      TeacherProfile? @relation(fields: [teacherId], references: [id])
  cancelled    Boolean         @default(false)

  bookings CourseBooking[]

  @@index([courseId, startsAt])
}

model CourseBooking {
  id         String         @id @default(cuid())
  occasionId String
  occasion   CourseOccasion @relation(fields: [occasionId], references: [id])
  studentId  String
  student    User           @relation(fields: [studentId], references: [id])
  status     BookingStatus  @default(CONFIRMED)
  createdAt  DateTime       @default(now())

  @@unique([occasionId, studentId])
}

// ───────────────────────── utbildningskort ─────────────────────────

model Moment {
  id    String @id            // "3.4"
  step  Int                   // 1–4
  code  String @unique
  order Int

  translations MomentTranslation[]
  progress     StudentMomentProgress[]
}

model MomentTranslation {
  id          String  @id @default(cuid())
  momentId    String
  moment      Moment  @relation(fields: [momentId], references: [id], onDelete: Cascade)
  locale      String
  title       String
  description String?

  @@unique([momentId, locale])
}

model LessonReport {
  id        String         @id @default(cuid())
  bookingId String         @unique
  booking   Booking        @relation(fields: [bookingId], references: [id])
  teacherId String
  teacher   TeacherProfile @relation(fields: [teacherId], references: [id])
  summary   String?
  nextFocus String?
  createdAt DateTime       @default(now())
}

model StudentMomentProgress {
  id          String   @id @default(cuid())
  studentId   String
  student     User     @relation(fields: [studentId], references: [id])
  momentId    String
  moment      Moment   @relation(fields: [momentId], references: [id])
  level       Int      // 1 introduced → 4 independent
  updatedAt   DateTime @updatedAt
  updatedById String

  @@unique([studentId, momentId])
}

// ───────────────────────────── theory ─────────────────────────────

model TheoryCategory {
  id    String @id @default(cuid())
  slug  String @unique      // "vagmarken", "miljo", "fordonskannedom"
  order Int

  translations TheoryCategoryTranslation[]
  questions    TheoryQuestion[]
}

model TheoryCategoryTranslation {
  id         String         @id @default(cuid())
  categoryId String
  category   TheoryCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  locale     String
  name       String

  @@unique([categoryId, locale])
}

model TheoryQuestion {
  id         String         @id @default(cuid())
  categoryId String
  category   TheoryCategory @relation(fields: [categoryId], references: [id])
  isFree     Boolean        @default(false)
  imageUrl   String?
  difficulty Int            @default(2)  // 1–3, drives exam composition
  active     Boolean        @default(true)
  version    Int            @default(1)
  createdAt  DateTime       @default(now())

  translations TheoryQuestionTranslation[]
  answers      TheoryAnswer[]
  attempts     TheoryAttempt[]

  @@index([categoryId, active])
}

model TheoryQuestionTranslation {
  id          String         @id @default(cuid())
  questionId  String
  question    TheoryQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  locale      String
  text        String
  explanation String?        // required in practice — every competitor has it
  audioUrl    String?        // the differentiator

  @@unique([questionId, locale])
}

model TheoryAnswer {
  id         String         @id @default(cuid())
  questionId String
  question   TheoryQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  isCorrect  Boolean
  order      Int

  translations TheoryAnswerTranslation[]
  attempts     TheoryAttempt[]
}

model TheoryAnswerTranslation {
  id       String       @id @default(cuid())
  answerId String
  answer   TheoryAnswer @relation(fields: [answerId], references: [id], onDelete: Cascade)
  locale   String
  text     String

  @@unique([answerId, locale])
}

model TheoryAttempt {
  id         String             @id @default(cuid())
  studentId  String
  student    User               @relation(fields: [studentId], references: [id])
  questionId String
  question   TheoryQuestion     @relation(fields: [questionId], references: [id])
  answerId   String
  answer     TheoryAnswer       @relation(fields: [answerId], references: [id])
  correct    Boolean
  sessionId  String?
  session    TheoryExamSession? @relation(fields: [sessionId], references: [id])
  answeredAt DateTime           @default(now())

  @@index([studentId, questionId])
}

model TheoryExamSession {
  id            String    @id @default(cuid())
  studentId     String
  student       User      @relation(fields: [studentId], references: [id])
  locale        String
  startedAt     DateTime  @default(now())
  finishedAt    DateTime?
  questionCount Int       @default(65)
  correctCount  Int       @default(0)
  passed        Boolean   @default(false)

  attempts TheoryAttempt[]
}

// ───────────────────── reviews, notifications, audit ─────────────────────

enum Channel { EMAIL SMS PUSH INAPP }

model Review {
  id        String         @id @default(cuid())
  bookingId String         @unique        // only students who actually had a lesson
  booking   Booking        @relation(fields: [bookingId], references: [id])
  studentId String
  student   User           @relation("ReviewStudent", fields: [studentId], references: [id])
  teacherId String
  teacher   TeacherProfile @relation(fields: [teacherId], references: [id])
  rating    Int            // 1–5
  comment   String?
  published Boolean        @default(false) // moderated before it goes public
  createdAt DateTime       @default(now())

  @@index([teacherId, published])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  channel   Channel
  template  String    // "booking_confirmed"
  payload   Json
  locale    String
  sendAfter DateTime
  sentAt    DateTime?
  error     String?

  @@index([sentAt, sendAfter])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  action     String   // "booking.cancel", "credit.adjust"
  entityType String
  entityId   String
  before     Json?
  after      Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
}
```

### 12.2 `prisma/migrations/00000000000000_booking_exclusion/migration.sql`

```sql
-- Prevents overlapping bookings at the database level. See BUILD_SPEC §6.2 / R10, R11.
-- Application-level checks lose the race; this cannot.
-- Run AFTER the initial Prisma migration — rename this folder to a later
-- timestamp than the init migration so it sorts second.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS period tstzrange
  GENERATED ALWAYS AS (tstzrange("startsAt", "endsAt", '[)')) STORED;

-- An instructor cannot be in two places at once.
ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap_teacher
  EXCLUDE USING gist ("teacherId" WITH =, period WITH &&)
  WHERE (status IN ('CONFIRMED', 'COMPLETED'));

-- Neither can a student.
ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap_student
  EXCLUDE USING gist ("studentId" WITH =, period WITH &&)
  WHERE (status IN ('CONFIRMED', 'COMPLETED'));

-- Violations surface as SQLSTATE 23P01 → the API returns 409 SLOT_TAKEN.
```

### 12.3 `prisma/seed.ts`

Also add to `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`

```ts
/**
 * Seed — Makina Trafikskola
 *
 * PROVISIONAL catalogue, scraped from the live WordPress site. Every product is
 * created with `active: false` on purpose: nothing goes on sale until the client
 * confirms the canonical price list (BUILD_SPEC §11.1). The mockup and the live
 * site disagree on the BAS tier and on whether Risk 1 & 2 are bundled.
 *
 * Money is öre (BUILD_SPEC I1): 1845000 = 18 450 kr.
 *
 *   npx prisma db seed
 */
import { PrismaClient, ProductKind, Transmission, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;

type Seed = {
  slug: string;
  kind: ProductKind;
  priceOre: number;
  compareAtOre?: number;
  lessonCredits?: number;
  lessonMinutes?: number;
  theoryDays?: number;
  includesRisk1?: boolean;
  includesRisk2?: boolean;
  badge?: string;
  accentHex?: string;
  sv: { name: string; shortDesc: string; features: string[] };
};

const PRODUCTS: Seed[] = [
  {
    slug: "en-korlektion",
    kind: ProductKind.SINGLE_LESSON,
    priceOre: 76100,
    compareAtOre: 89500,
    lessonCredits: 1,
    sv: {
      name: "En körlektion",
      shortDesc: "50 minuter, anpassad efter din nivå.",
      features: ["50 minuter", "Manuell eller automat", "Vi kan hämta dig"],
    },
  },
  {
    slug: "testlektion",
    kind: ProductKind.TEST_LESSON,
    priceOre: 49500,
    lessonCredits: 1,
    sv: {
      name: "Testlektion",
      shortDesc: "Bedömning av din körning och en tydlig plan framåt.",
      features: ["50 minuter", "Personlig utbildningsplan"],
    },
  },
  {
    slug: "korpaket-b5",
    kind: ProductKind.PACKAGE,
    priceOre: 363400,
    compareAtOre: 427400,
    lessonCredits: 5,
    accentHex: "#8A8A93",
    sv: {
      name: "Körpaket B5",
      shortDesc: "5 körlektioner för dig som vill komma igång.",
      features: ["5 körlektioner à 50 min", "Giltigt i 24 månader"],
    },
  },
  {
    slug: "korpaket-b10",
    kind: ProductKind.PACKAGE,
    priceOre: 728900,
    compareAtOre: 857600,
    lessonCredits: 10, // live site says "30 körlektion" — their data bug, see §11.1
    accentHex: "#8A8A93",
    sv: {
      name: "Körpaket B10",
      shortDesc: "10 körlektioner, en stark start mot körkortet.",
      features: ["10 körlektioner à 50 min", "Giltigt i 24 månader"],
    },
  },
  {
    slug: "intensivpaket-silver",
    kind: ProductKind.PACKAGE,
    priceOre: 1045000,
    compareAtOre: 1175000,
    lessonCredits: 10,
    theoryDays: 240,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#2563EB",
    sv: {
      name: "Intensivpaket Silver",
      shortDesc: "Snabbare väg till körkortet, med teori.",
      features: ["10 körlektioner", "Risk 1 & Risk 2", "Digital teori 8 mån"],
    },
  },
  {
    slug: "intensivpaket-guld",
    kind: ProductKind.PACKAGE,
    priceOre: 1845000,
    compareAtOre: 1989000,
    lessonCredits: 20,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    badge: "POPULARAST",
    accentHex: "#F5B429",
    sv: {
      name: "Intensivpaket Guld",
      shortDesc: "Komplett paket för dig som vill ta körkort effektivt.",
      features: ["20 körlektioner", "Risk 1 & Risk 2", "Digital teori 12 mån", "Prioriterad bokning"],
    },
  },
  {
    slug: "intensivpaket-platinum",
    kind: ProductKind.PACKAGE,
    priceOre: 2545000,
    compareAtOre: 2790000,
    lessonCredits: 30,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#7C3AED",
    sv: {
      name: "Intensivpaket Platinum",
      shortDesc: "Maximal förberedelse — vårt mest omfattande paket.",
      features: ["30 körlektioner", "Risk 1 & Risk 2", "Digital teori 12 mån", "VIP-support"],
    },
  },
  {
    slug: "korkortsgaranti",
    kind: ProductKind.GUARANTEE,
    priceOre: 2995000,
    compareAtOre: 3200000,
    lessonCredits: 35,
    theoryDays: 730,
    includesRisk1: true,
    includesRisk2: true,
    sv: {
      name: "Körkortsgaranti",
      shortDesc: "Kör tills du klarar uppkörningen. Fast pris.",
      features: ["30–35 körlektioner", "Personlig utbildningsplan", "Risk 1 & Risk 2"],
    },
  },
  {
    slug: "riskettan",
    kind: ProductKind.COURSE_SEAT,
    priceOre: 49500,
    compareAtOre: 54500,
    includesRisk1: true,
    sv: {
      name: "Riskettan",
      shortDesc: "Obligatorisk riskutbildning del 1.",
      features: ["Obligatorisk för B-körkort", "Flera språk"],
    },
  },
  {
    slug: "korkortsteori",
    kind: ProductKind.THEORY_ACCESS,
    priceOre: 9900,
    compareAtOre: 32000,
    theoryDays: 365,
    sv: {
      name: "Körkortsteori",
      shortDesc: "Över 1200 frågor med ljud och video.",
      features: ["1200+ frågor", "Ljud på ditt språk", "Övningsprov"],
    },
  },
];

async function main() {
  // ── locations ─────────────────────────────────────────────────────────
  // PLACEHOLDER: the live site shows one location. Get the real list (§11.4).
  const uv = await db.location.upsert({
    where: { slug: "upplands-vasby" },
    update: {},
    create: {
      slug: "upplands-vasby",
      name: "Upplands Väsby – Huvudkontor",
      address: "TODO – be kunden om exakt adress",
      city: "Upplands Väsby",
      postalCode: "194 00",
      lat: 59.5194,
      lng: 17.9294,
    },
  });

  // ── catalogue ─────────────────────────────────────────────────────────
  for (const [i, p] of PRODUCTS.entries()) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        kind: p.kind,
        active: false, // ← flip only after §11.1 is answered
        sortOrder: i * 10,
        priceOre: p.priceOre,
        compareAtOre: p.compareAtOre ?? null,
        lessonCredits: p.lessonCredits ?? 0,
        lessonMinutes: p.lessonMinutes ?? 50,
        theoryDays: p.theoryDays ?? null,
        includesRisk1: p.includesRisk1 ?? false,
        includesRisk2: p.includesRisk2 ?? false,
        badge: p.badge ?? null,
        accentHex: p.accentHex ?? null,
      },
    });

    // Swedish is authored; the other four are placeholders until translated.
    for (const locale of LOCALES) {
      await db.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: {},
        create: {
          productId: product.id,
          locale,
          name: p.sv.name,
          shortDesc: p.sv.shortDesc,
          features: p.sv.features,
        },
      });
    }
  }

  // ── accounts ──────────────────────────────────────────────────────────
  // Dev only. Never seed these into production.
  if (process.env.NODE_ENV !== "production") {
    const hash = await bcrypt.hash("Passw0rd!", 10);

    await db.user.upsert({
      where: { email: "admin@makina.local" },
      update: {},
      create: {
        email: "admin@makina.local",
        passwordHash: hash,
        role: Role.ADMIN,
        firstName: "Admin",
        lastName: "Makina",
      },
    });

    const teacherUser = await db.user.upsert({
      where: { email: "larare@makina.local" },
      update: {},
      create: {
        email: "larare@makina.local",
        passwordHash: hash,
        role: Role.TEACHER,
        firstName: "Sara",
        lastName: "Johansson",
        teacherProfile: {
          create: {
            slug: "sara-johansson",
            languages: ["sv", "en", "ti"],
            transmissions: [Transmission.MANUAL, Transmission.AUTOMATIC],
            yearsExperience: 5,
          },
        },
      },
      include: { teacherProfile: true },
    });

    if (teacherUser.teacherProfile) {
      await db.teacherLocation.upsert({
        where: {
          teacherId_locationId: {
            teacherId: teacherUser.teacherProfile.id,
            locationId: uv.id,
          },
        },
        update: {},
        create: { teacherId: teacherUser.teacherProfile.id, locationId: uv.id },
      });

      // Mon–Fri 09:00–17:00 local wall clock (R19)
      for (const dayOfWeek of [1, 2, 3, 4, 5]) {
        await db.teacherAvailability.create({
          data: {
            teacherId: teacherUser.teacherProfile.id,
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            locationId: uv.id,
          },
        });
      }
    }

    await db.user.upsert({
      where: { email: "elev@makina.local" },
      update: {},
      create: {
        email: "elev@makina.local",
        passwordHash: hash,
        role: Role.STUDENT,
        firstName: "Test",
        lastName: "Elev",
        localePref: "ti",
        studentProfile: { create: { preferredLanguages: ["ti", "sv"] } },
      },
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
```

### 12.4 `.cursor/rules/00-project.mdc`

```markdown
---
description: Makina Trafikskola — project context. Always applied.
alwaysApply: true
---

Next.js 14 App Router · TypeScript strict · Tailwind · Prisma/Postgres ·
next-intl · Auth.js v5 · Stripe · Railway.

Driving school in Stockholm. Students are largely newly arrived Swedes.
Locales: sv (default), en, ti (Tigrinya), ar (Arabic, RTL), so (Somali).

BEFORE proposing architecture, read /BUILD_SPEC.md. It is authoritative — if
your suggestion and the spec disagree, the spec wins. If the spec is silent,
say so and ask rather than inventing.

Domain vocabulary stays Swedish in identifiers, slugs and DB values:
korlektion, riskettan, risktvaan, handledarutbildning, korkortstillstand,
saldo, utbildningskort, teoriprov, uppkorning, halkbana.

Work one task at a time. Only touch the files the current task lists. Do not
refactor unrelated code, do not add dependencies without saying why, and do
not create README or docs files unless asked.
```

### 12.5 `.cursor/rules/10-money-and-time.mdc`

```markdown
---
description: Money, time and scheduling invariants.
alwaysApply: true
---

MONEY
- Integer öre everywhere. Never a float, never kronor as a number.
  1845000 === 18 450 kr.
- Prices are ALWAYS resolved server-side from the Product table. A request may
  send productId and quantity; if it sends an amount, ignore it.
- Display with formatPrice(ore, locale) → "18 450 kr" (non-breaking space, kr
  after the number). Never "kr18,450.00".
- Displayed prices include VAT; checkout and receipts show the VAT amount
  separately using Product.vatRatePct.

TIME
- All timestamps stored UTC. Business hours are Europe/Stockholm.
- TeacherAvailability.startTime/endTime are local wall-clock strings ("09:00").
  Expand in Europe/Stockholm, THEN convert to UTC. Never store an offset.
- Never call new Date() inside business logic — take `now: Date` as a
  parameter, so tests are deterministic.
- Deadlines shown to users are absolute local times
  ("Kan avbokas fram till tisdag 14 jan 09:00"), never "24 hours".

CREDITS
- Balances are never stored. Balance = SUM(CreditTransaction.delta) over
  non-expired lots. Never write a cached integer.
- Every balance change has a CreditTransaction row. Admin adjustments require
  a note and an AuditLog entry.
```

### 12.6 `.cursor/rules/20-security.mdc`

```markdown
---
description: Security rules for every API route.
alwaysApply: true
---

Every route handler does these four things, in this order:
1. Zod-parse the input (body, query, params).
2. requireRole(session, [...]) from src/lib/auth/guards.ts.
3. Verify the caller owns the resource — a STUDENT fetching /api/bookings/[id]
   must own that booking. This is the most common real hole in apps like this.
4. Act.

Also:
- Never trust a client-supplied price, credit count, role or userId.
- Stripe webhook: read the RAW body via await req.text() before verifying the
  signature. req.json() first breaks it. runtime = "nodejs", not edge.
- Webhooks are idempotent: insert StripeEvent(event.id) first; on duplicate,
  return 200 and stop.
- Rate-limit: login 5/15min per IP+identifier, OTP 3/hour per phone with a hard
  daily cap (SMS costs money and is an abuse target), booking creation, reviews.
- Never return password hashes, other users' phone numbers, pickup addresses of
  other students, or internal staff notes.
- No PII in logs or Sentry — scrub phone, email, addresses, lesson notes.
- Uploads: signed URLs, content-type allowlist, size cap, re-encode images.

Error shape, always: { error: { code, message, fields? } } where code is a
stable key the client translates: SLOT_TAKEN, NO_CREDITS,
OUTSIDE_CANCELLATION_WINDOW, PRODUCT_INACTIVE, RATE_LIMITED.
```

### 12.7 `.cursor/rules/30-ui-and-i18n.mdc`

```markdown
---
description: UI, design tokens, accessibility and i18n rules.
alwaysApply: true
---

TOKENS
- Use CSS variables from globals.css. No hex literal in any component.
  --surface #0D0D0F · --surface-raised #17171A · --page #F5F5F7 · --card #FFF
  --ink #0D0D0F · --ink-inverse #FFF · --ink-muted #6B6B73 · --border #E5E5EA
  --accent #F5B429 (gold) · --accent-ink #0D0D0F · --success #1FA971 · --danger #DC2626
  radii 12 / 16 / 20px, 4px spacing scale.
- Gold is for surfaces, borders and primary buttons. Never gold text on white.
- Product tier colours come from Product.accentHex — data, not CSS classes.

LAYOUT
- CSS logical properties only: ps-*, pe-*, ms-*, me-*, text-start, border-s.
  The app renders dir="rtl" for Arabic. Directional icons mirror; photos, the
  logo and the map do not. Numbers stay LTR.
- Minimum touch target 44px — the slot grid violates this by default.
- Every input has a real <label>. Error messages say what to do next.

REACT
- Server Components by default. "use client" only for genuine interactivity,
  and never on a page that must be indexed.
- No browser storage APIs.

I18N
- No hardcoded user-facing strings. Use next-intl keys and add every new key to
  ALL FIVE files in messages/ in the same change: sv, en, ti, ar, so.
- Key naming: feature.section.element — booking.step.when.title,
  errors.SLOT_TAKEN, pricing.perLesson.
- UI strings live in messages/*.json. CONTENT (product names, instructor bios,
  theory questions, emails) lives in *Translation tables — never in JSON.
- Content fallback: requested locale → sv → first available. Never render an
  empty string.
```

### 12.8 `.cursor/rules/40-data-model.mdc`

```markdown
---
description: Prisma schema rules.
globs: ["prisma/**", "src/lib/**", "src/app/api/**"]
---

prisma/schema.prisma is COMPLETE and authoritative. Do not add, rename or
remove models or fields. If something you need is missing, stop and say so.

Things that look like mistakes but are deliberate:
- There is no lessonsRemaining column. Balance is a SUM over
  CreditTransaction. See 10-money-and-time.mdc.
- Booking has no lessonType enum. Riskettan and Risktvåan are CourseOccasion
  rows with seats, not bookings.
- OrderItem.unitPriceOre and productNameSnapshot duplicate Product on purpose —
  a receipt must show what the customer actually saw, not today's price.
- Product.active defaults to false. Nothing is on sale until the client
  confirms the canonical price list.

Booking overlap is enforced by a database exclusion constraint in
prisma/migrations/*_booking_exclusion/migration.sql, not by application code.
Catch SQLSTATE 23P01 and return 409 SLOT_TAKEN. Never replace it with a
SELECT-then-INSERT check.

Booking creation is one transaction: read balance → insert Booking → insert
CreditTransaction → commit.
```

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
RESEND_API_KEY=
ELKS_API_USERNAME=            ELKS_API_PASSWORD=
R2_ACCOUNT_ID=  R2_ACCESS_KEY_ID=  R2_SECRET_ACCESS_KEY=  R2_BUCKET=  R2_PUBLIC_URL=
SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=
CANCELLATION_WINDOW_HOURS=24
CREDIT_VALIDITY_DAYS=730
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
npm run test            # vitest
npm run test:e2e        # playwright
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
