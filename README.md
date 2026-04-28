# Barry

> **Barry knows where.** — Find the fairest meeting point for your group.

Barry is a social-mobility intelligence platform that algorithmically finds the optimal, equitable meeting point for any group — based on each participant's location, budget, time constraints, and transport mode.

## Quick Start (Local Development)

### Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop/)
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/Richie6988/michmich.git barry
cd barry
cp .env.example .env
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL + PostGIS and Redis
docker compose up -d

# Verify services are running
docker compose ps
```

You should see `barry-postgres` and `barry-redis` running.

The database is auto-seeded on first run with:
- 5 test users (Chloe, Tom, Marc, Sarah, Isabelle)
- 3 sample trips
- 10 venues in Paris

### 3. Start the Equity Engine (Python)

```bash
cd services/equity-engine
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Test it: http://localhost:8000/health

### 4. Start the Web App (Next.js)

```bash
# In a new terminal, from the root
cd apps/web
npm run dev
```

Open: **http://localhost:3000**

### 5. (Optional) Start the API (NestJS)

```bash
cd apps/api
npm run dev
```

API: http://localhost:3001
Swagger: http://localhost:3001/api/docs

## Architecture

```
barry/
├── apps/
│   ├── web/          → Next.js 14 PWA (main UI)
│   ├── mobile/       → Expo React Native (iOS + Android)
│   └── api/          → NestJS backend
├── services/
│   └── equity-engine/ → FastAPI Python (minimax optimizer)
├── packages/
│   ├── shared-types/  → TypeScript interfaces
│   ├── i18n/          → FR + EN translations
│   └── eslint-config/ → Shared ESLint rules
└── insights/          → Design docs, personas, wireframes
```

## Test Users (Prototype)

| User | Email | Location | Default Mode |
|------|-------|----------|--------------|
| Chloe | chloe@test.barry | Montmartre | Metro |
| Tom | tom@test.barry | Clignancourt | Metro |
| Marc | marc@test.barry | Republique | Bike |
| Sarah | sarah@test.barry | Bastille | Metro |
| Isabelle | isabelle@test.barry | 15th | Car |

Password for all: `barry2026`

## User Flow

```
Login → Home (trip list) → Create Trip → Invite friends →
Set Constraints → Barry calculates equity zones →
Equity Map (3 zones) → Group Vote (swipe cards) →
Itinerary (route + booking)
```

## Equity Engine API

```bash
# Calculate equity zones
curl -X POST http://localhost:8000/api/v1/equity/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "test",
    "participants": [
      {"id": "u1", "origin": {"lat": 48.8867, "lng": 2.3399}, "mode": "transit", "max_time": 45},
      {"id": "u2", "origin": {"lat": 48.8675, "lng": 2.3633}, "mode": "bike", "max_time": 30},
      {"id": "u3", "origin": {"lat": 48.8532, "lng": 2.3693}, "mode": "transit", "max_time": 40}
    ]
  }'
```

## Design Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Barry Blue | `#2563EB` | Primary brand |
| Barry Coral | `#F97316` | CTAs, accent |
| Barry Green | `#10B981` | Success, equity zones |
| Barry Grey | `#64748B` | Secondary text |

## License

Private — All rights reserved.
