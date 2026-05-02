# BARRY — Critical Review (May 2026)

This document captures the honest gaps, technical debt, and likely user
objections after Waves 14-19 of UX rework. It should be read by every
contributor before deploying to production.

## A. SECURITY ISSUES (BLOCKING for production)

### 1. Frontend mock auth uses base64 password storage

**Severity: CRITICAL**

`apps/web/src/stores/app-store.ts` `verifyPassword()` and `signup()` store
passwords as `btoa(password + ':barry-salt')` in `localStorage` under the
`barry-credentials` key. This is reversible by anyone with browser access.

**Why it exists:** Wave 16 needed a working login flow for demo purposes
without requiring backend connectivity.

**Fix:** Wire all auth through the NestJS backend `/api/v1/auth/login` and
`/api/v1/auth/signup` (already exist, use Argon2). Delete the local
`barry-credentials` path entirely. Until done, do not deploy.

### 2. WebSocket gateway accepts any connection in dev

`apps/api/src/modules/realtime/realtime.gateway.ts` does not verify JWT on
connect. Production must verify `client.handshake.auth.token`.

### 3. No rate limiting on /auth/login

NestJS `@nestjs/throttler` not installed. A determined attacker can credential-
stuff the login endpoint.

**Fix:** `npm i @nestjs/throttler` + register `ThrottlerModule.forRoot({ ttl: 60, limit: 10 })`.

### 4. No CSRF protection

NestJS app uses cookie-less JWT in Authorization header, so CSRF is mostly
moot, but if we add cookie-based session for OAuth flows, need `csurf` or
SameSite=Strict.

### 5. No HTTPS enforcement

`main.ts` doesn't force HTTPS. Production must redirect HTTP to HTTPS at the
load balancer level (nginx / ALB / CloudFront) AND set `helmet()` middleware
with `hsts: true`.

**Fix:** `npm i helmet` + `app.use(helmet({ hsts: { maxAge: 31536000 } }))`.

### 6. No DB backup script

PostgreSQL with 18 entities including financial data. Production needs daily
encrypted backups to S3/GCS.

**Fix:** cron job running `pg_dump | gpg | aws s3 cp` daily.

### 7. No request validation pipe globally

NestJS uses `class-validator` per-DTO but no `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`. Risk of mass-assignment.

## B. ARCHITECTURE / MAINTAINABILITY

### 1. apps/web/src/app/(app)/trips/[id]/page.tsx is 2,500+ lines

Twelve sub-components in a single file. Adding a feature requires CTRL-F.

**Fix:** extract into:
- components/trip/sections/participants-section.tsx
- components/trip/sections/date-poll-card.tsx
- components/trip/sections/map-embed.tsx
- components/trip/sections/venues-stay-section.tsx
- components/trip/sections/activities-cars-block.tsx
- components/trip/cards/trip-recap-card.tsx
- components/trip/cards/funds-card.tsx
- components/trip/cards/booking-card.tsx
- components/trip/cards/post-funding-tile.tsx
- components/trip/cards/pin-vote-card.tsx
- components/trip/cards/expenses-card.tsx

Target: top-level page drops from 2,500 to ~300 lines.

### 2. Zustand store is 1,400+ lines, monolithic

Every domain (auth, trips, votes, payments, chat, expenses, tasks, accommodations,
fundsRequests, reservations, equity zones, transport legs) lives in one store.

**Fix:** Use Zustand slices pattern. One slice per domain in
`stores/slices/auth-slice.ts`, etc. Combine via `combine()`.

### 3. No real i18n despite 20-language selector

req 7 expanded the language list to 20 entries, but selecting any language
does NOT translate the UI. The store value is persisted but ignored.

**Fix:** install `next-intl`, extract all user-visible strings into JSON
catalogs (`messages/en.json`, `messages/fr.json`...), wire `<NextIntlProvider>`.
Until done, soften the selector to "Coming soon: full translations" or
remove the non-EN/FR options.

### 4. Equity engine is a separate Python service

`services/equity-engine/` (FastAPI) does the minimax computation. Adds
operational complexity (deploy 2 services). Could be ported to TS/Node and
embedded in the API for simplicity.

**Trade-off:** Python is faster for numerical work. Keep as separate service
but containerize properly (Dockerfile already exists).

### 5. Mock data still mixed with real data flows

`MOCK_USERS`, `MOCK_TRIPS`, `MOCK_CHATS`, `DEMO_ACCOMMODATIONS` are imported
into the live store. On first load users see Chloé's fake trips.

**Fix:** Move all mock data behind a `NEXT_PUBLIC_DEMO_MODE=true` env flag.
Production builds should ship empty stores.

## C. UX GAPS (real grumpy-user concerns)

### 1. No "Skip the math, I know where" override

A loud organizer should be able to override the equity algorithm and pick
the location themselves. Currently locked into the vote-on-zone flow.

**Fix:** add "I'll pick the location" button on PinVoteCard for the organizer.

### 2. No budget conflict warning

Léa says max 80 EUR. Hotel is 120 EUR/person. App proceeds without warning her.

**Fix:** in PreFundRecapCard, compare each participant's `maxBudget` to their
share and show a "Budget alert" banner per participant.

### 3. No "nudge unread participants" CTA

Owner has no easy way to ping a friend who hasn't completed setup.

**Fix:** add "Nudge by WhatsApp" button per non-ready participant, pre-fills:
"Hey {name}, the gang is waiting on you for {trip}. Tap here: {invite}"

### 4. Mascot may feel infantile for B2B

Team offsites with corporate clients may find the playful mascot off-brand.

**Fix:** profile preference `mascotEnabled: boolean = true`. Hide mascot
everywhere if false. Worth doing for B2B traction.

### 5. No "Try without signing up" CTA on landing

Currently landing forces login or invite-link entry. Demo accounts work but
aren't promoted on the landing page.

**Fix:** "Try a sample trip" button → opens read-only Barcelona trip with
pre-populated participants/votes/expenses for visualization.

### 6. Trip page has 12+ sections, all rendered at once

Even with collapsibles, the cognitive load is high. Sections appear in
chrono order regardless of relevance.

**Fix:** auto-collapse "done" sections (Participants when all setup,
Pin vote when locked, etc). Show only the "current step" expanded by default.
Add a sticky "Next: Pick a date" CTA at the top.

### 7. No PWA install prompt for Firefox

Wave 19 added install prompt for Chrome/Edge (`beforeinstallprompt`) and
iOS Safari (manual A2HS). Firefox doesn't fire the event but supports
install via URL bar icon.

**Fix:** add Firefox-specific copy "Click the URL bar icon to install Barry"
when User-Agent includes "Firefox".

### 8. No offline-first PDF auto-export on booking

`trip-export.ts` has a PDF generator. On booking-complete it should fire
automatically and offer email + WhatsApp share.

**Fix:** call `downloadPdf(trip)` from `performBookings()` action on success.

### 9. No cookie consent banner

GDPR requires explicit consent for non-essential cookies. We have a
`/legal/data-rights` page (Wave 17) but no first-visit banner.

**Fix:** add `<CookieConsent>` with granular toggles (functional / analytics /
marketing). Block non-essential JS until consent given.

### 10. No accessibility audit beyond aria-label sweep

Wave 19 fixed 9 icon-only buttons missing aria-labels but a full audit (axe-core,
keyboard navigation, screen reader testing) hasn't been done.

**Fix:** run `@axe-core/cli` against all routes, fix violations.

## D. PRODUCT GAPS

### 1. No referral / viral loop

Barry needs network effects to grow. Currently no incentive for inviters.

**Fix:** "Invite 3 friends, get a free month of Pro" once Pro exists.

### 2. No analytics

No PostHog / Mixpanel / Plausible. We can't measure funnel drops.

**Fix:** Plausible is GDPR-friendly. Add `<Script>` tag with consent-gated
loading.

### 3. No emergency support / SLA

If Barry breaks the day of a wedding, what does the user do? Help button now
opens email + help center but no on-call coverage.

**Fix:** publish an SLA on /legal page. Set up @support@barry.app monitoring.

### 4. No multi-currency conversion

Trip with people in EUR, GBP, USD: prices shown as-is, no real-time conversion.

**Fix:** integrate https://api.frankfurter.app/latest (free, GDPR-friendly) for
EUR/USD/GBP/CHF conversion.

### 5. No trip archiving / export-and-delete

When a trip is "completed", it stays in the app forever. No way to archive
without deleting.

**Fix:** add "Archive" action distinct from "Delete". Archived trips hide
from main list but stay searchable.

## E. PERFORMANCE

### 1. No image optimization

Venue and accommodation images come from Unsplash. They're fetched at full
size, no `next/image` wrapping.

**Fix:** wrap all `<img>` with `next/image` for automatic resize, lazy-load,
WebP conversion.

### 2. No code splitting beyond Next.js defaults

The trip page imports everything. Lazy-load BarryMap and the heavy
ChatSidebar.

**Fix:** `dynamic()` import for BarryMap and TripChatSidebar with
`{ ssr: false }`.

### 3. localStorage state is monolithic

All persisted state lives under one `barry-app-state` key. Reading/writing
parses/serializes the full blob on every change.

**Fix:** Zustand persist supports per-slice keys via `partialize`. Already
partial but could split further.

### 4. Equity Engine is HTTP-fetched on every map calc

No caching. Same trip with same participants re-fetches zones from Python
service every visit.

**Fix:** cache zones by hash of participant origins+constraints in a Map.

## F. TESTING

### 1. ZERO TESTS

`apps/web` has Jest config but no test files. `apps/api` same.

**Fix (minimum bar):**
- E2E with Playwright for the critical paths: signup, create trip, join via
  invite, complete setup, vote, fund, book.
- Unit tests for equity engine math.
- API integration tests for /auth, /trips, /equity endpoints.

### 2. No CI/CD

Repo has no GitHub Actions workflow. Every commit goes straight to main.

**Fix:** `.github/workflows/ci.yml` running:
- typecheck (`tsc --noEmit`)
- lint (`eslint .`)
- web build
- api build
- Playwright e2e (gated to PRs to main)

### 3. No staging environment

Founder works directly on main branch with portable Postgres. No staging
env to validate releases before they hit users.

**Fix:** Vercel preview deployments per PR + a separate `staging.barry.app`
with anonymized prod data.

## G. LEGAL / OPS

### 1. No DPA (Data Processing Agreement) with Nominatim

Public Nominatim has usage policy: max 1 req/sec, attribution required, can be
blocked anytime.

**Fix:** for production, contract with Mapbox or Pelias self-hosted. Public
Nominatim only for development.

### 2. No DPA with Unsplash

Demo images come from Unsplash. Production needs proper licensing.

**Fix:** replace with own photos or licensed stock (Pexels with attribution).

### 3. No incident response plan

If user data leaks, we have no documented response plan / GDPR notification
template.

**Fix:** create `docs/INCIDENT_RESPONSE.md` with 72-hour CNIL notification
template.

### 4. No T&C reviewed by lawyer

`/legal/terms` is placeholder text. Real lawyer review required before launch.

## H. ACCEPTED-BUT-FRAGILE

These are areas that work today but will break under modest load:

- **In-memory mock chat** — every reload regenerates demo messages
- **Optimistic vote state** — votes applied locally before backend ack
- **No conflict resolution on concurrent edits** — last-write-wins on the
  same trip's participants/setup
- **Mock geolocation when device denies** — falls back to Paris (49.85, 2.34)
- **Hardcoded demo trip IDs** — `tr1`, `tr2`, `tr3` — would clash with real
  UUIDs in production

## I. REMAINING USER FEEDBACK ITEMS

From the master 36-item list (waves 14-19 cover all but these polish items):

- **req 19 polish:** more mascot interactions (only idle bob + wiggle-on-hover
  exist; req asked for "make it more fun with an animated mascott")
- **req 22 polish:** trip progress visual upgrade (Wave 16 already redid it
  with circular percent + active step; could add per-step animation when
  step completes)
- **req 29 partial:** map calculation visualization — no animated zones-being-
  computed feedback yet. Shows static result.
- **req 29 partial:** vote-on-legend — the picked-zone legend chip should be
  votable directly without a separate Pin Vote section. Currently still
  separate.

These are quality-of-experience polish, not blockers.

## SUMMARY: WHAT TO DO BEFORE PRODUCTION LAUNCH

**Tier 1 (BLOCKING):**
1. Wire frontend auth to real backend (kill base64 mock)
2. Add helmet + throttler + global ValidationPipe to API
3. Wire JWT verification to WebSocket gateway
4. Set up DB backups (cron + S3)
5. Enable HTTPS at load balancer + HSTS

**Tier 2 (1 week post-launch max):**
1. Real OAuth (Google + Apple) wired to backend
2. Real i18n (next-intl + EN/FR catalogs)
3. Refactor trip/[id]/page.tsx into 10-12 component files
4. Cookie consent banner
5. Proper Mapbox / Pelias contract
6. Real Stripe Connect for funds payments

**Tier 3 (within first month):**
1. Tests (Playwright e2e + unit)
2. CI/CD pipeline
3. Staging environment
4. Image optimization
5. Code splitting
6. Analytics (Plausible)
7. Trip archiving
8. Multi-currency
9. Referral program

**Tier 4 (nice-to-have):**
1. B2B mascot toggle
2. Skip-the-math override
3. Budget conflict warnings
4. Nudge-unread CTA
5. Try-sample-trip on landing
6. Auto-collapse done sections
7. Firefox PWA install copy
8. Auto-PDF on booking
9. Reduce-motion profile toggle
10. Mascot variations beyond happy/celebrating

This is real work. Months of it. Treat it as a roadmap, not a wish list.
