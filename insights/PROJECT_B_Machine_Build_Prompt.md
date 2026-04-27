# MACHINE PROMPT: PROJECT B — Production-Ready Build Specification

## PROMPT HEADER

You are a senior full-stack engineer, technical architect, and DevOps specialist with 15 years of experience building scalable web applications, real-time systems, and geospatial platforms. Your task is to build **PROJECT B** — a production-ready social-mobility web application — from scratch in a single, coherent implementation.

You must deliver:
1. A complete monorepo with frontend, backend, and infrastructure code
2. Docker Compose setup for local development
3. Production-ready Kubernetes manifests
4. Comprehensive test suites
5. Documentation

**Non-negotiable requirements:**
- TypeScript throughout (frontend + backend)
- Python for the equity engine microservice
- PostgreSQL + PostGIS for geospatial data
- Redis for caching and real-time sessions
- WebSockets for real-time group voting
- OAuth2 + JWT authentication
- Docker containerization
- Unit tests + integration tests + E2E tests

---

## 1. PROJECT OVERVIEW

PROJECT B is a social-mobility intelligence platform that finds the optimal, equitable meeting point for groups of friends based on multi-modal transport, individual constraints, and fairness algorithms.

**Core Features:**
- Group trip creation with multi-modal transport support (walk, bike, transit, car, train, flight)
- Individual constraint setting (time budget, money budget, transport mode, preference weights)
- Equity engine: minimax burden optimization across all participants
- Real-time group voting on venues (Tinder-style swipe cards)
- In-app booking via affiliate APIs (restaurants, hotels, trains, activities)
- Stealth mode for surprise events (EVG/EVJF)
- Split payment integration
- B. mascot animation system (CSS/SVG-based)

**Target Users:** Friend groups, families, corporate teams, event planners

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework:** Next.js 14 (App Router) with React Server Components
- **Language:** TypeScript 5.3+
- **Styling:** Tailwind CSS 3.4 + shadcn/ui components
- **State Management:** Zustand (client state) + React Query / TanStack Query (server state)
- **Maps:** Mapbox GL JS (react-map-gl wrapper)
- **Real-Time:** Socket.io-client
- **Animation:** Framer Motion (B. mascot animations, page transitions, swipe cards)
- **Forms:** React Hook Form + Zod validation
- **Build Output:** Static export for CDN + Node.js server for API routes

### Backend API (Core Services)
- **Framework:** NestJS 10 (Node.js 20 LTS)
- **Language:** TypeScript
- **API Style:** REST + GraphQL (Apollo Server)
- **Authentication:** Passport.js (OAuth2: Google, Apple, Facebook) + JWT (access + refresh tokens)
- **Authorization:** CASL (role-based: organizer, participant, viewer, stealth-excluded)
- **Validation:** class-validator + class-transformer
- **Documentation:** OpenAPI 3.0 (Swagger)

### Equity Engine (Microservice)
- **Framework:** FastAPI 0.104 (Python 3.11)
- **Libraries:** NetworkX 3.2, GeoPandas 0.14, Shapely 2.0, OSRM client, SciPy
- **Protocol:** gRPC for internal communication with Core Services
- **Container:** Separate Docker service

### Database
- **Primary:** PostgreSQL 15 with PostGIS 3.4 extension
- **Cache:** Redis 7 (sessions, route cache, real-time pub/sub)
- **Queue:** BullMQ (Redis-based) for background jobs
- **Search:** Elasticsearch 8 (venue indexing)
- **Analytics:** ClickHouse 23 (optional, for event tracking)

### Infrastructure
- **Containerization:** Docker + Docker Compose (local), Kubernetes (production)
- **Reverse Proxy:** Traefik 3.0 (automatic HTTPS, load balancing)
- **Message Broker:** Redis (BullMQ)
- **Monitoring:** Prometheus + Grafana
- **Logging:** Winston (backend) + Pino (frontend)
- **CI/CD:** GitHub Actions (lint, test, build, deploy)

---

## 3. DATABASE SCHEMA (PostgreSQL + PostGIS)

Write the complete schema as a single SQL migration file (`001_initial_schema.sql`). Use proper constraints, indexes, and PostGIS geometry types.

### Tables Required:

**users**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NULL (for OAuth-only users)
- first_name: VARCHAR(100) NOT NULL
- last_name: VARCHAR(100) NOT NULL
- avatar_url: TEXT
- phone: VARCHAR(20)
- default_transport_mode: ENUM('walk', 'bike', 'transit', 'car', 'train', 'flight') DEFAULT 'transit'
- default_time_weight: DECIMAL(3,2) DEFAULT 0.5
- default_money_weight: DECIMAL(3,2) DEFAULT 0.5
- home_location: GEOGRAPHY(POINT, 4326)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

**trips**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name: VARCHAR(255) NOT NULL
- description: TEXT
- organizer_id: UUID REFERENCES users(id) ON DELETE CASCADE
- trip_type: ENUM('dinner', 'weekend', 'evg', 'evjf', 'family', 'corporate', 'custom') DEFAULT 'custom'
- status: ENUM('draft', 'inviting', 'constraints', 'calculating', 'voting', 'booked', 'completed', 'cancelled') DEFAULT 'draft'
- scheduled_at: TIMESTAMPTZ
- stealth_mode: BOOLEAN DEFAULT FALSE
- stealth_hidden_users: UUID[] DEFAULT '{}'
- max_time_budget: INTEGER (minutes, NULL = unlimited)
- max_money_budget: DECIMAL(10,2) (NULL = unlimited)
- selected_venue_id: UUID REFERENCES venues(id) NULL
- equity_zone: GEOGRAPHY(POLYGON, 4326)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

**trip_participants**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- trip_id: UUID REFERENCES trips(id) ON DELETE CASCADE
- user_id: UUID REFERENCES users(id) ON DELETE CASCADE
- status: ENUM('invited', 'accepted', 'declined', 'constraints_set', 'voted') DEFAULT 'invited'
- transport_mode: ENUM('walk', 'bike', 'transit', 'car', 'train', 'flight')
- time_weight: DECIMAL(3,2) DEFAULT 0.5
- money_weight: DECIMAL(3,2) DEFAULT 0.5
- max_time: INTEGER (minutes)
- max_money: DECIMAL(10,2)
- origin_location: GEOGRAPHY(POINT, 4326)
- burden_score: DECIMAL(10,2) NULL
- route_geometry: GEOGRAPHY(LINESTRING, 4326) NULL
- route_duration: INTEGER (seconds)
- route_cost: DECIMAL(10,2)
- vote_choice: UUID REFERENCES venues(id) NULL
- created_at: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(trip_id, user_id)

**venues**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name: VARCHAR(255) NOT NULL
- category: ENUM('restaurant', 'bar', 'hotel', 'activity', 'museum', 'park', 'other')
- location: GEOGRAPHY(POINT, 4326) NOT NULL
- address: JSONB (structured address)
- accessibility_features: JSONB (elevator, wheelchair, etc.)
- price_level: INTEGER (1-4)
- rating: DECIMAL(2,1)
- external_ids: JSONB (booking_com_id, thefork_id, etc.)
- photos: TEXT[]
- created_at: TIMESTAMPTZ DEFAULT NOW()
- INDEX on location using GIST

**equity_zones**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- trip_id: UUID REFERENCES trips(id) ON DELETE CASCADE
- zone_geometry: GEOGRAPHY(POLYGON, 4326) NOT NULL
- equity_score: DECIMAL(5,2) NOT NULL
- max_burden: DECIMAL(10,2) NOT NULL
- mean_burden: DECIMAL(10,2) NOT NULL
- std_dev_burden: DECIMAL(10,2) NOT NULL
- rank: INTEGER NOT NULL
- is_selected: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMPTZ DEFAULT NOW()

**bookings**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- trip_id: UUID REFERENCES trips(id) ON DELETE CASCADE
- venue_id: UUID REFERENCES venues(id)
- booking_type: ENUM('restaurant', 'hotel', 'train', 'activity', 'other')
- external_booking_id: VARCHAR(255)
- provider: VARCHAR(100) (booking_com, sncf, thefork, etc.)
- total_amount: DECIMAL(10,2)
- currency: VARCHAR(3) DEFAULT 'EUR'
- status: ENUM('pending', 'confirmed', 'cancelled', 'refunded')
- booking_data: JSONB (raw API response)
- created_at: TIMESTAMPTZ DEFAULT NOW()

**payments**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- booking_id: UUID REFERENCES bookings(id)
- payer_id: UUID REFERENCES users(id)
- amount: DECIMAL(10,2)
- status: ENUM('pending', 'completed', 'failed', 'refunded')
- stripe_payment_intent_id: VARCHAR(255)
- created_at: TIMESTAMPTZ DEFAULT NOW()

**notifications**
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID REFERENCES users(id) ON DELETE CASCADE
- trip_id: UUID REFERENCES trips(id) ON DELETE CASCADE
- type: ENUM('invite', 'constraint_reminder', 'vote_start', 'vote_reminder', 'booking_confirmed', 'trip_update')
- title: VARCHAR(255)
- body: TEXT
- read: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMPTZ DEFAULT NOW()

**Indexes to create:**
- GIST index on users.home_location
- GIST index on venues.location
- GIST index on equity_zones.zone_geometry
- GIST index on trips.equity_zone
- B-tree index on trips.status, trips.organizer_id
- B-tree index on trip_participants.trip_id, trip_participants.user_id
- B-tree index on venues.category, venues.price_level

---

## 4. API SPECIFICATION (REST + GraphQL)

### REST Endpoints (NestJS Controllers)

**Auth Module (`/api/v1/auth`)**
- POST `/register` — email/password registration
- POST `/login` — email/password login
- POST `/oauth/:provider` — OAuth callback (google, apple, facebook)
- POST `/refresh` — refresh access token
- POST `/logout` — revoke refresh token

**User Module (`/api/v1/users`)**
- GET `/me` — current user profile
- PATCH `/me` — update profile
- GET `/me/trips` — list my trips (organized + participating)

**Trip Module (`/api/v1/trips`)**
- POST `/` — create trip (returns trip + invite link)
- GET `/:id` — get trip details (respects stealth mode)
- PATCH `/:id` — update trip (organizer only)
- POST `/:id/invite` — invite participants (email or phone)
- POST `/:id/join` — join via invite token
- POST `/:id/constraints` — submit personal constraints
- POST `/:id/calculate` — trigger equity calculation (auto-triggers when all constraints in)
- GET `/:id/zones` — get calculated equity zones
- POST `/:id/vote` — cast vote for venue
- GET `/:id/results` — get voting results
- POST `/:id/book` — initiate booking flow
- POST `/:id/complete` — mark trip completed

**Venue Module (`/api/v1/venues`)**
- GET `/search` — search venues by location + radius + filters
- GET `/:id` — venue details

**Booking Module (`/api/v1/bookings`)**
- POST `/` — create booking (calls partner API)
- GET `/:id` — booking status
- POST `/:id/cancel` — cancel booking
- POST `/:id/split` — configure payment split

**Payment Module (`/api/v1/payments`)**
- POST `/intent` — create Stripe PaymentIntent
- POST `/confirm` — confirm payment
- GET `/:bookingId/splits` — get split configuration

**Notification Module (`/api/v1/notifications`)**
- GET `/` — list notifications
- PATCH `/:id/read` — mark as read
- DELETE `/:id` — delete notification

### GraphQL Schema (Apollo Server)

Provide a complete GraphQL schema with:
- Types: User, Trip, TripParticipant, Venue, EquityZone, Booking, Payment, Notification
- Queries: me, trip(id), trips(filter), venues(search), equityZones(tripId), bookings(tripId)
- Mutations: createTrip, updateTrip, setConstraints, castVote, createBooking, confirmPayment
- Subscriptions: tripUpdated(tripId), voteUpdated(tripId), notificationReceived

Use DataLoader for N+1 query prevention.

---

## 5. FRONTEND ARCHITECTURE

### App Router Structure (Next.js 14)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── oauth/callback/page.tsx
├── (app)/
│   ├── layout.tsx (authenticated layout with B. mascot)
│   ├── page.tsx (Home — active trips)
│   ├── trips/
│   │   ├── new/page.tsx (Create Trip)
│   │   ├── [id]/
│   │   │   ├── page.tsx (Trip Dashboard)
│   │   │   ├── constraints/page.tsx (Set Constraints)
│   │   │   ├── map/page.tsx (Equity Map)
│   │   │   ├── vote/page.tsx (Group Vote)
│   │   │   └── itinerary/page.tsx (Itinerary & Booking)
│   ├── profile/page.tsx
│   └── settings/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts (NextAuth.js config)
│   └── webhooks/stripe/route.ts
├── layout.tsx (root)
└── globals.css
```

### Component Hierarchy

**Layout Components:**
- `AppShell` — navigation, B. mascot avatar, notification bell
- `TripLayout` — trip-specific header, progress stepper, participant avatars

**Feature Components:**
- `TripCreator` — multi-step form (name, date, transport modes, invite)
- `ConstraintForm` — sliders for time/money, mode selector, weight toggles
- `EquityMap` — Mapbox map with heat zones, B. pin drop animation, route lines
- `VoteDeck` — Framer Motion swipe cards (Tinder-style), vote counter
- `ItineraryView` — timeline, per-person routes, booking buttons, split pay
- `B_Mascot` — SVG component with pose variants (default, pointing, map, pin_drop, loading, error, success)

**UI Components (shadcn/ui base):**
- Button, Card, Slider, Switch, Badge, Avatar, Dialog, Toast, Skeleton
- Custom: `TransportIcon`, `EquityBadge`, `BurdenChart`, `ParticipantRow`

### State Management

**Zustand Stores:**
- `useAuthStore` — user, tokens, login/logout
- `useTripStore` — current trip, participants, constraints
- `useVoteStore` — venues, votes, results
- `useNotificationStore` — unread count, notifications

**React Query Keys:**
- `['trip', id]`, `['trips']`, `['venues', searchParams]`, `['equityZones', tripId]`, `['bookings', tripId]`

### Real-Time Integration

Use Socket.io client in a React Context provider:
- Connect on auth
- Join `trip:${tripId}` room when viewing trip
- Listen for: `trip:updated`, `participant:joined`, `constraints:updated`, `calculation:complete`, `vote:cast`, `booking:confirmed`
- Optimistic UI updates for votes

---

## 6. EQUITY ENGINE (Python FastAPI)

### Service Structure

```
equity-engine/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── constraints.py
│   │   └── equity.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── router.py (OSRM client)
│   │   ├── transit_client.py (Navitia wrapper)
│   │   └── flight_client.py (Amadeus wrapper)
│   ├── algorithms/
│   │   ├── __init__.py
│   │   └── equity_optimizer.py
│   └── api/
│       ├── __init__.py
│       └── routes.py
├── tests/
├── Dockerfile
└── requirements.txt
```

### Core Algorithm Implementation

Implement `equity_optimizer.py` with the following exact logic:

```python
from typing import List, Dict, Tuple
from dataclasses import dataclass
from shapely.geometry import Point, Polygon
import numpy as np
from scipy.optimize import minimize

@dataclass
class Participant:
    id: str
    origin: Tuple[float, float]  # lat, lon
    mode: str
    time_weight: float
    money_weight: float
    max_time: int  # minutes
    max_money: float  # euros

@dataclass
class EquityZone:
    center: Tuple[float, float]
    polygon: Polygon
    equity_score: float
    max_burden: float
    mean_burden: float
    std_burden: float
    burdens: Dict[str, float]

def calculate_burden(participant: Participant, time_minutes: float, cost_euros: float) -> float:
    return (time_minutes * participant.time_weight) + (cost_euros * participant.money_weight)

def get_route(origin: Tuple[float, float], destination: Tuple[float, float], mode: str) -> Tuple[float, float]:
    # Abstract function — integrate OSRM for car/bike/walk, Navitia for transit, Amadeus for flight
    # Returns (duration_minutes, cost_euros)
    pass

def find_equity_zones(
    participants: List[Participant],
    search_center: Tuple[float, float],
    search_radius_km: float = 50,
    grid_resolution: int = 20
) -> List[EquityZone]:
    """
    Grid search over candidate points, then cluster top candidates into zones.
    """
    # Generate candidate grid
    candidates = []
    # ... implementation with PostGIS spatial queries for POI density ...

    # For each candidate, calculate burden for all participants
    # Filter by hard constraints (max_time, max_money)
    # Score by: 0.7 * equity_score + 0.3 * (1 / max_burden)
    # Return top 3 zones with full burden breakdown
    pass

def calculate_equity_score(burdens: List[float]) -> float:
    if np.mean(burdens) == 0:
        return 100.0
    cv = np.std(burdens) / np.mean(burdens)
    return max(0, 100 - (cv * 100))
```

**API Endpoint:**
- POST `/calculate` — accepts trip_id, fetches participants from Core Service via gRPC, runs optimization, returns zones
- GET `/health` — health check

**gRPC Proto Definition:**
```protobuf
syntax = "proto3";
package equity;

service EquityService {
  rpc CalculateEquity (EquityRequest) returns (EquityResponse);
}

message EquityRequest {
  string trip_id = 1;
}

message EquityResponse {
  repeated Zone zones = 1;
}

message Zone {
  string id = 1;
  double lat = 2;
  double lon = 3;
  double equity_score = 4;
  double max_burden = 5;
  map<string, double> participant_burdens = 6;
}
```

---

## 7. REAL-TIME SYSTEM

### WebSocket Events (Socket.io)

**Server → Client:**
- `trip:updated` — { tripId, field, value }
- `participant:joined` — { tripId, participant }
- `constraints:updated` — { tripId, userId, constraints }
- `calculation:started` — { tripId }
- `calculation:complete` — { tripId, zones }
- `vote:cast` — { tripId, userId, venueId }
- `vote:complete` — { tripId, winner }
- `booking:confirmed` — { tripId, booking }
- `notification` — { userId, notification }

**Client → Server:**
- `trip:join` — { tripId }
- `trip:leave` — { tripId }
- `vote:submit` — { tripId, venueId }

### Redis Pub/Sub

Use Redis as the adapter for Socket.io horizontal scaling.

---

## 8. THIRD-PARTY INTEGRATIONS

### Transport APIs

**OSRM (Open Source Routing Machine)**
- Self-hosted or public server
- Endpoints: `/route/v1/{profile}/{coordinates}`
- Profiles: foot, bike, car
- Parse: duration, distance, geometry

**Navitia (Public Transit)**
- Base URL: `https://api.navitia.io/v1/`
- Auth: Basic HTTP (token as username)
- Endpoints: `/journeys`, `/places`, `/coverage`
- Parse: sections (walking + transit), duration, CO2

**SNCF / Trainline**
- Use Trainline API or SNCF API v2
- Search journeys by origin/destination/date
- Parse: prices, durations, transfer counts

**Amadeus (Flights)**
- OAuth2 client credentials flow
- Endpoints: `/v2/shopping/flight-offers`
- Parse: price, duration, segments

### Booking APIs

**Booking.com Affiliate API**
- Search hotels by lat/lon/radius
- Parse: name, price, rating, photos, deep link

**TheFork API**
- Search restaurants by location
- Parse: availability, price range, rating, booking link

**Stripe**
- PaymentIntent creation
- Split payment via Connect (destination charges)
- Webhook handling for payment confirmation

### Social/Calendar

**WhatsApp Deep Links**
- Format: `https://wa.me/?text=Join%20my%20trip%20on%20B...`
- Or use WhatsApp Business API for notifications

**Calendar APIs**
- Google Calendar: OAuth2 + insert event
- Apple/Outlook: iCal generation (.ics file download)

---

## 9. AUTHENTICATION & SECURITY

### Auth Flow
1. User registers/logs in via OAuth2 (Google/Apple/Facebook) or email/password
2. Backend issues JWT access token (15 min expiry) + HTTP-only refresh token cookie (7 days)
3. Frontend stores access token in memory (Zustand)
4. Refresh token automatically rotates on each use
5. Logout clears cookies + invalidates refresh token in Redis blacklist

### Security Measures
- **Passwords:** Argon2id hashing (never bcrypt)
- **Rate Limiting:** 100 req/min per IP, 10 req/min per user for sensitive endpoints
- **CORS:** Whitelist specific origins only
- **Input Sanitization:** DOMPurify for HTML, Zod for schema validation
- **SQL Injection:** Use TypeORM/Prisma query builder (never raw SQL with user input)
- **XSS:** Content Security Policy headers, HTTP-only cookies
- **CSRF:** Double-submit cookie pattern for state-changing operations
- **Geo Data:** All coordinates validated before PostGIS insertion
- **Stealth Mode:** Server-side filtering of trip data based on stealth_hidden_users array

---

## 10. DEPLOYMENT CONFIGURATION

### Docker Compose (Local Development)

Create `docker-compose.yml` with services:
- `postgres` (port 5432, volume for data persistence)
- `redis` (port 6379)
- `elasticsearch` (port 9200)
- `api` (NestJS, port 3001, hot reload via nodemon)
- `web` (Next.js, port 3000, hot reload)
- `equity-engine` (FastAPI, port 8000, hot reload)
- `osrm` (pre-built Docker image for routing)
- `traefik` (port 80/443, reverse proxy)

### Kubernetes Manifests (Production)

Create manifests for:
- `namespace: project-b`
- `deployment` for api (3 replicas, HPA based on CPU 70%)
- `deployment` for web (3 replicas, CDN for static assets)
- `deployment` for equity-engine (2 replicas, CPU-intensive)
- `statefulset` for postgres (1 replica, PVC)
- `statefulset` for redis (1 replica)
- `service` for each component
- `ingress` with TLS (Let's Encrypt)
- `configmap` for environment variables
- `secret` for API keys, DB passwords, JWT secrets

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/project_b
POSTGRES_USER=project_b
POSTGRES_PASSWORD=generate_strong_password
POSTGRES_DB=project_b

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=generate_256_bit_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# APIs
NAVITIA_TOKEN=
SNCF_API_KEY=
TRAINLINE_API_KEY=
AMADEUS_CLIENT_ID=
AMADEUS_CLIENT_SECRET=
BOOKING_COM_AFFILIATE_ID=
THEFORK_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Equity Engine
OSRM_URL=http://osrm:5000
EQUITY_GRID_RESOLUTION=20
EQUITY_MAX_RADIUS_KM=50

# App
NEXT_PUBLIC_API_URL=https://api.projectb.app
NEXT_PUBLIC_MAPBOX_TOKEN=
NODE_ENV=production
```

---

## 11. TESTING STRATEGY

### Unit Tests
- **Frontend:** Jest + React Testing Library (components, hooks, stores)
- **Backend:** Jest (NestJS services, controllers, guards)
- **Equity Engine:** pytest (algorithm correctness, edge cases)

### Integration Tests
- **API:** Supertest (NestJS) — test all REST endpoints with test DB
- **GraphQL:** Apollo test server — test queries, mutations, subscriptions
- **Equity Engine:** Test OSRM/Navitia mocks, verify burden calculations

### E2E Tests
- **Playwright:** Full user flows
  - User registration → trip creation → invite → constraints → calculation → vote → booking
  - Stealth mode flow
  - Split payment flow

### Test Data
- Seed script with 5 test users, 3 test trips, 10 test venues in Paris
- Mock external API responses (MSW for frontend, nock for backend)

---

## 12. FILE STRUCTURE

```
project-b/
├── README.md
├── docker-compose.yml
├── Makefile
├── .github/
│   └── workflows/
│       ├── ci.yml (lint, test, build)
│       └── cd.yml (deploy to staging/production)
├── apps/
│   ├── web/ (Next.js 14)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   └── api/ (NestJS)
│       ├── src/
│       ├── test/
│       ├── package.json
│       ├── tsconfig.json
│       └── Dockerfile
├── services/
│   └── equity-engine/ (FastAPI)
│       ├── app/
│       ├── tests/
│       ├── requirements.txt
│       ├── Dockerfile
│       └── proto/
├── packages/
│   ├── shared-types/ (TypeScript interfaces shared across apps)
│   ├── ui/ (shadcn/ui components)
│   └── eslint-config/
├── infra/
│   ├── k8s/ (Kubernetes manifests)
│   ├── terraform/ (AWS/GCP infrastructure)
│   └── monitoring/ (Prometheus + Grafana configs)
├── scripts/
│   ├── seed.ts
│   └── migrate.sh
└── docs/
    ├── api.md
    ├── architecture.md
    └── onboarding.md
```

---

## 13. IMPLEMENTATION CHECKLIST

Before declaring completion, verify:

- [ ] All database migrations run successfully
- [ ] All REST endpoints return correct responses (test with curl/Postman)
- [ ] GraphQL playground accessible and all queries/mutations work
- [ ] WebSocket real-time voting works across 3+ browser tabs
- [ ] Equity engine returns zones within 5 seconds for 5 participants
- [ ] Mapbox map renders heat zones and route lines
- [ ] B. mascot SVG animates through all poses
- [ ] OAuth login works with Google and Apple
- [ ] Stripe payment flow completes end-to-end
- [ ] Docker Compose brings up all services with one command
- [ ] All tests pass (unit + integration + E2E)
- [ ] No console errors in browser
- [ ] Lighthouse score ≥ 90 for performance, accessibility, best practices

---

## 14. ADDITIONAL REQUIREMENTS

### Performance
- API response time < 200ms for 95th percentile
- Equity calculation < 5 seconds for 8 participants
- Map tile loading < 1 second
- Time to Interactive < 3 seconds on 4G

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all flows
- Screen reader support for B. mascot (aria-label descriptions)
- Color contrast ratios ≥ 4.5:1

### i18n
- French (primary launch market)
- English (secondary)
- All user-facing strings in translation files

### Analytics
- PostHog or Mixpanel integration
- Track: trip creation, constraint submission, calculation trigger, vote cast, booking conversion
- Funnel: Create → Invite → Constraints → Calculate → Vote → Book

---

**END OF SPECIFICATION**

Build this entire system now. Do not skip any component. Do not use placeholder code. Every endpoint, every component, every algorithm must be fully implemented and functional.
