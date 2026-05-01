# Barry — Dev Queue

Living backlog of feature requests, technical debt, and improvement ideas.
Items at the top are higher priority. Items get checked off with the commit hash that landed them.

## In progress

### 1. Skeleton loaders during equity calculation — **DONE** (`5fbedea`)
- `Skeleton`, `SkeletonScrollCard`, `SkeletonScrollCardList`, `SkeletonBlock`, `SkeletonZones` components in `components/ui/skeleton.tsx`
- CSS shimmer (`barry-skeleton` class) in globals.css
- Wired into MapEmbed (zones loading) + ScrollCardList (loading prop) + PreFundRecapCard (when transport legs empty)
- Reduced-motion fallback skips the shimmer animation

### 2. Push notifications — **PARTIAL** (`pending wave 12 final`)
**Done client-side:**
- `lib/notifications/service.ts`: getPermission(), requestPermission(), showBrowserNotification() (only when tab hidden), event builders for poll_vote / new_task / funding_milestone / booking_confirmed / new_message
- `components/ui/toast.tsx`: `<ToastProvider>` context + `useToast()` hook + `<ToastViewport>` with dedup-by-tag, max-3 stack, auto-dismiss 5s, click-to-navigate, dark mode aware. Animation `barry-toast-pop`.
- Mounted ToastProvider in root layout.
- NotificationsRow component in profile with browser permission flow.
- Wired into FundsCard: milestone toasts at 25/50/100% + booking confirmed toast.

**Still TODO (next pass):**
- Wire toasts into voteDatePoll (poll_vote event) and addTask (new_task event)
- Real cross-device push (server-side Web Push subscription) needs backend with web-push lib
- Notification preferences granularity (per event type opt-in)

### 3. Duplicate Barry feature — **DONE** (`0c9c34d` + `a2ecd3d`)
- Store action duplicateTrip(sourceTripId, newName?)
- Available in two places: home page row kebab menu, and trip header more menu (now removed - duplicate is only on home)

### 4. Export trip recap to PDF / .ics — **DONE** (`pending wave 12 final`)
- ICS: hand-rolled RFC 5545 builder, multi-day uses DATE values with exclusive DTEND
- PDF: full Barry-branded HTML with blue/indigo gradient hero, mode pill, brand mark, hero stats row, deterministic-color avatar discs, mode-pill transport rows, emerald reservation cards with type icons, gradient total card with shadow, "Made with care by Barry" footer
- Both wired as visual inline buttons inside BookingCard (calendar + PDF tiles) once trip is booked. No more menu item — buttons appear in flow.

### 5. Dark mode toggle — **DONE** (`b64242d`)
- Tailwind darkMode:'class' enabled
- `theme: 'light' | 'dark' | 'auto'` in UserPreferences
- ThemeManager component reactively toggles `<html class="dark">` based on preference, with reactive prefers-color-scheme listener for 'auto'
- 3-button picker in profile (Light / Auto / Dark)
- Dark variants applied to home, profile, trip layout, login (170 lines via regex sweep)
- Trip overview surfaces (page.tsx) still partially light-only — to audit in cleanup wave

### 6. Accessibility audit — **DONE** (`5fbedea`)
- Global *:focus-visible rule with 2px barry-blue outline + offset
- Skip-to-content link on trip layout (Tab triggers visible link)
- prefers-reduced-motion media query kills shimmer + tamagotchi bounce + bubble pop + smooth-scroll
- ARIA live region on chat scroll (role='log' aria-live='polite' aria-relevant='additions')
- '.sr-only-barry' utility class
- More thorough audit (focus traps in modals, ARIA labels on every icon button, contrast pass) deferred to dedicated polish wave

### 7. Per-participant fund payment — **DONE** (`0c9c34d`)
- Inline FundsCard with per-participant rows + confirm modal + balance/card pay options
- Auto-trigger performBookings on 100%

### 8. Join page first popup — **DONE** (`0c9c34d`)
- Forced 'Who are you?' modal as first screen on /join/[token]
- Trip preview blurred behind for context

### 9. Hooks rule violation in FundsCard — **DONE** (`pending wave 12 final`)
- useEffect was after early return — moved all 3 hooks above the conditional return
- Added lastBookedRef guard to prevent re-trigger of performBookings

### 10. Date selection bug (only first option clickable) — **DONE** (`pending wave 12 final`)
- Was: sortedOptions sorted by score, so any vote re-shuffled the list
- Now: sorted by date ascending (stable) + separate topOptionId computed for the "Top" badge

### 11. Sticky TripProgress — **DONE** (`pending wave 12 final`)
- TripProgress wrapped in sticky top-14 z-20 with backdrop-blur fade on scroll

### 12. Phase-coded ChronoSection — **DONE** (`pending wave 12 final`)
- Removed the numeric markers (1-12) — now phase-coded:
  * 'before' (blue): setup, plan, tasks, map, picks, activities, recap, fund
  * 'during' (amber): booking + report, expenses
  * 'after' (slate): memories
- Each section gets a colored dot + ringed marker on the line, plus a phase-pill above the title

### 13. Fund Barry visible without venue/hotel — **DONE** (`pending wave 12 final`)
- Section 8 (Trip summary) and Section 9 (Fund Barry) now appear as soon as transportLegs[trip.id].length > 0
- Empty state explains "Hotels and venues add up automatically once picked"

### 14. Transport options on a single line — **DONE** (`pending wave 12 final`)
- setup-sheet.tsx grid-cols-5 -> grid-cols-6, smaller padding/icons
- All 6 modes (walk/bike/transit/car/train/flight) now fit on one row

### 15. Map edge arrows orientation + distance hover — **DONE** (`pending wave 12 final`)
- Arrow logic rewritten: outer wrapper rotated by atan2 angle, triangle pinned at outer edge inside the rotated frame, avatar counter-rotated so initial reads upright. Now points correctly in all 4 quadrants.
- Hover tooltip: great-circle distance from viewport center to participant, formatted '{firstName} · N km' with fade-in via group-hover

### 16. Cleaner trip header — **DONE** (`pending wave 12 final`)
- Removed the entire ⋯ menu from trip layout
- Duplicate is only on home (per-row kebab)
- Share link is in section 1 Participants (Copy invite button always visible)
- PDF + Calendar are inline visual buttons inside BookingCard once trip is booked

### 17. Branded PDF design — **DONE** (`pending wave 12 final`)
- Full Barry graphic DNA: blue/indigo gradient hero, brand mark, mode pill, hero stats row (crew/transport/bookings totals)
- Deterministic-color avatar discs match in-app palette
- Mode-pill transport rows
- Emerald reservation cards with type icons (venue/accommodation/transport)
- Gradient total card with shadow
- "Made with care by Barry · Where the smart group meets" footer
- Print-color-adjust:exact for proper color printing

## Pending — Technical debt

- The `MediaCard` component in trip page is now unused after MemoryGallery replaced it - delete on the next pass
- Persistence migration system: any future shape change needs a new `version` bump and a migrate block. Document this convention.
- Replace remaining initials in trip subroute pages (cagnotte, chat, constraints, itinerary, map, funds) with `<Avatar>` component - currently using legacy bubbles
- Trip overview page (trips/[id]/page.tsx) needs a full dark: variant pass — most of the 1900+ lines are still slate-50/white only
- Setup sheet, detail popup, activities-and-cars popups need dark variants
- Carto map tile layer should swap to `dark_all` when theme is dark
- More thorough a11y audit (focus traps in modals, ARIA labels on every icon button, contrast pass against WCAG AA)

## Done

- Wave 12 (final): hooks fix, single-line transport, date sort fix, sticky progress, phase chrono, fund without venue, branded PDF, fixed map arrows + distance, cleaner trip header - `pending`
- Wave 12 darkmode + a11y + toasts: dark mode toggle, focus-visible, reduced-motion, ARIA live, in-app toasts - `b64242d` + `5fbedea`
- Wave 11 row-actions: per-row kebab on home (Duplicate / Mark finished / Cancel) - `a2ecd3d`
- Wave 11-phase2: Join modal + fund per-participant + duplicate trip + skeleton + PDF/ICS + claude.md Section 15 - `0c9c34d`
- Wave 11-phase1: Universal Avatar + profile pic upload + design tokens - `1f20c93`
- Wave 10B: emoji purge + popup polish + chat scroll + KPI + filters + chrono line + activities + cars + todo + memory + tamagotchi - `c4b684e`
- Wave 10A: create-Barry crash fix + auth flow + setup polish + travel prefs - `2b4b25a`
- Wave 9D-9F: auth gating + solo edge zones + map viewport edge arrows - `b229963`
- Wave 9C: dynamic landing + cached engine health - `49d7b3e`
- Wave 9B: setup overhaul + 40+ EU cards + post-booking report - `47f7e60`
- Wave 9A: wanderlust/trip mode + visible mascot + recap - `cf3fa62`
