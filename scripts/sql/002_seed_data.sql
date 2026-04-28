-- ============================================================
-- BARRY — Seed Data (Development)
-- 5 users (personas), 3 trips, 10 venues in Paris
-- ============================================================

-- ============================================================
-- USERS (our 5 personas)
-- Password: "barry2026" hashed with argon2 (placeholder hash for dev)
-- ============================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, locale, default_transport_mode, default_time_weight, default_money_weight, home_location) VALUES
  -- Chloé — Montmartre
  ('a1000000-0000-0000-0000-000000000001', 'chloe@test.barry', '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_chloe', 'Chloé', 'Dubois', 'fr', 'transit', 0.60, 0.40, ST_GeogFromText('SRID=4326;POINT(2.3399 48.8867)')),
  -- Tom — Villeurbanne (Lyon area, but for Paris prototype we place him in 18th)
  ('a1000000-0000-0000-0000-000000000002', 'tom@test.barry', '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_tom', 'Tom', 'Petit', 'fr', 'transit', 0.30, 0.70, ST_GeogFromText('SRID=4326;POINT(2.3522 48.8915)')),
  -- Marc — République
  ('a1000000-0000-0000-0000-000000000003', 'marc@test.barry', '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_marc', 'Marc', 'Laurent', 'fr', 'bike', 0.50, 0.50, ST_GeogFromText('SRID=4326;POINT(2.3633 48.8675)')),
  -- Sarah — Bastille
  ('a1000000-0000-0000-0000-000000000004', 'sarah@test.barry', '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_sarah', 'Sarah', 'Martin', 'fr', 'transit', 0.70, 0.30, ST_GeogFromText('SRID=4326;POINT(2.3693 48.8532)')),
  -- Isabelle — 15th arrondissement
  ('a1000000-0000-0000-0000-000000000005', 'isabelle@test.barry', '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_isabelle', 'Isabelle', 'Bernard', 'fr', 'car', 0.50, 0.50, ST_GeogFromText('SRID=4326;POINT(2.2945 48.8421)'));

-- ============================================================
-- VENUES (10 real-ish Paris venues)
-- ============================================================

INSERT INTO venues (id, name, category, location, address, price_level, rating, photos, cover_photo_url) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Le Bouillon Chartier', 'restaurant',
    ST_GeogFromText('SRID=4326;POINT(2.3449 48.8724)'),
    '{"street": "7 Rue du Faubourg Montmartre", "city": "Paris", "zip": "75009", "country": "FR"}',
    1, 4.2, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000002', 'Chez Janou', 'restaurant',
    ST_GeogFromText('SRID=4326;POINT(2.3651 48.8571)'),
    '{"street": "2 Rue Roger Verlomme", "city": "Paris", "zip": "75003", "country": "FR"}',
    2, 4.4, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000003', 'Le Marché des Enfants Rouges', 'restaurant',
    ST_GeogFromText('SRID=4326;POINT(2.3627 48.8638)'),
    '{"street": "39 Rue de Bretagne", "city": "Paris", "zip": "75003", "country": "FR"}',
    2, 4.3, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000004', 'Le Perchoir Marais', 'bar',
    ST_GeogFromText('SRID=4326;POINT(2.3588 48.8643)'),
    '{"street": "33 Rue de la Verrerie", "city": "Paris", "zip": "75004", "country": "FR"}',
    3, 4.1, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000005', 'Candelaria', 'bar',
    ST_GeogFromText('SRID=4326;POINT(2.3647 48.8630)'),
    '{"street": "52 Rue de Saintonge", "city": "Paris", "zip": "75003", "country": "FR"}',
    2, 4.5, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000006', 'Musée Carnavalet', 'museum',
    ST_GeogFromText('SRID=4326;POINT(2.3621 48.8575)'),
    '{"street": "23 Rue de Sévigné", "city": "Paris", "zip": "75003", "country": "FR"}',
    1, 4.6, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000007', 'Place des Vosges', 'park',
    ST_GeogFromText('SRID=4326;POINT(2.3655 48.8557)'),
    '{"street": "Place des Vosges", "city": "Paris", "zip": "75004", "country": "FR"}',
    1, 4.8, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000008', 'Hôtel du Petit Moulin', 'hotel',
    ST_GeogFromText('SRID=4326;POINT(2.3618 48.8638)'),
    '{"street": "29/31 Rue du Poitou", "city": "Paris", "zip": "75003", "country": "FR"}',
    3, 4.3, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000009', 'Escape Hunt Paris', 'activity',
    ST_GeogFromText('SRID=4326;POINT(2.3480 48.8706)'),
    '{"street": "44 Rue Richer", "city": "Paris", "zip": "75009", "country": "FR"}',
    2, 4.4, '{}', NULL),

  ('b1000000-0000-0000-0000-000000000010', 'Breizh Café', 'restaurant',
    ST_GeogFromText('SRID=4326;POINT(2.3610 48.8611)'),
    '{"street": "109 Rue Vieille du Temple", "city": "Paris", "zip": "75003", "country": "FR"}',
    2, 4.3, '{}', NULL);

-- ============================================================
-- TRIPS (3 test trips)
-- ============================================================

-- Trip 1: Dinner Friday (Chloé organizes, all 5 participate)
INSERT INTO trips (id, name, description, organizer_id, trip_type, status, scheduled_at) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Dinner Friday',
   'Casual dinner with the crew. Barry will find the fairest spot!',
   'a1000000-0000-0000-0000-000000000001', 'dinner', 'constraints',
   NOW() + INTERVAL '3 days');

INSERT INTO trip_participants (trip_id, user_id, status, transport_mode, time_weight, money_weight, max_time, max_money, origin_location, origin_label) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'constraints_set', 'transit', 0.60, 0.40, 45, 5.00, ST_GeogFromText('SRID=4326;POINT(2.3399 48.8867)'), 'Montmartre'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'constraints_set', 'transit', 0.30, 0.70, 40, 3.00, ST_GeogFromText('SRID=4326;POINT(2.3522 48.8915)'), 'Porte de Clignancourt'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'constraints_set', 'bike', 0.50, 0.50, 30, NULL, ST_GeogFromText('SRID=4326;POINT(2.3633 48.8675)'), 'République'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'accepted', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 'invited', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Trip 2: Weekend at Barry's (Sarah organizes, draft state)
INSERT INTO trips (id, name, description, organizer_id, trip_type, status, scheduled_at) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'Weekend at Barry''s',
   'A weekend getaway. Let Barry find the perfect city!',
   'a1000000-0000-0000-0000-000000000004', 'weekend', 'draft',
   NOW() + INTERVAL '14 days');

INSERT INTO trip_participants (trip_id, user_id, status) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'accepted');

-- Trip 3: EVG Marc (stealth mode, voting state)
INSERT INTO trips (id, name, description, organizer_id, trip_type, status, stealth_mode, stealth_hidden_users, scheduled_at) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'EVG Surprise',
   'Bachelor party for Marc! Stealth mode ON.',
   'a1000000-0000-0000-0000-000000000001', 'evg', 'voting',
   TRUE, ARRAY['a1000000-0000-0000-0000-000000000003']::UUID[],
   NOW() + INTERVAL '30 days');

INSERT INTO trip_participants (trip_id, user_id, status, transport_mode, time_weight, money_weight, max_time, max_money, origin_location, origin_label) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'voted', 'transit', 0.50, 0.50, 60, 15.00, ST_GeogFromText('SRID=4326;POINT(2.3399 48.8867)'), 'Montmartre'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'voted', 'transit', 0.30, 0.70, 45, 8.00, ST_GeogFromText('SRID=4326;POINT(2.3522 48.8915)'), '18th'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'constraints_set', 'car', 0.70, 0.30, 90, 25.00, ST_GeogFromText('SRID=4326;POINT(2.3693 48.8532)'), 'Bastille'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'constraints_set', 'car', 0.50, 0.50, 90, 20.00, ST_GeogFromText('SRID=4326;POINT(2.2945 48.8421)'), '15th');
