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
├── claude.md                          # This file — project brain
├── README.md
├── turbo.json
├── package.json                       # Root workspace
├── docker-compose.yml                 # Local dev: postgres, redis, osrm, elasticsearch
├── .github/workflows/
│   ├── ci.yml
│   └── cd.yml
├── apps/
│   ├── web/                           # Next.js 14 PWA
│   │   ├── src/
│   │   │   ├── app/                   # App Router pages
│   │   │   │   ├── (auth)/            # Login, register, OAuth callback
│   │   │   │   ├── (app)/             # Authenticated routes
│   │   │   │   │   ├── page.tsx       # Home — active trips
│   │   │   │   │   ├── trips/
│   │   │   │   │   │   ├── new/       # Create trip
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx        # Trip dashboard
│   │   │   │   │   │       ├── constraints/    # Set constraints
│   │   │   │   │   │       ├── map/            # Equity map
│   │   │   │   │   │       ├── vote/           # Group vote
│   │   │   │   │   │       └── itinerary/      # Final itinerary
│   │   │   │   │   ├── profile/
│   │   │   │   │   └── settings/
│   │   │   ├── components/
│   │   │   │   ├── barry/             # Barry mascot SVG components
│   │   │   │   ├── map/               # Mapbox wrappers, heatmap, routes
│   │   │   │   ├── trip/              # Trip cards, participant rows
│   │   │   │   ├── vote/              # Swipe cards, vote counter
│   │   │   │   └── ui/               # shadcn/ui components
│   │   │   ├── hooks/
│   │   │   ├── stores/                # Zustand stores
│   │   │   ├── lib/
│   │   │   │   ├── api/               # API client (TanStack Query)
│   │   │   │   ├── socket.ts          # Socket.io client
│   │   │   │   └── i18n/             # Translation files
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── mobile/                        # Expo (React Native)
│   │   ├── app/                       # Expo Router file-based routing
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── lib/
│   │   ├── assets/
│   │   ├── app.json
│   │   └── package.json
│   └── api/                           # NestJS backend
│       ├── src/
│       │   ├── auth/                  # Auth module (OAuth2, JWT)
│       │   ├── users/                 # User CRUD
│       │   ├── trips/                 # Trip lifecycle
│       │   ├── participants/          # Constraints, status
│       │   ├── equity/                # Proxy to equity engine
│       │   ├── venues/                # Venue search
│       │   ├── votes/                 # Voting engine
│       │   ├── bookings/              # Booking orchestration (3B)
│       │   ├── payments/              # Stripe integration (3B)
│       │   ├── notifications/         # Push + in-app
│       │   ├── gateway/               # WebSocket gateway (Socket.io)
│       │   ├── common/                # Guards, interceptors, pipes
│       │   └── config/
│       ├── test/
│       ├── Dockerfile
│       └── package.json
├── services/
│   └── equity-engine/                 # FastAPI Python microservice
│       ├── app/
│       │   ├── main.py
│       │   ├── api/routes.py
│       │   ├── models/
│       │   │   ├── constraints.py
│       │   │   └── equity.py
│       │   ├── algorithms/
│       │   │   └── equity_optimizer.py  # Core minimax algorithm
│       │   └── services/
│       │       ├── osrm_client.py       # OSRM routing
│       │       ├── transit_client.py     # Navitia wrapper
│       │       └── geocoder.py
│       ├── tests/
│       ├── requirements.txt
│       ├── Dockerfile
│       └── proto/equity.proto           # gRPC definition
├── packages/
│   ├── shared-types/                  # TypeScript interfaces (Trip, User, Venue, etc.)
│   ├── ui/                            # Shared UI primitives
│   ├── i18n/                          # Shared translation keys & files
│   └── eslint-config/
├── infra/
│   ├── k8s/                           # Kubernetes manifests (prod)
│   ├── docker/                        # Dockerfiles, nginx configs
│   └── monitoring/                    # Prometheus + Grafana
├── scripts/
│   ├── seed.ts                        # Test data: 5 users, 3 trips, 10 venues (Paris)
│   └── migrate.sh
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── equity-engine.md
│   └── onboarding.md
└── insights/                          # Design & strategy docs (existing)
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

### 🏗️ ARCHITECT — Technical Architecture & DevOps
- Monorepo structure, dependency management, build system
- Docker Compose & Kubernetes configuration
- Database schema design, migrations, indexes
- API design (REST + GraphQL), WebSocket protocol
- Performance targets: API < 200ms p95, equity calc < 5s for 8 participants
- Security: Argon2id, rate limiting, CORS, CSP, CSRF

### 🎨 DESIGNER — UI/UX & Brand Identity
- Barry mascot SVG system (all poses, animations)
- Design tokens (colors, typography, spacing, shadows)
- Component design (cards, sliders, swipe deck, map overlays)
- Wireframe → pixel-perfect implementation
- WCAG 2.1 AA accessibility compliance
- Motion design: page transitions, micro-interactions, Barry animations
- Brand consistency across web + mobile

### 📱 FRONTEND — Web & Mobile Development
- Next.js 14 App Router (web)
- Expo Router (mobile)
- Shared state management (Zustand + TanStack Query)
- Mapbox integration (heatmaps, custom markers, route lines)
- Socket.io client for real-time features
- i18n with react-i18next
- NativeWind for cross-platform styling

### ⚙️ BACKEND — API & Services
- NestJS modules (auth, trips, users, venues, votes, notifications)
- GraphQL schema + DataLoader for N+1 prevention
- WebSocket gateway (Socket.io)
- BullMQ job queues for async equity calculations
- Redis caching strategy (routes, sessions)
- Input validation (class-validator + Zod)

### 🧮 DATA SCIENTIST — Equity Engine
- Minimax burden optimization algorithm
- OSRM integration for multi-modal routing
- Spatial grid search with PostGIS
- Zone clustering and scoring
- Equity score formula: `1 - (σ(burdens) / μ(burdens))`
- Performance optimization (< 5s for 8 participants)
- Edge case handling (conflicting constraints, degenerate geometry)

### 📈 PRODUCT — Strategy & Business
- Feature prioritization per phase
- Success metrics tracking (decision time, equity score, conversion)
- Freemium model design (B.Free vs B.Pro)
- Affiliate commission structure
- User onboarding flow optimization
- A/B testing strategy

### 📣 MARKETING — Growth & Brand
- Content pillars: Equity Stories, City Secrets, Group Psychology, Weekend at Barry's, Barry Comics
- Viral mechanics: "The Equity Challenge" — share unfair meetup stories
- Channel strategy: TikTok/Reels, university ambassadors, EVG/EVJF blogs
- SEO: "fairest meeting neighborhoods in [City]"
- WhatsApp deep-link virality (K ≥ 0.4)

### 🧪 QA — Testing & Quality
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

*Last updated: April 2026 — Phase 3A in progress*
*Maintained by: Claude (AI architect) + Richie (founder)*
