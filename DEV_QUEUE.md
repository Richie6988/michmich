# Barry — Dev Queue

Living backlog of feature requests, technical debt, and improvement ideas.
Items at the top are higher priority. Items get checked off with the commit hash that landed them.

## Pending — User-requested features

### 1. Skeleton loaders during equity calculation
While Barry is computing recommendations (zones, venues, accommodations, activities), show
shimmer/skeleton placeholders instead of just a spinner or empty state. This is meant for the
moments where the user knows something is happening but the screen looks empty:

- Map zones loading -> skeleton zone cards
- Activities/venues catalog -> skeleton scroll cards (with image placeholder + 2 lines)
- Trip recap loading -> skeleton bars
- Reduction-card dropdown loading -> skeleton list

Library option: build native CSS shimmer (no extra deps), using `bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer`.

### 2. Push notifications
Send notifications (web push API + service worker, plus native APNs/FCM on mobile when shipped):

- A new vote arrives on the date poll (only to participants who haven't voted yet)
- A new task is assigned to me
- A new task is added to the trip (digest, not per-task)
- Funding milestone reached: 25% / 50% / 100%
- Booking confirmed (per-participant report just landed)
- A new chat message (rate-limited)

Will need: subscription endpoint, opt-in flow in profile preferences, notification service
(self-hosted via web-push lib, or external like OneSignal). Probably ship behind a feature flag.

### 3. Duplicate Barry feature
For recurring trips with the same group ("we do this Friday dinner every month"):

- Action on a completed Barry: "Duplicate"
- Pre-fills: same name, same participants, same starting points, same transport modes,
  same reduction cards, but resets votes/dates/funding/photos/expenses
- Optional: "Repeat weekly/monthly" auto-create

Reuses the createGroupTrip action with extra options. Show in the home page list as "Duplicate" on completed trips, and in the trip detail header menu.

### 4. Export trip recap to PDF / calendar (.ics)
Two formats:

- PDF: full trip recap (dates, participants, transport legs, accommodations, total cost,
  reduction cards used, expense breakdown, settlements). Use jsPDF or pdf-lib client-side.
- ICS: calendar event(s). For wanderlust = single event. For trip = start + end dates,
  plus optional sub-events (boarding times, hotel check-in/out, restaurant reservation,
  activities). Use ical.js or hand-roll the format (it's simple).

Add "Export" menu in trip header with PDF / Add to calendar buttons.

### 5. Dark mode toggle
- Toggle in profile preferences and possibly OS-level auto-detect (`prefers-color-scheme`)
- Tailwind's `dark:` classes throughout (or new color tokens in a CSS variable system)
- Need to audit every gradient and color (the landing page especially has lots of slate-50/blue-50 backgrounds)
- Map tile layer may need a dark variant (Carto has `dark_all`, swap based on theme)

Recommended approach: create `theme: 'light' | 'dark' | 'auto'` in preferences, hook to a
`<html class="dark">` toggle, ship Tailwind dark variants in a follow-up wave (this is several
days of audit work).

### 6. Accessibility audit
- Keyboard nav: every interactive element should be reachable by tab; current pain points:
  custom dropdowns, popups (focus trap missing), card grids
- Screen readers: ARIA labels on all icon-only buttons (we have some but not consistent),
  ARIA live regions for the chat and toast notifications
- Focus visible state: bring back a strong outline (currently relying on browser defaults
  which vary)
- Color contrast: audit the slate-400 / slate-500 secondary text on white backgrounds
  against WCAG AA
- Reduced motion: respect `prefers-reduced-motion` for the mascot bounce / shimmer / page
  transitions

Tools: Lighthouse + axe-core in CI. Manual VoiceOver/NVDA pass before shipping.

## Pending — Technical debt

- The `MediaCard` component in trip page is now unused after MemoryGallery replaced it -
  delete on the next pass
- Persistence migration system: any future shape change needs a new `version` bump and a
  migrate block. Document this convention.
- `equityZones`, `pinVotes`, `accommodations` etc. in store should arguably move to a
  scoped per-trip slice (current Record<tripId, X> works but does extra work on every set)
- Duplicate seeding bug (acc1777542003383) was fixed by ID randomization, but the seeding
  itself (forEach in useEffect) still runs twice in strict mode. Idempotent enough now,
  but cleaner would be a useRef guard.

## Done

- Wave 9F: Map viewport edge arrows for off-screen participants - `b229963`
- Wave 9E: Solo edge mode (max range, not barycentre) - `b229963`
- Wave 9D: Auth gating (login + signup + guest flow via /join) - `b229963`
- Wave 9C: Dynamic landing page + cached engine health check - `49d7b3e`
- Wave 9B: Setup overhaul (40+ EU loyalty cards, flight, email, self-book, units, no priority slider) + trip recap pre-fund + post-booking report - `47f7e60`
- Wave 9A: Wanderlust/trip mode toggle, mascot in header, chat=poll height, right-click block - `cf3fa62`
- Wave 8: Seamless create + inline date poll + chat scroll + address autocomplete + image cards + zone-aware map - `f560d9a`
