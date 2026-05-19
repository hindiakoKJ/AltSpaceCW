-- ============================================================
-- AltSpace Co-working Booking App — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile; admins can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    'client'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. SPACES
create table if not exists public.spaces (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('desk', 'room')),
  capacity     int not null default 1,
  hourly_rate  numeric(10, 2) not null,
  description  text,
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.spaces enable row level security;

-- Everyone (including anon) can read active spaces
create policy "Anyone can view active spaces"
  on public.spaces for select
  using (is_active = true);

-- Only admins can insert/update/delete spaces
create policy "Admins can manage spaces"
  on public.spaces for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- 3. BOOKINGS
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  space_id      uuid not null references public.spaces(id) on delete cascade,
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  status        text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  total_amount  numeric(10, 2) not null,
  notes         text,
  created_at    timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time)
);

alter table public.bookings enable row level security;

-- Clients see only their own bookings
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

-- Admins see all bookings
create policy "Admins can view all bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Authenticated users can insert bookings for themselves
create policy "Users can create own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Users can cancel their own bookings; admins can update any
create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

create policy "Admins can update any booking"
  on public.bookings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- 4. DOUBLE-BOOKING PREVENTION FUNCTION
-- Returns TRUE if a conflict exists for the given space/date/time window
create or replace function public.check_booking_conflict(
  p_space_id           uuid,
  p_date               date,
  p_start_time         time,
  p_end_time           time,
  p_exclude_booking_id uuid default null
)
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.bookings
    where space_id = p_space_id
      and date      = p_date
      and status   <> 'cancelled'
      and (p_exclude_booking_id is null or id <> p_exclude_booking_id)
      -- overlap: existing [start, end) overlaps requested [p_start, p_end)
      and start_time < p_end_time
      and end_time   > p_start_time
  );
$$;


-- 5. SEED — sample spaces (safe to re-run: uses ON CONFLICT DO NOTHING)
insert into public.spaces (id, name, type, capacity, hourly_rate, description)
values
  ('00000000-0000-0000-0000-000000000001', 'Hot Desk A', 'desk', 1, 150.00, 'Open-plan hot desk near the window'),
  ('00000000-0000-0000-0000-000000000002', 'Hot Desk B', 'desk', 1, 150.00, 'Quiet zone hot desk'),
  ('00000000-0000-0000-0000-000000000003', 'Focus Room 1', 'room', 4, 400.00, 'Private room, whiteboard included'),
  ('00000000-0000-0000-0000-000000000004', 'Board Room', 'room', 12, 800.00, 'Full AV setup, seats 12')
on conflict (id) do nothing;
