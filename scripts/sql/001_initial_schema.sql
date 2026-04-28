-- ============================================================
-- BARRY — Initial Database Schema
-- PostgreSQL 15 + PostGIS 3.4
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE transport_mode AS ENUM (
  'walk', 'bike', 'transit', 'car', 'train', 'flight'
);

CREATE TYPE trip_type AS ENUM (
  'dinner', 'weekend', 'evg', 'evjf', 'family', 'corporate', 'custom'
);

CREATE TYPE trip_status AS ENUM (
  'draft', 'inviting', 'constraints', 'calculating', 'voting', 'booked', 'completed', 'cancelled'
);

CREATE TYPE participant_status AS ENUM (
  'invited', 'accepted', 'declined', 'constraints_set', 'voted'
);

CREATE TYPE venue_category AS ENUM (
  'restaurant', 'bar', 'hotel', 'activity', 'museum', 'park', 'other'
);

CREATE TYPE booking_type AS ENUM (
  'restaurant', 'hotel', 'train', 'activity', 'other'
);

CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'cancelled', 'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'completed', 'failed', 'refunded'
);

CREATE TYPE notification_type AS ENUM (
  'invite', 'constraint_reminder', 'vote_start', 'vote_reminder',
  'booking_confirmed', 'trip_update', 'system'
);

CREATE TYPE subscription_tier AS ENUM (
  'free', 'pro'
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),  -- NULL for OAuth-only users
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  avatar_url      TEXT,
  phone           VARCHAR(20),
  locale          VARCHAR(5) DEFAULT 'fr',

  -- Default preferences
  default_transport_mode  transport_mode DEFAULT 'transit',
  default_time_weight     DECIMAL(3,2) DEFAULT 0.50 CHECK (default_time_weight BETWEEN 0 AND 1),
  default_money_weight    DECIMAL(3,2) DEFAULT 0.50 CHECK (default_money_weight BETWEEN 0 AND 1),
  home_location           GEOGRAPHY(POINT, 4326),

  -- Subscription
  subscription_tier       subscription_tier DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,

  -- OAuth
  google_id       VARCHAR(255) UNIQUE,
  apple_id        VARCHAR(255) UNIQUE,
  facebook_id     VARCHAR(255) UNIQUE,

  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- ============================================================
-- TRIPS
-- ============================================================

CREATE TABLE trips (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  organizer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_type         trip_type DEFAULT 'custom',
  status            trip_status DEFAULT 'draft',
  scheduled_at      TIMESTAMPTZ,

  -- Stealth mode (EVG/EVJF)
  stealth_mode      BOOLEAN DEFAULT FALSE,
  stealth_hidden_users UUID[] DEFAULT '{}',

  -- Global constraints
  max_time_budget   INTEGER,          -- minutes, NULL = unlimited
  max_money_budget  DECIMAL(10,2),    -- euros, NULL = unlimited

  -- Results
  selected_venue_id UUID,             -- FK added after venues table
  equity_zone       GEOGRAPHY(POLYGON, 4326),

  -- Invite
  invite_token      VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Metadata
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIP PARTICIPANTS
-- ============================================================

CREATE TABLE trip_participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            participant_status DEFAULT 'invited',

  -- Individual constraints
  transport_mode    transport_mode,
  time_weight       DECIMAL(3,2) DEFAULT 0.50 CHECK (time_weight BETWEEN 0 AND 1),
  money_weight      DECIMAL(3,2) DEFAULT 0.50 CHECK (money_weight BETWEEN 0 AND 1),
  max_time          INTEGER,          -- minutes
  max_money         DECIMAL(10,2),    -- euros
  origin_location   GEOGRAPHY(POINT, 4326),
  origin_label      VARCHAR(255),     -- "Home", "Work", custom label

  -- Calculated results
  burden_score      DECIMAL(10,4),
  route_geometry    GEOGRAPHY(LINESTRING, 4326),
  route_duration    INTEGER,          -- seconds
  route_distance    INTEGER,          -- meters
  route_cost        DECIMAL(10,2),    -- euros

  -- Vote
  vote_venue_id     UUID,             -- FK added after venues table

  -- Metadata
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(trip_id, user_id)
);

-- ============================================================
-- VENUES
-- ============================================================

CREATE TABLE venues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  category          venue_category DEFAULT 'other',
  location          GEOGRAPHY(POINT, 4326) NOT NULL,
  address           JSONB DEFAULT '{}',
  description       TEXT,

  -- Details
  price_level       INTEGER CHECK (price_level BETWEEN 1 AND 4),
  rating            DECIMAL(2,1) CHECK (rating BETWEEN 0 AND 5),
  phone             VARCHAR(20),
  website           TEXT,
  opening_hours     JSONB DEFAULT '{}',

  -- Accessibility
  accessibility     JSONB DEFAULT '{}',  -- { wheelchair: true, elevator: true, ... }

  -- External IDs for booking
  external_ids      JSONB DEFAULT '{}',  -- { thefork_id: "...", booking_com_id: "..." }

  -- Media
  photos            TEXT[] DEFAULT '{}',
  cover_photo_url   TEXT,

  -- Metadata
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK references now that venues exists
ALTER TABLE trips
  ADD CONSTRAINT fk_trips_selected_venue
  FOREIGN KEY (selected_venue_id) REFERENCES venues(id) ON DELETE SET NULL;

ALTER TABLE trip_participants
  ADD CONSTRAINT fk_participants_vote_venue
  FOREIGN KEY (vote_venue_id) REFERENCES venues(id) ON DELETE SET NULL;

-- ============================================================
-- EQUITY ZONES (calculation results)
-- ============================================================

CREATE TABLE equity_zones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  zone_geometry     GEOGRAPHY(POLYGON, 4326) NOT NULL,
  center            GEOGRAPHY(POINT, 4326) NOT NULL,
  label             VARCHAR(255),     -- "Le Marais", "Bastille", etc.

  -- Scores
  equity_score      DECIMAL(5,2) NOT NULL,
  max_burden        DECIMAL(10,4) NOT NULL,
  mean_burden       DECIMAL(10,4) NOT NULL,
  std_dev_burden    DECIMAL(10,4) NOT NULL,

  -- Per-participant burdens
  burdens           JSONB NOT NULL DEFAULT '{}',  -- { "user_id": burden_value }

  -- Ranking
  rank              INTEGER NOT NULL,
  is_selected       BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS (Phase 3B — tables created now for schema stability)
-- ============================================================

CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  venue_id            UUID REFERENCES venues(id),
  booking_type        booking_type DEFAULT 'other',
  external_booking_id VARCHAR(255),
  provider            VARCHAR(100),     -- "thefork", "booking_com", "sncf"
  total_amount        DECIMAL(10,2),
  currency            VARCHAR(3) DEFAULT 'EUR',
  status              booking_status DEFAULT 'pending',
  booking_data        JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS (Phase 3B)
-- ============================================================

CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id              UUID REFERENCES bookings(id) ON DELETE CASCADE,
  payer_id                UUID NOT NULL REFERENCES users(id),
  amount                  DECIMAL(10,2) NOT NULL,
  currency                VARCHAR(3) DEFAULT 'EUR',
  status                  payment_status DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFRESH TOKENS (auth)
-- ============================================================

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Spatial indexes (GIST)
CREATE INDEX idx_users_home_location ON users USING GIST (home_location);
CREATE INDEX idx_venues_location ON venues USING GIST (location);
CREATE INDEX idx_equity_zones_geometry ON equity_zones USING GIST (zone_geometry);
CREATE INDEX idx_equity_zones_center ON equity_zones USING GIST (center);
CREATE INDEX idx_trips_equity_zone ON trips USING GIST (equity_zone);
CREATE INDEX idx_participants_origin ON trip_participants USING GIST (origin_location);

-- B-tree indexes
CREATE INDEX idx_trips_organizer ON trips (organizer_id);
CREATE INDEX idx_trips_status ON trips (status);
CREATE INDEX idx_trips_invite_token ON trips (invite_token);
CREATE INDEX idx_participants_trip ON trip_participants (trip_id);
CREATE INDEX idx_participants_user ON trip_participants (user_id);
CREATE INDEX idx_participants_trip_user ON trip_participants (trip_id, user_id);
CREATE INDEX idx_venues_category ON venues (category);
CREATE INDEX idx_venues_price_level ON venues (price_level);
CREATE INDEX idx_venues_category_price ON venues (category, price_level);
CREATE INDEX idx_equity_zones_trip ON equity_zones (trip_id);
CREATE INDEX idx_equity_zones_trip_rank ON equity_zones (trip_id, rank);
CREATE INDEX idx_bookings_trip ON bookings (trip_id);
CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_payments_payer ON payments (payer_id);
CREATE INDEX idx_notifications_user ON notifications (user_id, read, created_at DESC);
CREATE INDEX idx_notifications_trip ON notifications (trip_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- Text search
CREATE INDEX idx_venues_name_trgm ON venues USING GIN (name gin_trgm_ops);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_participants_updated_at
  BEFORE UPDATE ON trip_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
