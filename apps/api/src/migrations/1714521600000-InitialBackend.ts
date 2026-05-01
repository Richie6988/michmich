import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial backend schema — created from TypeORM entities.
 *
 * Tables: users, trips, trip_participants, trip_tasks, trip_photos,
 * votes, date_polls, date_poll_options, equity_zones, trip_pins,
 * venues, trip_accommodations, funds_requests, funds_contributions,
 * reservations, transport_legs, notifications, push_subscriptions
 *
 * Requires PostGIS for geography(POINT,4326). Make sure
 *   CREATE EXTENSION IF NOT EXISTS postgis;
 * has been run on the database (handled by 001_initial_schema.sql or here).
 */
export class InitialBackend1714521600000 implements MigrationInterface {
  name = 'InitialBackend1714521600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostGIS + UUID
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    // ============================================================
    // USERS
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE transport_mode AS ENUM ('walk', 'bike', 'transit', 'car', 'train', 'flight');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email                    VARCHAR(255) UNIQUE NOT NULL,
        password_hash            VARCHAR(255),
        first_name               VARCHAR(100) NOT NULL,
        last_name                VARCHAR(100) NOT NULL,
        avatar_url               TEXT,
        phone                    VARCHAR(20),
        locale                   VARCHAR(5) DEFAULT 'en',
        default_transport_mode   transport_mode DEFAULT 'transit',
        default_time_weight      DECIMAL(3,2) DEFAULT 0.50,
        default_money_weight     DECIMAL(3,2) DEFAULT 0.50,
        home_location            geography(POINT, 4326),
        home_label               TEXT,
        subscription_tier        subscription_tier DEFAULT 'free',
        subscription_expires_at  TIMESTAMPTZ,
        google_id                VARCHAR(255),
        apple_id                 VARCHAR(255),
        default_max_time         INT,
        default_max_time_unit    VARCHAR(10),
        default_max_budget       DECIMAL(10,2),
        default_max_budget_currency VARCHAR(3),
        default_email            VARCHAR(255),
        default_self_book        BOOLEAN DEFAULT false,
        default_reduction_cards  JSONB DEFAULT '[]'::jsonb,
        theme                    VARCHAR(20) DEFAULT 'auto',
        created_at               TIMESTAMPTZ DEFAULT NOW(),
        updated_at               TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`);

    // ============================================================
    // TRIPS
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE trip_type AS ENUM ('dinner','weekend','evg','evjf','family','corporate','custom');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE trip_mode AS ENUM ('wanderlust','trip');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE trip_status AS ENUM ('draft','inviting','constraints','calculating','voting','booked','completed','cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name             VARCHAR(200) NOT NULL,
        description      TEXT,
        organizer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trip_type        trip_type DEFAULT 'custom',
        mode             trip_mode DEFAULT 'wanderlust',
        status           trip_status DEFAULT 'draft',
        scheduled_at     TIMESTAMPTZ,
        end_date         TIMESTAMPTZ,
        stealth_mode     BOOLEAN DEFAULT false,
        max_time_budget  INT,
        max_money_budget DECIMAL(10,2),
        invite_token     VARCHAR(64) UNIQUE NOT NULL,
        selected_venue_id UUID,
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trips_organizer_id_idx ON trips(organizer_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);`);

    // ============================================================
    // TRIP PARTICIPANTS
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE participant_status AS ENUM ('invited','accepted','declined','constraints_set','voted');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trip_participants (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
        guest_name          VARCHAR(100),
        status              participant_status DEFAULT 'invited',
        transport_mode      transport_mode,
        time_weight         DECIMAL(3,2) DEFAULT 0.50,
        money_weight        DECIMAL(3,2) DEFAULT 0.50,
        max_time            INT,
        max_time_unit       VARCHAR(10),
        max_money           DECIMAL(10,2),
        max_money_currency  VARCHAR(3),
        email               VARCHAR(255),
        self_book           BOOLEAN DEFAULT false,
        reduction_cards     JSONB DEFAULT '[]'::jsonb,
        origin_location     geography(POINT, 4326),
        origin_label        TEXT,
        burden_score        DECIMAL(5,2),
        route_duration      INT,
        route_distance      INT,
        route_cost          DECIMAL(10,2),
        route_geometry      JSONB,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (trip_id, user_id)
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trip_participants_trip_id_idx ON trip_participants(trip_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trip_participants_user_id_idx ON trip_participants(user_id);`);

    // ============================================================
    // TASKS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trip_tasks (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        title             VARCHAR(200) NOT NULL,
        description       TEXT,
        assigned_to_id    UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_to_name  VARCHAR(100),
        created_by_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        completed         BOOLEAN DEFAULT false,
        completed_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trip_tasks_trip_id_idx ON trip_tasks(trip_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trip_tasks_assigned_to_id_idx ON trip_tasks(assigned_to_id);`);

    // ============================================================
    // PHOTOS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trip_photos (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        image_url         TEXT NOT NULL,
        caption           TEXT,
        uploaded_by_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        uploaded_by_name  VARCHAR(100),
        uploaded_at       TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trip_photos_trip_id_idx ON trip_photos(trip_id);`);

    // ============================================================
    // VOTES
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE vote_type AS ENUM ('pin','venue','accommodation','date');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE vote_response AS ENUM ('love','meh','no','yes','maybe');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote_type   vote_type NOT NULL,
        target_id   VARCHAR(100) NOT NULL,
        response    vote_response NOT NULL,
        voted_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS votes_trip_type_idx ON votes(trip_id, vote_type);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS votes_user_id_idx ON votes(user_id);`);

    // ============================================================
    // DATE POLL
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE date_poll_status AS ENUM ('open','closed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS date_polls (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id             UUID UNIQUE NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        status              date_poll_status DEFAULT 'open',
        selected_option_id  UUID,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS date_poll_options (
        id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id   UUID NOT NULL REFERENCES date_polls(id) ON DELETE CASCADE,
        date      TIMESTAMPTZ NOT NULL,
        score     INT DEFAULT 0
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS date_poll_options_poll_id_idx ON date_poll_options(poll_id);`);

    // ============================================================
    // EQUITY ZONES + PINS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equity_zones (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        label           VARCHAR(100),
        center          geography(POINT, 4326) NOT NULL,
        radius_meters   INT DEFAULT 500,
        rank            INT NOT NULL,
        equity_score    INT DEFAULT 0,
        metadata        JSONB,
        computed_at     TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS equity_zones_trip_id_idx ON equity_zones(trip_id);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trip_pins (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id     UUID UNIQUE NOT NULL,
        zone_id     UUID NOT NULL,
        locked_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ============================================================
    // VENUES + ACCOMMODATIONS
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE venue_category AS ENUM ('restaurant','bar','hotel','activity','museum','park','other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        osm_id      VARCHAR(100) UNIQUE,
        name        VARCHAR(200) NOT NULL,
        category    venue_category NOT NULL,
        location    geography(POINT, 4326) NOT NULL,
        address     TEXT,
        price       INT,
        rating      DECIMAL(3,1),
        image_url   TEXT,
        metadata    JSONB,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS venues_location_idx ON venues USING GIST(location);`);

    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE accommodation_type AS ENUM ('hotel','bnb','airbnb','hostel');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trip_accommodations (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        type              accommodation_type DEFAULT 'hotel',
        name              VARCHAR(200) NOT NULL,
        price_per_night   DECIMAL(10,2) NOT NULL,
        nights            INT DEFAULT 1,
        total_price       DECIMAL(10,2) NOT NULL,
        rooms             INT DEFAULT 1,
        rating            DECIMAL(3,1),
        image_url         TEXT,
        selected          BOOLEAN DEFAULT false,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS trip_accommodations_trip_id_idx ON trip_accommodations(trip_id);`);

    // ============================================================
    // FUNDS + RESERVATIONS + TRANSPORT
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE funds_status AS ENUM ('collecting','complete','cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE contribution_status AS ENUM ('pending','paid','refunded');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE reservation_type AS ENUM ('venue','accommodation','transport');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE reservation_status AS ENUM ('pending','confirmed','cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS funds_requests (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id       UUID UNIQUE NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        total_amount  DECIMAL(10,2) NOT NULL,
        currency      VARCHAR(3) DEFAULT 'EUR',
        status        funds_status DEFAULT 'collecting',
        breakdown     JSONB NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS funds_contributions (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id        UUID NOT NULL REFERENCES funds_requests(id) ON DELETE CASCADE,
        user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name         VARCHAR(100),
        amount            DECIMAL(10,2) NOT NULL,
        status            contribution_status DEFAULT 'pending',
        paid_at           TIMESTAMPTZ,
        payment_reference VARCHAR(200),
        used_balance      BOOLEAN DEFAULT false,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS funds_contributions_request_id_idx ON funds_contributions(request_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS funds_contributions_user_id_idx ON funds_contributions(user_id);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        type                reservation_type NOT NULL,
        reference           VARCHAR(200) NOT NULL,
        description         TEXT NOT NULL,
        amount              DECIMAL(10,2) NOT NULL,
        status              reservation_status DEFAULT 'pending',
        confirmation_code   VARCHAR(100),
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS reservations_trip_id_idx ON reservations(trip_id);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS transport_legs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mode        transport_mode NOT NULL,
        duration    INT,
        distance    INT,
        cost        DECIMAL(10,2) DEFAULT 0,
        geometry    JSONB,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS transport_legs_trip_id_idx ON transport_legs(trip_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS transport_legs_user_id_idx ON transport_legs(user_id);`);

    // ============================================================
    // NOTIFICATIONS + PUSH SUBSCRIPTIONS
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE notification_type AS ENUM (
        'invite','constraint_reminder','vote_start','vote_reminder',
        'booking_confirmed','trip_update','system',
        'poll_vote','new_task','task_added','funding_milestone','new_message'
      );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type        notification_type NOT NULL,
        title       VARCHAR(200) NOT NULL,
        body        TEXT NOT NULL,
        trip_id     UUID,
        url         VARCHAR(500),
        read        BOOLEAN DEFAULT false,
        read_at     TIMESTAMPTZ,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint    VARCHAR(500) NOT NULL,
        p256dh      VARCHAR(200) NOT NULL,
        auth        VARCHAR(200) NOT NULL,
        user_agent  VARCHAR(500),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse FK order
    await queryRunner.query(`DROP TABLE IF EXISTS push_subscriptions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications;`);
    await queryRunner.query(`DROP TABLE IF EXISTS transport_legs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS reservations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS funds_contributions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS funds_requests;`);
    await queryRunner.query(`DROP TABLE IF EXISTS trip_accommodations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS venues;`);
    await queryRunner.query(`DROP TABLE IF EXISTS trip_pins;`);
    await queryRunner.query(`DROP TABLE IF EXISTS equity_zones;`);
    await queryRunner.query(`DROP TABLE IF EXISTS date_poll_options;`);
    await queryRunner.query(`DROP TABLE IF EXISTS date_polls;`);
    await queryRunner.query(`DROP TABLE IF EXISTS votes;`);
    await queryRunner.query(`DROP TABLE IF EXISTS trip_photos;`);
    await queryRunner.query(`DROP TABLE IF EXISTS trip_tasks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS trip_participants;`);
    await queryRunner.query(`DROP TABLE IF EXISTS trips;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS notification_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS reservation_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS reservation_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS contribution_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS funds_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS accommodation_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS venue_category;`);
    await queryRunner.query(`DROP TYPE IF EXISTS date_poll_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS vote_response;`);
    await queryRunner.query(`DROP TYPE IF EXISTS vote_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS participant_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS trip_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS trip_mode;`);
    await queryRunner.query(`DROP TYPE IF EXISTS trip_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_tier;`);
    await queryRunner.query(`DROP TYPE IF EXISTS transport_mode;`);
  }
}
