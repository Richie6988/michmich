# Barry — Dev Queue

Living backlog of feature requests, technical debt, and improvement ideas.
Items at the top are higher priority. Items get checked off with the commit hash that landed them.

## In progress / partially done

### 1. Skeleton loaders during equity calculation — **PARTIAL** (`pending wave 11 phase 2`)
**Done:** `Skeleton`, `SkeletonScrollCard`, `SkeletonScrollCardList`, `SkeletonBlock`, `SkeletonZones` components live in `components/ui/skeleton.tsx`. CSS shimmer (`barry-skeleton` class) added to globals.css. Wired into `MapEmbed` zones strip when calculating + zones empty.

**Still TODO:**
- Wire into `ScrollCardList` so venues/hotels/activities/cars show skeletons while loading
- Wire into reduction-card dropdown when fetching providers
- Wire into trip recap card while waiting for transport legs

### 2. Push notifications — NOT STARTED (large)
Web push API + service worker + opt-in flow + notification service. Notifies on:
- New vote on the date poll (to participants who haven't voted)
- New task assigned to me
- Digest of new tasks added to the trip
- Funding milestone reached (25%, 50%, 100%)
- Booking confirmed (per-participant report just landed)
- New chat message (rate-limited)

Self-host via `web-push` lib or use OneSignal. Behind a feature flag. Profile preferences toggle. Estimate: 2-3 days.

### 3. Duplicate Barry feature — **DONE** (`pending wave 11 phase 2`)
Implementation:
- Store action `duplicateTrip(sourceTripId, newName?)` clones a trip with fresh id, fresh dates/votes/funds/photos but keeps participants + their setup (origin, transport, cards, budget, etc.)
- UI: "Duplicate Barry" item in the trip header more menu (kebab icon)
- After creation, redirects to the new trip

### 4. Export trip recap to PDF / .ics — **DONE** (`pending wave 11 phase 2`)
Implementation in `lib/utils/trip-export.ts`:
- **ICS**: hand-rolled RFC 5545 builder with proper escaping. Multi-day trips use DATE values with exclusive DTEND. Single-day uses DATE for both. UID stable per trip. Downloads as blob.
- **PDF**: builds print-friendly HTML, opens in new tab, auto-triggers `window.print()` on load. User saves as PDF via browser. No jsPDF dep needed.
- Both wired into trip header more menu.

### 5. Dark mode toggle — NOT STARTED (audit-heavy)
- `theme: 'light' | 'dark' | 'auto'` in preferences, hooked to `<html class="dark">`
- Audit every gradient and slate color across the app for `dark:` variants
- Carto Voyager → `dark_all` map tile layer when dark
- Reduced-motion fallback for shimmer/bounce
- Estimate: 2-3 days of methodical pass.

### 6. Accessibility audit — NOT STARTED
- Keyboard nav: focus traps in popups, tab order in custom dropdowns
- Screen readers: ARIA labels on all icon-only buttons, ARIA live regions for chat/toasts
- Focus-visible: strong outline on tab focus
- Color contrast: audit slate-400/500 on white against WCAG AA
- `prefers-reduced-motion`: skip mascot bounce + shimmer
- Tools: Lighthouse + axe-core in CI. Manual VoiceOver/NVDA pass.
- Estimate: 2 days.

### 7. Per-participant fund payment — **DONE** (`pending wave 11 phase 2`)
Inline fund mechanics in `FundsCard`:
- Per-participant rows with avatar, amount, status (Paid / Pay button / Awaiting...)
- "Pay" opens confirm modal with two payment methods (in-app balance if sufficient, or card via Stripe)
- Calls `payFundsContribution(tripId, contributionId, useBalance)`
- Auto-triggers `performBookings` when 100% paid
- Progress bar in hero card

### 8. Join page first popup — **DONE** (`pending wave 11 phase 2`)
- Forced "Who are you?" modal as first thing on `/join/[token]`
- Trip preview blurred behind for context (`blur-sm pointer-events-none`)
- Modal has Barry mascot, hero text, name input, primary CTA "Join {trip.name}"
- Sign up upsell collapsed under a small link, expandable

## Pending — Technical debt

- The `MediaCard` component in trip page is now unused after MemoryGallery replaced it - delete on the next pass
- Persistence migration system: any future shape change needs a new `version` bump and a migrate block. Document this convention.
- `equityZones`, `pinVotes`, `accommodations` etc. in store should arguably move to a scoped per-trip slice (current Record<tripId, X> works but does extra work on every set)
- Duplicate seeding bug (acc1777542003383) was fixed by ID randomization, but the seeding itself (forEach in useEffect) still runs twice in strict mode. Idempotent enough now, but cleaner would be a useRef guard.
- Replace remaining initials in trip subroute pages (cagnotte, chat, constraints, itinerary, map, funds) with `<Avatar>` component - currently using legacy bubbles
- Dark mode and accessibility audits are sequential big tasks; bundle them into one "polish wave" (wave 13)

## Done

- Wave 11-phase1: Universal Avatar component + profile pic upload + design tokens - `1f20c93`
- Wave 10B: Emoji purge + popup polish + chat scroll + KPI + filters + chrono line + activities + cars + todo + memory + tamagotchi - `c4b684e`
- Wave 10A: Create Barry crash fix + auth flow restructure + setup polish + profile travel prefs - `2b4b25a`
- Wave 9F: Map viewport edge arrows for off-screen participants - `b229963`
- Wave 9E: Solo edge mode (max range, not barycentre) - `b229963`
- Wave 9D: Auth gating (login + signup + guest flow via /join) - `b229963`
- Wave 9C: Dynamic landing page + cached engine health check - `49d7b3e`
- Wave 9B: Setup overhaul (40+ EU loyalty cards, flight, email, self-book, units, no priority slider) + trip recap pre-fund + post-booking report - `47f7e60`
- Wave 9A: Wanderlust/trip mode toggle, mascot in header, chat=poll height, right-click block - `cf3fa62`
- Wave 8: Seamless create + inline date poll + chat scroll + address autocomplete + image cards + zone-aware map - `f560d9a`

