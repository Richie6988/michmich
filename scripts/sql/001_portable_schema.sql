-- ============================================================
-- BARRY — Portable Schema (no PostGIS dependency)
-- Uses DOUBLE PRECISION lat/lng instead of GEOGRAPHY type
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
DO $$ BEGIN
  CREATE TYPE transport_mode AS ENUM ('walk','bike','transit','car','train','flight');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE trip_type AS ENUM ('dinner','weekend','evg','evjf','family','corporate','custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('draft','inviting','constraints','calculating','voting','booked','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE participant_status AS ENUM ('invited','accepted','declined','constraints_set','voted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE venue_category AS ENUM ('restaurant','bar','hotel','activity','museum','park','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_type AS ENUM ('restaurant','hotel','train','activity','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending','confirmed','cancelled','refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','completed','failed','refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('invite','constraint_reminder','vote_start','vote_reminder','booking_confirmed','trip_update','system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free','pro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  avatar_url      TEXT,
  phone           VARCHAR(20),
  locale          VARCHAR(5) DEFAULT 'fr',
  default_transport_mode  transport_mode DEFAULT 'transit',
  default_time_weight     DECIMAL(3,2) DEFAULT 0.50,
  default_money_weight    DECIMAL(3,2) DEFAULT 0.50,
  home_lat        DOUBLE PRECISION,
  home_lng        DOUBLE PRECISION,
  subscription_tier       subscription_tier DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  google_id       VARCHAR(255) UNIQUE,
  apple_id        VARCHAR(255) UNIQUE,
  facebook_id     VARCHAR(255) UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- TRIPS
CREATE TABLE IF NOT EXISTS trips (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  organizer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_type         trip_type DEFAULT 'custom',
  status            trip_status DEFAULT 'draft',
  scheduled_at      TIMESTAMPTZ,
  stealth_mode      BOOLEAN DEFAULT FALSE,
  stealth_hidden_users UUID[] DEFAULT '{}',
  max_time_budget   INTEGER,
  max_money_budget  DECIMAL(10,2),
  selected_venue_id UUID,
  equity_zone_lat   DOUBLE PRECISION,
  equity_zone_lng   DOUBLE PRECISION,
  invite_token      VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- TRIP PARTICIPANTS
CREATE TABLE IF NOT EXISTS trip_participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            participant_status DEFAULT 'invited',
  transport_mode    transport_mode,
  time_weight       DECIMAL(3,2) DEFAULT 0.50,
  money_weight      DECIMAL(3,2) DEFAULT 0.50,
  max_time          INTEGER,
  max_money         DECIMAL(10,2),
  origin_lat        DOUBLE PRECISION,
  origin_lng        DOUBLE PRECISION,
  origin_label      VARCHAR(255),
  burden_score      DECIMAL(10,4),
  route_duration    INTEGER,
  route_distance    INTEGER,
  route_cost        DECIMAL(10,2),
  vote_venue_id     UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- VENUES
CREATE TABLE IF NOT EXISTS venues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  category          venue_category DEFAULT 'other',
  lat               DOUBLE PRECISION NOT NULL,
  lng               DOUBLE PRECISION NOT NULL,
  address           JSONB DEFAULT '{}',
  description       TEXT,
  price_level       INTEGER CHECK (price_level BETWEEN 1 AND 4),
  rating            DECIMAL(2,1) CHECK (rating BETWEEN 0 AND 5),
  phone             VARCHAR(20),
  website           TEXT,
  opening_hours     JSONB DEFAULT '{}',
  accessibility     JSONB DEFAULT '{}',
  external_ids      JSONB DEFAULT '{}',
  photos            TEXT[] DEFAULT '{}',
  cover_photo_url   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk_trips_selected_venue;
ALTER TABLE trips ADD CONSTRAINT fk_trips_selected_venue
  FOREIGN KEY (selected_venue_id) REFERENCES venues(id) ON DELETE SET NULL;

ALTER TABLE trip_participants DROP CONSTRAINT IF EXISTS fk_participants_vote_venue;
ALTER TABLE trip_participants ADD CONSTRAINT fk_participants_vote_venue
  FOREIGN KEY (vote_venue_id) REFERENCES venues(id) ON DELETE SET NULL;

-- EQUITY ZONES
CREATE TABLE IF NOT EXISTS equity_zones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  center_lat        DOUBLE PRECISION NOT NULL,
  center_lng        DOUBLE PRECISION NOT NULL,
  label             VARCHAR(255),
  equity_score      DECIMAL(5,2) NOT NULL,
  max_burden        DECIMAL(10,4) NOT NULL,
  mean_burden       DECIMAL(10,4) NOT NULL,
  std_dev_burden    DECIMAL(10,4) NOT NULL,
  burdens           JSONB NOT NULL DEFAULT '{}',
  rank              INTEGER NOT NULL,
  is_selected       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  venue_id            UUID REFERENCES venues(id),
  booking_type        booking_type DEFAULT 'other',
  external_booking_id VARCHAR(255),
  provider            VARCHAR(100),
  total_amount        DECIMAL(10,2),
  currency            VARCHAR(3) DEFAULT 'EUR',
  status              booking_status DEFAULT 'pending',
  booking_data        JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id              UUID REFERENCES bookings(id) ON DELETE CASCADE,
  payer_id                UUID NOT NULL REFERENCES users(id),
  amount                  DECIMAL(10,2) NOT NULL,
  currency                VARCHAR(3) DEFAULT 'EUR',
  status                  payment_status DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- REFRESH TOKENS
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_trips_organizer ON trips (organizer_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);
CREATE INDEX IF NOT EXISTS idx_trips_invite_token ON trips (invite_token);
CREATE INDEX IF NOT EXISTS idx_participants_trip ON trip_participants (trip_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON trip_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues (category);
CREATE INDEX IF NOT EXISTS idx_equity_zones_trip ON equity_zones (trip_id, rank);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings (trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON trip_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;
