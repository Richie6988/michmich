-- BARRY — Seed Data (Portable, no PostGIS)

INSERT INTO users (id, email, password_hash, first_name, last_name, locale, default_transport_mode, default_time_weight, default_money_weight, home_lat, home_lng) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'chloe@test.barry', '$argon2id$placeholder_chloe', 'Chloe', 'Dubois', 'fr', 'transit', 0.60, 0.40, 48.8867, 2.3399),
  ('a1000000-0000-0000-0000-000000000002', 'tom@test.barry', '$argon2id$placeholder_tom', 'Tom', 'Petit', 'fr', 'transit', 0.30, 0.70, 48.8915, 2.3522),
  ('a1000000-0000-0000-0000-000000000003', 'marc@test.barry', '$argon2id$placeholder_marc', 'Marc', 'Laurent', 'fr', 'bike', 0.50, 0.50, 48.8675, 2.3633),
  ('a1000000-0000-0000-0000-000000000004', 'sarah@test.barry', '$argon2id$placeholder_sarah', 'Sarah', 'Martin', 'fr', 'transit', 0.70, 0.30, 48.8532, 2.3693),
  ('a1000000-0000-0000-0000-000000000005', 'isabelle@test.barry', '$argon2id$placeholder_isabelle', 'Isabelle', 'Bernard', 'fr', 'car', 0.50, 0.50, 48.8421, 2.2945)
ON CONFLICT (id) DO NOTHING;

INSERT INTO venues (id, name, category, lat, lng, address, price_level, rating) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Le Bouillon Chartier', 'restaurant', 48.8724, 2.3449, '{"street":"7 Rue du Faubourg Montmartre","city":"Paris","zip":"75009"}', 1, 4.2),
  ('b1000000-0000-0000-0000-000000000002', 'Chez Janou', 'restaurant', 48.8571, 2.3651, '{"street":"2 Rue Roger Verlomme","city":"Paris","zip":"75003"}', 2, 4.4),
  ('b1000000-0000-0000-0000-000000000003', 'Marche des Enfants Rouges', 'restaurant', 48.8638, 2.3627, '{"street":"39 Rue de Bretagne","city":"Paris","zip":"75003"}', 2, 4.3),
  ('b1000000-0000-0000-0000-000000000004', 'Le Perchoir Marais', 'bar', 48.8643, 2.3588, '{"street":"33 Rue de la Verrerie","city":"Paris","zip":"75004"}', 3, 4.1),
  ('b1000000-0000-0000-0000-000000000005', 'Candelaria', 'bar', 48.8630, 2.3647, '{"street":"52 Rue de Saintonge","city":"Paris","zip":"75003"}', 2, 4.5),
  ('b1000000-0000-0000-0000-000000000006', 'Musee Carnavalet', 'museum', 48.8575, 2.3621, '{"street":"23 Rue de Sevigne","city":"Paris","zip":"75003"}', 1, 4.6),
  ('b1000000-0000-0000-0000-000000000007', 'Place des Vosges', 'park', 48.8557, 2.3655, '{"street":"Place des Vosges","city":"Paris","zip":"75004"}', 1, 4.8),
  ('b1000000-0000-0000-0000-000000000008', 'Hotel du Petit Moulin', 'hotel', 48.8638, 2.3618, '{"street":"29 Rue du Poitou","city":"Paris","zip":"75003"}', 3, 4.3),
  ('b1000000-0000-0000-0000-000000000009', 'Escape Hunt Paris', 'activity', 48.8706, 2.3480, '{"street":"44 Rue Richer","city":"Paris","zip":"75009"}', 2, 4.4),
  ('b1000000-0000-0000-0000-000000000010', 'Breizh Cafe', 'restaurant', 48.8611, 2.3610, '{"street":"109 Rue Vieille du Temple","city":"Paris","zip":"75003"}', 2, 4.3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO trips (id, name, description, organizer_id, trip_type, status, scheduled_at) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Diner Vendredi', 'Casual dinner with the crew!', 'a1000000-0000-0000-0000-000000000001', 'dinner', 'constraints', NOW() + INTERVAL '3 days'),
  ('c1000000-0000-0000-0000-000000000002', 'Weekend at Barry''s', 'Un weekend entre potes!', 'a1000000-0000-0000-0000-000000000004', 'weekend', 'draft', NOW() + INTERVAL '14 days'),
  ('c1000000-0000-0000-0000-000000000003', 'EVG Surprise', 'Bachelor party — stealth mode!', 'a1000000-0000-0000-0000-000000000001', 'evg', 'voting', NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

UPDATE trips SET stealth_mode = TRUE, stealth_hidden_users = ARRAY['a1000000-0000-0000-0000-000000000003']::UUID[] WHERE id = 'c1000000-0000-0000-0000-000000000003';

INSERT INTO trip_participants (trip_id, user_id, status, transport_mode, time_weight, money_weight, max_time, max_money, origin_lat, origin_lng, origin_label) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'constraints_set', 'transit', 0.60, 0.40, 45, 5.00, 48.8867, 2.3399, 'Montmartre'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'constraints_set', 'transit', 0.30, 0.70, 40, 3.00, 48.8915, 2.3522, 'Clignancourt'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'constraints_set', 'bike', 0.50, 0.50, 30, NULL, 48.8675, 2.3633, 'Republique'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'accepted', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'accepted', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'voted', 'transit', 0.50, 0.50, 60, 15.00, 48.8867, 2.3399, 'Montmartre'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'voted', 'transit', 0.30, 0.70, 45, 8.00, 48.8915, 2.3522, '18th'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'constraints_set', 'car', 0.70, 0.30, 90, 25.00, 48.8532, 2.3693, 'Bastille'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'constraints_set', 'car', 0.50, 0.50, 90, 20.00, 48.8421, 2.2945, '15th')
ON CONFLICT DO NOTHING;
