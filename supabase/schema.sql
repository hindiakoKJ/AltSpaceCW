-- ============================================================
-- AltSpaceCW – Supabase Schema  (complete rewrite)
-- Run once in: Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text        NOT NULL DEFAULT '',
  email      text        UNIQUE,
  role       text        NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  plan       text        NOT NULL DEFAULT 'day-pass',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "admins_read_all_profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ── spaces ───────────────────────────────────────────────────
-- Text PKs (e.g. "HD-01") match the app's space ID convention.
CREATE TABLE IF NOT EXISTS spaces (
  id         text          PRIMARY KEY,
  label      text          NOT NULL,
  type       text          NOT NULL CHECK (type IN ('hot', 'dedicated', 'room')),
  zone       text          NOT NULL DEFAULT '',
  price      numeric(10,2) NOT NULL DEFAULT 0,   -- day rate (₱)
  hourly     numeric(10,2) NOT NULL DEFAULT 0,   -- hourly rate (₱)
  capacity   int,
  is_active  boolean       NOT NULL DEFAULT true,
  sort_order int           NOT NULL DEFAULT 0
);

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_active_spaces"
  ON spaces FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "admins_manage_spaces"
  ON spaces FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ── bookings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  space_id   text          NOT NULL REFERENCES spaces(id),
  date       date          NOT NULL,
  start_hour int           NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour   int           NOT NULL CHECK (end_hour >= 1  AND end_hour <= 24),
  price      numeric(10,2) NOT NULL DEFAULT 0,
  status     text          NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'cancelled')),
  notes      text,
  created_at timestamptz   DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_hour > start_hour)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_bookings"
  ON bookings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_bookings"
  ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ── Double-booking check RPC ─────────────────────────────────
-- Returns TRUE if any active booking overlaps the requested slot.
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_space_id           text,
  p_date               date,
  p_start_hour         int,
  p_end_hour           int,
  p_exclude_booking_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE  space_id   = p_space_id
      AND  date       = p_date
      AND  status    != 'cancelled'
      AND  (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND  start_hour < p_end_hour
      AND  end_hour   > p_start_hour
  );
END;
$$;

-- ── Auto-create profile on signup ────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Seed spaces ───────────────────────────────────────────────
INSERT INTO spaces (id, label, type, zone, price, hourly, capacity, is_active, sort_order) VALUES
  -- Hot Desks – North
  ('HD-01', 'Hot Desk 1',  'hot', 'Open Floor — North', 25, 5, NULL, true,  1),
  ('HD-02', 'Hot Desk 2',  'hot', 'Open Floor — North', 25, 5, NULL, true,  2),
  ('HD-03', 'Hot Desk 3',  'hot', 'Open Floor — North', 25, 5, NULL, true,  3),
  ('HD-04', 'Hot Desk 4',  'hot', 'Open Floor — North', 25, 5, NULL, true,  4),
  ('HD-05', 'Hot Desk 5',  'hot', 'Open Floor — North', 25, 5, NULL, true,  5),
  ('HD-06', 'Hot Desk 6',  'hot', 'Open Floor — North', 25, 5, NULL, true,  6),
  ('HD-07', 'Hot Desk 7',  'hot', 'Open Floor — North', 25, 5, NULL, true,  7),
  ('HD-08', 'Hot Desk 8',  'hot', 'Open Floor — North', 25, 5, NULL, true,  8),
  ('HD-09', 'Hot Desk 9',  'hot', 'Open Floor — North', 25, 5, NULL, true,  9),
  ('HD-10', 'Hot Desk 10', 'hot', 'Open Floor — North', 25, 5, NULL, true, 10),
  -- Hot Desks – South
  ('HD-11', 'Hot Desk 11', 'hot', 'Open Floor — South', 25, 5, NULL, true, 11),
  ('HD-12', 'Hot Desk 12', 'hot', 'Open Floor — South', 25, 5, NULL, true, 12),
  ('HD-13', 'Hot Desk 13', 'hot', 'Open Floor — South', 25, 5, NULL, true, 13),
  ('HD-14', 'Hot Desk 14', 'hot', 'Open Floor — South', 25, 5, NULL, true, 14),
  ('HD-15', 'Hot Desk 15', 'hot', 'Open Floor — South', 25, 5, NULL, true, 15),
  ('HD-16', 'Hot Desk 16', 'hot', 'Open Floor — South', 25, 5, NULL, true, 16),
  ('HD-17', 'Hot Desk 17', 'hot', 'Open Floor — South', 25, 5, NULL, true, 17),
  ('HD-18', 'Hot Desk 18', 'hot', 'Open Floor — South', 25, 5, NULL, true, 18),
  ('HD-19', 'Hot Desk 19', 'hot', 'Open Floor — South', 25, 5, NULL, true, 19),
  ('HD-20', 'Hot Desk 20', 'hot', 'Open Floor — South', 25, 5, NULL, true, 20),
  -- Dedicated Desks
  ('DD-01', 'Dedicated 1', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 21),
  ('DD-02', 'Dedicated 2', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 22),
  ('DD-03', 'Dedicated 3', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 23),
  ('DD-04', 'Dedicated 4', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 24),
  ('DD-05', 'Dedicated 5', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 25),
  ('DD-06', 'Dedicated 6', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 26),
  ('DD-07', 'Dedicated 7', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 27),
  ('DD-08', 'Dedicated 8', 'dedicated', 'Quiet Wing', 45, 9, NULL, true, 28),
  -- Conference Rooms
  ('RM-ATLAS',  'Atlas',  'room', 'Boardrooms',   25, 25, 8, true, 29),
  ('RM-MERCER', 'Mercer', 'room', 'Boardrooms',   22, 22, 6, true, 30),
  ('RM-VEGA',   'Vega',   'room', 'Phone Booths', 18, 18, 4, true, 31)
ON CONFLICT (id) DO NOTHING;
