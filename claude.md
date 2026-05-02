# BARRY — Project Brain File

> **"Barry knows where."** — The app that makes group meetups fair, fast, and frictionless.

## 1. IDENTITY

| Field | Value |
|---|---|
| **Commercial Name** | **Barry** (from *barycentre* — the weighted center of mass) |
| **Code Name** | PROJECT B / michmich (repo) |
| **Taglines** | "Where Barry is, your journey starts" · "Weekend at Barry's" · "Join Barry" · "Barry knows where." |
| **Mascot** | Barry — a living location pin, Equity Blue `#2563EB` body, Signal Coral `#F97316` hands. Fair, witty, nerdy about maps. |
| **Core Promise** | Equity in distance. Simplicity in decision. |
| **Domain** | Social-mobility intelligence platform — group equity meetup optimizer |

## 2. PROBLEM & SOLUTION

**Problem:** Organizing group meetups creates invisible emotional labor, geographic unfairness, and social friction. Someone always travels farther, pays more, or does all the planning.

**Solution:** Barry algorithmically finds the optimal, equitable meeting point for any group — based on each participant's location, budget, time constraints, and transport mode — then lets the group vote and book in one continuous flow.

**North Star Metric:** Group Decision Time ≤ 5 minutes (from trip creation to confirmed booking).

## 3. TARGET USERS (5 PERSONAS)

| Persona | Age | Archetype | Core Pain | Primary Use Case |
|---|---|---|---|---|
| **Chloé** | 28 | The Overwhelmed Organizer | 45+ min group chat debates | Urban dinners, after-work drinks |
| **Tom** | 22 | The Budget Warrior | Embarrassed to speak up about cost | Student meetups, budget nights |
| **Marc** | 30 | The Fairness Guardian | Manually calculates routes for everyone | EVG/EVJF planning |
| **Sarah** | 35 | The Spontaneous Weekender | 3+ weeks of back-and-forth planning | Regional weekends |
| **Isabelle** | 42 | The Family Coordinator | Multi-generational needs never align | Family day trips |

**Cross-persona insight:** Every persona shares the same burden — the invisible labor of group coordination. Barry eliminates it by making fairness automatic, visible, and effortless.

## 4. CORE USER FLOW (6 SCREENS)

```
1. HOME → 2. CREATE TRIP → 3. CONSTRAINTS → 4. EQUITY MAP → 5. GROUP VOTE → 6. ITINERARY
```

1. **Home** — Active trips list + "+ New Barry" CTA
2. **Create Trip** — Name, date, transport modes, invite via WhatsApp deep-link
3. **Constraints** — Sliders (max time, max budget, mode), weight toggle (time vs money)
4. **Equity Map** — Mapbox heatmap with green/yellow/red equity zones, 3 zone cards (e.g. Le Marais, Bastille, Odéon)
5. **Group Vote** — Tinder-style swipe cards for venues, real-time vote counter
6. **Itinerary** — Per-person route, booking buttons, split pay, calendar export, Barry success animation

## 5. FEATURE SET

### 5.1 Core Features (Phase 3A — Prototype)
- Group trip creation with multi-modal transport (walk, bike, transit, car, train)
- Individual constraint setting (time budget, money budget, transport mode, preference weights)
- **Equity Engine:** minimax burden optimization across all participants (real OSRM calculations)
- Real-time group voting on venues (WebSocket Tinder-style swipe cards)
- Equity heatmap visualization on Mapbox
- Barry mascot animation system (SVG/Lottie)
- i18n: French + English from day one
- Invite flow via shareable deep-links

### 5.2 Extended Features (Phase 3B — Production)
- In-app booking via affiliate APIs (TheFork, Booking.com, SNCF, GetYourGuide)
- Stealth mode for surprise events (EVG/EVJF)
- Family mode with accessibility filters
- Corporate mode with expense reporting
- Split payment via Stripe Connect
- OAuth2 authentication (Google, Apple, Facebook)
- Push notifications
- Offline mode
- Calendar integration (Google, Apple, Outlook)
- B.Pro subscription (€4.99/mo)

### 5.3 Special Modes
| Mode | Description |
|---|---|
| **Stealth Mode** | Hide destination from selected participants (EVG/EVJF) |
| **Family Mode** | Accessibility filters, split itineraries, multi-generational weights |
| **Corporate Mode** | Team-building focus, expense reporting, HR dashboard |
| **Solo-to-Group** | Join existing public trips (hiking groups, city tours) |

## 6. THE EQUITY ENGINE — ALGORITHM

### Mathematical Foundation

**Input:**
- Participants P = {p₁, p₂, …, pₙ}
- Per participant: origin (lat, lon), transport mode, time_weight ∈ [0,1], money_weight ∈ [0,1], max_time, max_money

**Output:**
- Top 3 equity zones Z₁, Z₂, Z₃ ranked by equity score
- Per-participant burden breakdown

**Burden Function:**
```
Burden(pᵢ, z) = (time_minutes × time_weightᵢ) + (cost_euros × money_weightᵢ)
```

**Algorithm:**
1. Generate candidate grid points within search radius (centroid of all origins ± radius)
2. For each candidate z, query OSRM for route from each participant to z
3. Calculate Burden(pᵢ, z) for each participant
4. Filter: discard z where any participant exceeds their max_time or max_money
5. Score: `equity_score(z) = 1 - (std_dev(burdens) / mean(burdens))`
6. Rank: `0.7 × equity_score + 0.3 × (1 / max_burden)`
7. Cluster top candidates into 3 zones, return with full breakdown

**Optimization target:** Minimax fairness — minimize the maximum individual burden.

### Equity Visualization
- **Green overlap** = High equity (similar burden for all)
- **Yellow overlap** = Acceptable (some variation)
- **Red zones** = Vetoed (exceeds someone's hard constraints)

Barry drops the pin in the deepest green zone with a celebratory animation.

## 7. TECHNICAL ARCHITECTURE

### 7.1 Stack

| Layer | Technology | Notes |
|---|---|---|
| **Mobile** | React Native (Expo SDK 52+) | iOS + Android |
| **Web** | Next.js 14 (App Router) | PWA, mobile-first responsive |
| **Shared Code** | Monorepo with shared types & components | Turborepo |
| **Styling** | Tailwind CSS (web) + NativeWind (mobile) | Consistent design tokens |
| **UI Components** | shadcn/ui (web) + custom RN components | |
| **State** | Zustand (client) + TanStack Query (server) | |
| **Maps** | Mapbox GL JS (web) + @rnmapbox/maps (mobile) | Heatmaps, routes, custom pins |
| **Animations** | Framer Motion (web) + Reanimated 3 (mobile) | Barry mascot, swipe cards |
| **i18n** | react-i18next + expo-localization | FR primary, EN secondary |
| **Backend API** | NestJS 10 (TypeScript) | REST + GraphQL (Apollo) |
| **Equity Engine** | FastAPI (Python 3.11) | NetworkX, GeoPandas, Shapely, SciPy |
| **Routing** | OSRM (self-hosted Docker) | walk, bike, car profiles |
| **Transit** | Navitia API | Public transport routing + costs |
| **Database** | PostgreSQL 15 + PostGIS 3.4 | Geospatial queries |
| **Cache** | Redis 7 | Sessions, route cache, pub/sub |
| **Queue** | BullMQ | Background jobs (equity calc) |
| **Real-Time** | Socket.io | WebSocket voting, live updates |
| **Search** | Elasticsearch 8 | Venue indexing |
| **Auth** | Passport.js + JWT | OAuth2 (Google, Apple, Facebook) |
| **Payments** | Stripe Connect | Split payments (Phase 3B) |
| **Infra** | Docker Compose (dev) → Kubernetes (prod) | |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy |
| **Monitoring** | Prometheus + Grafana | |

### 7.2 Monorepo Structure (Turborepo)

```
barry/
├── claude.md # This file — project brain
├── README.md
├── turbo.json
├── package.json # Root workspace
├── docker-compose.yml # Local dev: postgres, redis, osrm, elasticsearch
├── .github/workflows/
│ ├── ci.yml
│ └── cd.yml
├── apps/
│ ├── web/ # Next.js 14 PWA
│ │ ├── src/
│ │ │ ├── app/ # App Router pages
│ │ │ │ ├── (auth)/ # Login, register, OAuth callback
│ │ │ │ ├── (app)/ # Authenticated routes
│ │ │ │ │ ├── page.tsx # Home — active trips
│ │ │ │ │ ├── trips/
│ │ │ │ │ │ ├── new/ # Create trip
│ │ │ │ │ │ └── [id]/
│ │ │ │ │ │ ├── page.tsx # Trip dashboard
│ │ │ │ │ │ ├── constraints/ # Set constraints
│ │ │ │ │ │ ├── map/ # Equity map
│ │ │ │ │ │ ├── vote/ # Group vote
│ │ │ │ │ │ └── itinerary/ # Final itinerary
│ │ │ │ │ ├── profile/
│ │ │ │ │ └── settings/
│ │ │ ├── components/
│ │ │ │ ├── barry/ # Barry mascot SVG components
│ │ │ │ ├── map/ # Mapbox wrappers, heatmap, routes
│ │ │ │ ├── trip/ # Trip cards, participant rows
│ │ │ │ ├── vote/ # Swipe cards, vote counter
│ │ │ │ └── ui/ # shadcn/ui components
│ │ │ ├── hooks/
│ │ │ ├── stores/ # Zustand stores
│ │ │ ├── lib/
│ │ │ │ ├── api/ # API client (TanStack Query)
│ │ │ │ ├── socket.ts # Socket.io client
│ │ │ │ └── i18n/ # Translation files
│ │ │ └── styles/
│ │ ├── public/
│ │ ├── Dockerfile
│ │ └── package.json
│ ├── mobile/ # Expo (React Native)
│ │ ├── app/ # Expo Router file-based routing
│ │ ├── components/
│ │ ├── hooks/
│ │ ├── stores/
│ │ ├── lib/
│ │ ├── assets/
│ │ ├── app.json
│ │ └── package.json
│ └── api/ # NestJS backend
│ ├── src/
│ │ ├── auth/ # Auth module (OAuth2, JWT)
│ │ ├── users/ # User CRUD
│ │ ├── trips/ # Trip lifecycle
│ │ ├── participants/ # Constraints, status
│ │ ├── equity/ # Proxy to equity engine
│ │ ├── venues/ # Venue search
│ │ ├── votes/ # Voting engine
│ │ ├── bookings/ # Booking orchestration (3B)
│ │ ├── payments/ # Stripe integration (3B)
│ │ ├── notifications/ # Push + in-app
│ │ ├── gateway/ # WebSocket gateway (Socket.io)
│ │ ├── common/ # Guards, interceptors, pipes
│ │ └── config/
│ ├── test/
│ ├── Dockerfile
│ └── package.json
├── services/
│ └── equity-engine/ # FastAPI Python microservice
│ ├── app/
│ │ ├── main.py
│ │ ├── api/routes.py
│ │ ├── models/
│ │ │ ├── constraints.py
│ │ │ └── equity.py
│ │ ├── algorithms/
│ │ │ └── equity_optimizer.py # Core minimax algorithm
│ │ └── services/
│ │ ├── osrm_client.py # OSRM routing
│ │ ├── transit_client.py # Navitia wrapper
│ │ └── geocoder.py
│ ├── tests/
│ ├── requirements.txt
│ ├── Dockerfile
│ └── proto/equity.proto # gRPC definition
├── packages/
│ ├── shared-types/ # TypeScript interfaces (Trip, User, Venue, etc.)
│ ├── ui/ # Shared UI primitives
│ ├── i18n/ # Shared translation keys & files
│ └── eslint-config/
├── infra/
│ ├── k8s/ # Kubernetes manifests (prod)
│ ├── docker/ # Dockerfiles, nginx configs
│ └── monitoring/ # Prometheus + Grafana
├── scripts/
│ ├── seed.ts # Test data: 5 users, 3 trips, 10 venues (Paris)
│ └── migrate.sh
├── docs/
│ ├── architecture.md
│ ├── api.md
│ ├── equity-engine.md
│ └── onboarding.md
└── insights/ # Design & strategy docs (existing)
 ├── concept
 ├── PROJECT_B_Machine_Build_Prompt.md
 ├── 02_Persona_Cards.png
 ├── 03_Journey_Maps.png
 ├── 04_App_Wireframes.png
 └── 05_Architecture_BMC.png
```

### 7.3 Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `users` | Profiles, home_location (PostGIS POINT), default preferences |
| `trips` | Trip metadata, status machine, equity_zone, stealth config |
| `trip_participants` | Per-user constraints, burden_score, route, vote |
| `venues` | Location (PostGIS POINT), category, price_level, rating |
| `equity_zones` | Calculated zones with geometry, scores, rankings |
| `bookings` | External booking references (Phase 3B) |
| `payments` | Stripe payment intents, splits (Phase 3B) |
| `notifications` | In-app notification queue |
| `subscriptions` | B.Pro subscription status (Phase 3B) |

**Trip Status Machine:**
```
draft → inviting → constraints → calculating → voting → booked → completed
 ↘ cancelled
```

### 7.4 API Endpoints (Core)

**Auth:** POST `/auth/register`, `/auth/login`, `/auth/oauth/:provider`, `/auth/refresh`
**Users:** GET `/users/me`, PATCH `/users/me`
**Trips:** POST `/trips`, GET `/trips/:id`, PATCH `/trips/:id`, POST `/trips/:id/invite`, POST `/trips/:id/join`
**Constraints:** POST `/trips/:id/constraints`
**Equity:** POST `/trips/:id/calculate`, GET `/trips/:id/zones`
**Voting:** POST `/trips/:id/vote`, GET `/trips/:id/results`
**Venues:** GET `/venues/search`

### 7.5 WebSocket Events

| Direction | Event | Payload |
|---|---|---|
| Server → Client | `trip:updated` | `{ tripId, field, value }` |
| Server → Client | `participant:joined` | `{ tripId, participant }` |
| Server → Client | `constraints:updated` | `{ tripId, userId }` |
| Server → Client | `calculation:complete` | `{ tripId, zones[] }` |
| Server → Client | `vote:cast` | `{ tripId, userId, venueId }` |
| Server → Client | `vote:complete` | `{ tripId, winner }` |
| Client → Server | `trip:join` | `{ tripId }` |
| Client → Server | `vote:submit` | `{ tripId, venueId }` |

## 8. DESIGN SYSTEM

### 8.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--barry-blue` | `#2563EB` | Primary — trust, equity, brand |
| `--barry-coral` | `#F97316` | Accent — CTAs, Barry's hands, action |
| `--barry-green` | `#10B981` | Success — equity zones, confirmations |
| `--barry-grey` | `#64748B` | Secondary text, UI chrome |
| `--barry-canvas` | `#FAFAFA` | Background |
| `--barry-red` | `#EF4444` | Vetoed zones, errors |
| `--barry-yellow` | `#F59E0B` | Acceptable equity, warnings |

### 8.2 Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Primary | Inter | 400, 500, 600, 700 | Body, UI, labels |
| Display | Manrope | 700, 800 | Headers, hero text |
| Mono | JetBrains Mono | 400 | Data, coordinates, debug |

### 8.3 Barry Mascot Poses

| Pose | Context | Animation |
|---|---|---|
| `friendly-guide` | Default/welcome | Gentle wave, idle bounce |
| `points-the-way` | Showing equity zone | Flag wave, directional lean |
| `map-master` | During calculation | Map unfolds, eyes scan |
| `pin-dropper` | Result reveal | Jump → impact → ripple confetti |
| `thinking` | Loading states | Eyes squint, gears turn |
| `confused` | Error/conflict | Head tilt, question mark |
| `celebrating` | Booking confirmed | Arms up, confetti burst |
| `shrug` | Empty states | Palms up, inviting CTA |

### 8.4 Design Principles

1. **"The Invisible Concierge"** — UI feels like talking to a smart friend, not a dashboard
2. **One action per screen** — Each screen justifies its existence by removing friction
3. **Sliders over keyboards** — Constraints use sliders, not text input
4. **Color = information** — Green/yellow/red equity zones readable at a glance
5. **Barry is always present** — Mascot bridges emotional gap between algorithm and human
6. **Mobile-first** — Every interaction must work with one thumb

## 9. DEVELOPMENT PHASES

### Phase 3A: Functional Prototype (CURRENT)

**Goal:** Full 6-screen flow with real equity calculations, mock auth, mock bookings.

**Scope:**
- [ ] Monorepo setup (Turborepo + Next.js + Expo + NestJS + FastAPI)
- [ ] Docker Compose (PostgreSQL + PostGIS, Redis, OSRM)
- [ ] Database schema migration
- [ ] Barry mascot SVG component system
- [ ] Home screen with trip list
- [ ] Create Trip flow (name, date, transport, invite link)
- [ ] Constraints screen (sliders for time, money, mode, weight)
- [ ] Equity Engine with real OSRM routing
- [ ] Equity Map (Mapbox heatmap + zone cards)
- [ ] Group Vote (Tinder swipe cards + real-time WebSocket)
- [ ] Itinerary screen (route summary, calendar export)
- [ ] i18n (FR + EN)
- [ ] Seed data (5 users, 3 trips, 10 venues in Paris)
- [ ] Responsive web + Expo mobile

**Auth:** Simple email/password (no OAuth yet) or magic link
**Data:** Real geo calculations, mock venue data, mock bookings
**Deployment:** Docker Compose local only

### Phase 3B: Production Ready

**Goal:** All external integrations, real auth, real payments, app store ready.

**Scope:**
- [ ] OAuth2 (Google, Apple, Facebook)
- [ ] TheFork API integration (restaurant booking)
- [ ] Booking.com API (hotels)
- [ ] SNCF/Trainline API (trains)
- [ ] Navitia API (public transit routing + costs)
- [ ] Stripe Connect (split payments)
- [ ] Push notifications (Expo + Firebase)
- [ ] B.Pro subscription (in-app purchase)
- [ ] Stealth mode
- [ ] Family mode with accessibility filters
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] E2E tests (Playwright + Detox)
- [ ] App Store + Play Store submission
- [ ] Landing page + marketing site

## 10. AGENT ROLES

When working on Barry, Claude operates as a multi-disciplinary team. Each agent role has specific expertise and responsibilities:

### ️ ARCHITECT — Technical Architecture & DevOps
- Monorepo structure, dependency management, build system
- Docker Compose & Kubernetes configuration
- Database schema design, migrations, indexes
- API design (REST + GraphQL), WebSocket protocol
- Performance targets: API < 200ms p95, equity calc < 5s for 8 participants
- Security: Argon2id, rate limiting, CORS, CSP, CSRF

### DESIGNER — UI/UX & Brand Identity
- Barry mascot SVG system (all poses, animations)
- Design tokens (colors, typography, spacing, shadows)
- Component design (cards, sliders, swipe deck, map overlays)
- Wireframe → pixel-perfect implementation
- WCAG 2.1 AA accessibility compliance
- Motion design: page transitions, micro-interactions, Barry animations
- Brand consistency across web + mobile

### FRONTEND — Web & Mobile Development
- Next.js 14 App Router (web)
- Expo Router (mobile)
- Shared state management (Zustand + TanStack Query)
- Mapbox integration (heatmaps, custom markers, route lines)
- Socket.io client for real-time features
- i18n with react-i18next
- NativeWind for cross-platform styling

### ️ BACKEND — API & Services
- NestJS modules (auth, trips, users, venues, votes, notifications)
- GraphQL schema + DataLoader for N+1 prevention
- WebSocket gateway (Socket.io)
- BullMQ job queues for async equity calculations
- Redis caching strategy (routes, sessions)
- Input validation (class-validator + Zod)

### DATA SCIENTIST — Equity Engine
- Minimax burden optimization algorithm
- OSRM integration for multi-modal routing
- Spatial grid search with PostGIS
- Zone clustering and scoring
- Equity score formula: `1 - (σ(burdens) / μ(burdens))`
- Performance optimization (< 5s for 8 participants)
- Edge case handling (conflicting constraints, degenerate geometry)

### PRODUCT — Strategy & Business
- Feature prioritization per phase
- Success metrics tracking (decision time, equity score, conversion)
- Freemium model design (B.Free vs B.Pro)
- Affiliate commission structure
- User onboarding flow optimization
- A/B testing strategy

### MARKETING — Growth & Brand
- Content pillars: Equity Stories, City Secrets, Group Psychology, Weekend at Barry's, Barry Comics
- Viral mechanics: "The Equity Challenge" — share unfair meetup stories
- Channel strategy: TikTok/Reels, university ambassadors, EVG/EVJF blogs
- SEO: "fairest meeting neighborhoods in [City]"
- WhatsApp deep-link virality (K ≥ 0.4)

### QA — Testing & Quality
- Unit tests: Jest (frontend/backend), pytest (equity engine)
- Integration tests: Supertest (API), Apollo test server (GraphQL)
- E2E tests: Playwright (web), Detox (mobile)
- Seed data management
- Performance benchmarks
- Accessibility audits

## 11. BUSINESS MODEL

| Stream | Model | Phase | Revenue % |
|---|---|---|---|
| **Affiliate Commissions** | CPA 5-15% | 3B | 60% |
| **B.Pro Subscription** | €4.99/mo | 3B | 25% |
| **B2B White Label** | License | Future | 10% |
| **Data Insights** | Aggregated anonymized | Future | 5% |

**Unit Economics (Y2):** CAC €8-12 · LTV €45 · Break-even Month 4 · K ≥ 0.4

**API Partners:**
- Transport: Navitia, SNCF, Trainline, Uber, Bolt, BlaBlaCar, Amadeus
- Booking: Booking.com, TheFork, Resy, GetYourGuide, Airbnb
- Payment: Stripe Connect, Lydia, Tricount
- Social: WhatsApp deep-links, Calendar APIs

## 12. GO-TO-MARKET

| Phase | Timeline | Focus | Milestone |
|---|---|---|---|
| **MVP** | M1-3 | Paris dinner use case, 3 transport modes | 1K users |
| **Seed** | M4-6 | France expansion, weekends, trains, stealth | 10K users, €50K MRR |
| **Scale** | M7-12 | EU rail, EVG, hotels, B.Pro | 50K users, €200K MRR |
| **Platform** | Y2 | B2B, flights, corporate, data | 200K users, €1M MRR |

## 13. KEY DECISIONS LOG

| Decision | Choice | Rationale |
|---|---|---|
| App name | Barry | Barycentre wordplay, memorable, friendly |
| Maps provider | Mapbox | Best heatmap support, free tier, custom styles, RN support |
| Mobile framework | Expo (React Native) | Cross-platform, shared logic with Next.js |
| Monorepo tool | Turborepo | Fast, incremental builds, good DX |
| Equity calc | Real OSRM in prototype | Authentic demo, validates algorithm before production |
| i18n | From day one (FR + EN) | France-first launch but built for expansion |
| Auth (prototype) | Simple email/password | Ship fast, OAuth2 in Phase 3B |
| Styling | Tailwind + NativeWind | Consistent design tokens web ↔ mobile |

## 14. CONVENTIONS

### Code Style
- TypeScript strict mode everywhere
- ESLint + Prettier (shared config in `packages/eslint-config`)
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- File naming: `kebab-case` for files, `PascalCase` for components
- Max file length: ~300 lines (split if larger)

### Git Workflow
- `main` — production-ready
- `develop` — integration branch
- `feat/*` — feature branches
- `fix/*` — bug fixes
- PR required for `main`, self-merge OK for `develop`

### Environment Variables
- `.env.example` in each app directory
- Never commit secrets
- Docker Compose uses `.env` at root
- Prefix public vars with `NEXT_PUBLIC_` (web) or `EXPO_PUBLIC_` (mobile)

---

## 15. CURRENT IMPLEMENTATION STATE (Wave 11)

> Updated continuously. This section reflects what's actually shipped vs what's planned.

### 15.1 Repo & deployment

- **Monorepo** at `github.com/Richie6988/michmich` (turbo + npm workspaces)
- Local dev on Windows: portable Node + Postgres + Redis under `portable/`
- Start script: `start-barry.ps1` — boots PG (5433), Redis (6380), equity-engine (Python 8000), Next.js web (3000)
- `claude.md` — this file. **Always update on major waves.**
- `DEV_QUEUE.md` — backlog with priority + scope estimate per item

### 15.2 What's BUILT

#### Auth & nav
- Home `/` with login top-right (button OR avatar+menu)
- `/login` with 3 tabs: sign in / create account / forgot password (mock reset)
- Demo user quick-login (Chloé, Tom, Marc)
- `/profile` with avatar upload, balance, payment methods, prefs, **travel preferences** (saved defaults: home, max duration, max budget, self-book, loyalty cards, email)
- `/join/[token]` — forced "Who are you?" modal as first screen, blurred trip preview behind
- `/legal/{terms,privacy,cookies}` — GDPR-aware static pages

#### Trip overview (`/trips/[id]`)
- **Top KPI bar**: 4-step traffic light (Setup → Zone → Venue → Booked)
- **Vertical chrono line** on left margin connecting 12 sections, each numbered colored dot
- 12 sections in order:
  1. Participants + invite (blue)
  2. Plan (purple) — date poll + chat side-by-side
  3. To-do list (amber) — assignable tasks with avatar, quick chips
  4. Map (cyan) — Leaflet inline with zones, edge arrows for off-screen participants
  5. Pin vote (orange) — appears when zones ready, hides after lock
  6. Picks for your group (rose) — bars/restaurants + hotels (trip mode only) with filter chips above
  7. Activities + car rental (teal) — wanderlust gets activities only; trip gets activities + cars
  8. Trip summary (violet) — pre-fund recap with per-person transport
  9. Fund Barry (pink) — **inline per-participant pay flow** with confirm modal, in-app balance OR card, auto-trigger booking when 100%
  10. Booking + report (emerald) — appears once funds complete
  11. Expenses (Tricount) (indigo) — split + balances
  12. Memories (fuchsia) — photo upload + grid + zoom modal

#### Components (the design DNA building blocks)
- `apps/web/src/components/ui/avatar.tsx` — **Avatar + AvatarStack** (universal, deterministic color from user.id, renders profile pic if uploaded). Used everywhere instead of inline initials bubbles.
- `apps/web/src/components/ui/skeleton.tsx` — `Skeleton`, `SkeletonScrollCard`, `SkeletonScrollCardList`, `SkeletonBlock`, `SkeletonZones` for loading states
- `apps/web/src/components/barry/brand.tsx` — `BarryMascot` (5 moods), `BarryMark`, `BarryLogo`, `BarryLoader`
- `apps/web/src/components/barry/interactive-mascot.tsx` — Tamagotchi: click → bounce + speech bubble, 14 random messages
- `apps/web/src/components/trip/trip-progress.tsx` — KPI 4-step progress bar
- `apps/web/src/components/trip/todo-section.tsx` — TODO with assignment + quick chips
- `apps/web/src/components/trip/memory-gallery.tsx` — Photo grid + zoom modal + delete
- `apps/web/src/components/trip/activities-and-cars.tsx` — Activities + CarRental scroll sections with popup detail
- `apps/web/src/components/trip/filters-bar.tsx` — Chip-style filters with `VENUE_FILTERS`, `HOTEL_FILTERS`, `ACTIVITY_FILTERS`, `CAR_FILTERS`
- `apps/web/src/components/trip/setup-sheet.tsx` — wider (max-w-2xl), Nominatim autocomplete with `onMouseDown` fix, prefills from preferences
- `apps/web/src/components/trip/scroll-card-list.tsx` — horizontal-scroll image cards (TheFork-style)
- `apps/web/src/components/trip/detail-popup.tsx` — bottom sheet with hero image + 3-button thumb vote + Pick CTA
- `apps/web/src/lib/data/venues.ts` — `VENUES_BY_ZONE` (12 venues, 3 zones), `DEMO_ACCOMMODATIONS`
- `apps/web/src/lib/data/activities.ts` — 14 activities scoped wanderlust/trip/both + 6 car rentals
- `apps/web/src/lib/data/reduction-cards.ts` — 40+ EU loyalty/reduction cards (SNCF/KLM/BahnCard/Trenitalia/Renfe/SBB/ÖBB/Iberia/Ryanair etc.)
- `apps/web/src/lib/utils/trip-export.ts` — **PDF (browser print) + ICS (RFC 5545) export**
- `apps/web/src/lib/design/tokens.ts` — graphic DNA tokens (COLORS, GRADIENTS, SHADOWS, RADIUS, CLASSES, MOTION)

#### Trip header menu (more / "...")
- Duplicate Barry → clones trip with fresh votes/dates/funds
- Copy invite link → copies `/join/<token>` URL
- Add to calendar (.ics)
- Export PDF recap (opens print-friendly tab)

#### Home page trip rows (per-row kebab menu)
- Duplicate Barry → same action, navigates to new trip
- For ongoing trips only: Mark as finished (→ status='completed') and Cancel Barry (→ status='cancelled')
- Confirms before changing status
- Menu visible on hover (desktop) or always (mobile)

### 15.3 Store actions (Zustand persist v3)

**Auth**: `login`, `signup`, `setGuestMode`, `logout`, `updateCurrentUser` (patches User + propagates to all trips)

**Trips**: `createGroupTrip`, `duplicateTrip`, `updateTripStatus`, `setActiveTrip`, `addParticipantByName`, `removeParticipant`, `updateParticipantConstraints`

**Voting**: `voteForPin`, `closePinVote`, `voteForVenue`, `closeVenueVote`, `voteForAccommodation`, `selectAccommodation`, `voteDatePoll`, `addDateOption`, `closeDatePoll`

**Tasks/photos**: `addTask`, `toggleTask`, `removeTask`, `reassignTask`, `addTripPhoto`, `removeTripPhoto`

**Funds**: `createFundsRequest`, `payFundsContribution` (with `useBalance` flag), `performBookings`

**Persisted slots** (v3): `currentUser`, `isAuthenticated`, `isGuest`, `preferences`, `paymentMethods`, `inAppBalance`, `balanceTransactions`. Migration handler in place for v2 → v3.

### 15.4 Real APIs in use

- **OSM Overpass** — POI fetch (with timeout fallback to seeded venues)
- **Nominatim** — address autocomplete in setup sheet
- **OSRM** — routing/duration/cost
- **Equity Engine** (Python FastAPI) — minimax burden optimization. Cached health-check (`isEquityEngineUp` 30s memo) so failures don't spam.
- **Carto Voyager** — Leaflet tile layer (no Mapbox, no API key)
- **Booking deep-links** — built but mock; would call real partner APIs in production

### 15.5 What's NOT yet built

- **Real OAuth** (Google / Apple) — currently demo email login
- **Real Stripe Connect** — funds flow is mock UI
- **Real bookings** via partners (TheFork, Booking.com, SNCF Connect) — currently generate confirmation codes locally
- **Push notifications** — service worker + opt-in opt — see DEV_QUEUE.md
- **Dark mode** — see DEV_QUEUE.md (audit-heavy)
- **WebSocket real-time voting** — currently optimistic + persisted
- **Mobile (Expo)** — skeleton only; web is the active codebase
- **NestJS API real entities** — has skeleton, no production endpoints
- **Tests** — Jest, Playwright, Detox not yet set up
- **i18n FR translations** — locale plumbed, FR strings TBD

### 15.6 Validation pipeline (every wave)

1. **Babel parse** all TS/TSX with `@babel/parser` — catches syntax errors
2. **TypeScript syntax check** with `tsc --noEmit` (no types lib loaded so it's syntax-only) — catches TS-specific syntax issues
3. **Emoji scan** (Python regex over codebase) — confirms 0 emojis (we use SVG icons only)
4. **Import resolution** check — verifies all `@/...` paths resolve
5. **Conventional commit** with detailed multi-section message
6. Push to `main` immediately after green validation

### 15.7 Wave history (recent)

| Commit | Wave | Highlights |
|---|---|---|
| upcoming | 15 | Wanderlust UX dropped (renamed One day / Multi-day, internal value preserved); owner-toggled trip components (hotel/restaurant/activities/car) gating picks sections; chat search + relative timestamps; right-click prevented in trips/new; animated mascot |
| cf5b115 | 14 | Branded modals + homepage redesign (HellLoop animations + BarryRocks scenarios) + MascotCTA + em-dash purge + dev-options removed + grey-on-grey input fix in trips/new |
| upcoming | 13-backend | Full NestJS backend: 18 TypeORM entities, 8 modules, ~50 endpoints, JWT auth, WebSocket gateway, initial migration, web client API wrapper |
| upcoming | 12-bugfix | Hooks rule fix in FundsCard, single-line transport (6 cols), date poll re-shuffling fix, sticky TripProgress, phase-coded ChronoSection, fund visible after transport, branded PDF export, fixed map edge arrows + distance hover |
| upcoming | 12-darkmode+a11y+toasts | Dark mode toggle, focus-visible, prefers-reduced-motion, ARIA live region on chat, in-app toasts |
| a2ecd3d | 11-row-actions | Per-row kebab menu on home: Duplicate / Mark finished / Cancel |
| 0c9c34d | 11-phase2 | Join modal first, fund per-participant flow, duplicate trip, skeleton, PDF/ICS, claude.md Section 15 |
| 1f20c93 | 11-phase1 | Universal Avatar + profile pic upload + design tokens |
| c4b684e | 10B | Emoji purge, popup polish, chat scroll fix, KPI bar, filters, chrono line, activities + cars, TODO, memory gallery, tamagotchi mascot |
| 2b4b25a | 10A | Create-Barry crash fix, auth flow, setup polish, profile travel prefs |
| b229963 | 9D-9F | Auth gating, solo edge zones, map viewport edge arrows |
| 49d7b3e | 9C | Dynamic landing + cached engine health |
| 47f7e60 | 9B | Setup overhaul, 40+ EU cards, post-booking report |
| cf3fa62 | 9A | Wanderlust/trip mode + visible mascot + recap |

### 15.8 The graphic DNA (design system)

Single source of truth: `apps/web/src/lib/design/tokens.ts`

- **Brand** primary: barry-blue `#2563EB`, accent coral `#F97316`, success `#10B981`
- **Avatar palette**: 8 deterministic colors (same person = same color across the app, hashed from user.id)
- **Radius**: sm `lg` (8) / md `xl` (12) / lg `2xl` (16) / xl `3xl` (24) / full
- **Cards**: `bg-white rounded-2xl border border-slate-100`
- **CTA buttons**: `bg-gradient-to-r from-barry-blue to-blue-700 text-white shadow-lg shadow-blue-500/20`
- **Modals**: full `rounded-3xl` (no half-rounded), custom `barry-scroll` thin scrollbar so the corners look right
- **Typography**: Inter (body) + Manrope (display) + JetBrains Mono (code)
- **Motion**: 150-300ms snappy transitions, mascot uses spring bounce only
- **Icons**: stroke SVG only, never emojis. Width=2 standard.

---

*Last updated: May 1, 2026 - Wave 15 (Wanderlust UX retired, owner activates trip components, chat search + timestamps)*
*Maintained by: Claude (AI architect) + Richie (founder)*

---

## 16. BACKEND IMPLEMENTATION (Wave 13)

**Stack**: NestJS 10 + TypeORM + PostgreSQL 15 + PostGIS + Redis (BullMQ) + Socket.IO + Argon2 + JWT.

**Run locally**: `npm run dev --workspace=@barry/api` from repo root (or `cd apps/api && npm run dev`), listens on port 3001. Swagger docs at `/api/docs`.

### 16.1 Entities (18 total, all in `apps/api/src/*/entities/`)

| Entity | Table | Purpose |
|---|---|---|
| User | users | accounts (email + argon2 password_hash + OAuth fields), travel preference defaults, theme, PostGIS home_location |
| Trip | trips | core trip with mode, status, scheduledAt, endDate, inviteToken |
| TripParticipant | trip_participants | per-trip per-user constraints + computed equity fields + originLocation (PostGIS) |
| Task | trip_tasks | TODO list with assignee, completed, completedAt |
| TripPhoto | trip_photos | memory gallery, uploadedBy + uploadedAt |
| Vote | votes | polymorphic (pin/venue/accommodation/date) with targetId + response enum |
| DatePoll, DatePollOption | date_polls + date_poll_options | date polling with score per option |
| EquityZone | equity_zones | computed by Python engine, cached, with PostGIS center + metadata jsonb |
| TripPin | trip_pins | locked zone per trip (one row max) |
| Venue | venues | global catalog (PostGIS location + GiST index for fast nearest-neighbor) |
| Accommodation | trip_accommodations | per-trip hotel/bnb/airbnb candidates |
| FundsRequest | funds_requests | total + breakdown jsonb (venues/accommodation/transport) per trip |
| FundsContribution | funds_contributions | per-participant amount + status (pending/paid/refunded) + paymentReference |
| Reservation | reservations | confirmed bookings with confirmation code |
| TransportLeg | transport_legs | per-participant route (mode, duration, distance, cost, geometry jsonb) |
| Notification | notifications | per-user inbox (read/unread, type-tagged, optional tripId + url) |
| PushSubscription | push_subscriptions | Web Push endpoint + p256dh + auth keys |

### 16.2 Modules (8 total)

- **AuthModule** — JWT strategy with Passport, JwtAuthGuard, `@CurrentUser()` param decorator. Endpoints: `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`, `GET /auth/me`. Argon2 password hashing.
- **UsersModule** — `GET/PATCH /users/me`, `POST /users/me/home-location` (lat/lng → PostGIS Point).
- **TripsModule** — full CRUD on `/trips`, plus nested `participants`, `tasks`, `photos`, `me/constraints`, `duplicate`. Plus public `JoinController` at `/join/:token` (no auth) for invite preview.
- **VotesModule** — generic vote endpoints (`POST /trips/:id/votes`, `GET /trips/:id/votes/:type`, `DELETE`) and date-poll endpoints (`addOption`, `vote`, `close`).
- **EquityModule** — calls Python engine via fetch with 30s timeout, caches zones in DB. `GET /equity/health`, `GET/POST /trips/:id/zones`, `GET/POST /trips/:id/pin`.
- **VenuesModule** — `GET /venues/near?lat&lng&radius&category` using PostGIS `ST_DWithin` + distance ordering. `GET /trips/:id/accommodations`.
- **NotificationsModule** — inbox (`GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`) + push subscription endpoints. `pushToUser` helper stub for `web-push` lib (not yet wired with VAPID keys).
- **GatewayModule** — Socket.IO at `/realtime` namespace. Clients `join_trip`/`leave_trip` to enter rooms. Service helpers: `emitVote`, `emitTask`, `emitPhoto`, `emitFund`, `emitChat`, `emitZones`.

### 16.3 Migration

Initial migration at `apps/api/src/migrations/1714521600000-InitialBackend.ts`. Creates all 18 tables + 14 enum types + GiST index on `venues.location` for spatial queries. Run with:

```
npm run migration:run --workspace=@barry/api
# or: cd apps/api && npm run migration:run
```

DataSource at `apps/api/src/data-source.ts` reads `DATABASE_URL` or `PG*` env vars. Default points at portable Windows: `localhost:5433`, `barry/barry_dev/barry`.

### 16.4 Web client → backend bridge

`apps/web/src/lib/api/backend.ts` exposes typed wrappers for every endpoint, organized as `api.auth.*`, `api.users.*`, `api.trips.*`, `api.join.*`, `api.votes.*`, `api.equity.*`, `api.venues.*`, `api.notifications.*`. JWT stored in `localStorage` under `barry_token`. `setToken/getToken` helpers exposed.

The web app **still uses the Zustand store as primary state** today; the API client is the bridge for progressively replacing store actions with real server calls. Strategy: keep optimistic local state, mirror to server in the background, reconcile on response.

### 16.5 Env vars

Backend reads from `apps/api/.env` (or repo root `.env`). See `apps/api/.env.example`:
- `DATABASE_URL` — Postgres connection string (or `PG*` vars)
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `EQUITY_ENGINE_URL` — Python service URL (default `http://localhost:8000`)
- `REDIS_HOST`, `REDIS_PORT` — for BullMQ jobs
- `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT` — Web Push (not yet active)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payments (not yet active)
- `S3_*` — photo storage (not yet active)

### 16.6 What's still NOT yet wired

- **Web client integration**: store actions still operate on local state only. Need to add a "use backend" toggle and rewrite key actions (signup, createTrip, voteForVenue, etc.) to call `api.*` methods.
- **Web Push** real send: `pushToUser` in NotificationsService is a stub. Needs `web-push` npm install + VAPID key generation + 410 Gone handling for stale subscriptions.
- **Stripe Connect** for funds payments.
- **Real partner bookings** (TheFork, Booking.com, SNCF Connect).
- **Real OAuth** (Google, Apple) — skeleton fields exist (`googleId`, `appleId`) but no flows.
- **WebSocket auth verification** — currently accepts any connection in dev. Production must verify JWT from `client.handshake.auth.token`.
- **Tests** — Jest + e2e setup exists, no actual test files yet.

---

## 17. TRIP COMPONENTS & UX FLOW (Wave 15)

### Wanderlust mode dropped from UX (data layer unchanged)

The internal `mode: 'wanderlust' | 'trip'` field is preserved on Trip for data
compatibility, but the user-facing UX no longer mentions "Wanderlust". The
"How long?" toggle in trips/new now reads:
- **Just one day** (internal value: `'wanderlust'`)
- **A few days** (internal value: `'trip'`)

All user-visible labels have been replaced:
- Trip header pill: `One day` / `Multi-day`
- PDF export mode pill: `One day` / `Multi-day`
- Trip layout chip: `Multi-day` / `One day`

### Owner-toggled trip components

New `tripComponents: Record<string, { accommodation, restaurant, activities, car }>`
in the Zustand store. Persisted in localStorage with v3 -> v4 migration.

Default values when not yet toggled:
- One-day: `{ restaurant: true, accommodation: false, activities: false, car: false }`
- Multi-day: `{ accommodation: true, restaurant: true, activities: false, car: false }`

`<TripComponentsToggle>` component:
- Two display modes: owner (4-button toggle grid with check badges) and
  participant (read-only chips showing what's active)
- Color-coded per category: orange (restaurant), blue (hotel), emerald
  (activities), violet (car)
- Persists toggle action via `toggleTripComponent(tripId, component)`
- Inserted in trip page as Section 5.5 between Pin Vote and Picks

### Section gating

`VenuesAndStaySection` and `ActivitiesAndCarsBlock` now read tripComponents:
- Restaurants section renders only when `components.restaurant === true`
- Accommodation section renders only when `components.accommodation === true && isMultiDay`
- Activities section renders only when `components.activities === true`
- Car rental section renders only when `components.car === true && isMultiDay`
- Empty state when no category active: friendly message pointing to the toggle above

### Chat enhancements

- Search button (magnifying glass) in ChatCard header next to Open
- Search filters across full message history (vs default last 8 view)
- `<mark>` highlighting on matches with amber background
- Live match counter ("3 matches")
- Auto-scroll suspended during search to keep results visible
- Per-message timestamps using relative format:
  `now`, `Nm`, `HH:MM` (today), `Yesterday HH:MM`, `Nd`, `D MMM`
- Title attribute on timestamp shows full ISO datetime on hover
- All dark mode aware

### Right-click prevention in trips/new

`onContextMenu={(e) => e.preventDefault()}` on `<main>` to keep the create
flow distraction-free. Mascot wrapped in `barry-mascot-idle` class for the
gentle bob animation.
