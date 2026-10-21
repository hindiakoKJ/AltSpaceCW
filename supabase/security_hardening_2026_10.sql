-- ============================================================================
-- AltSpaceCW — security hardening (2026-10-20)
--
-- Run once in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run again. Everything runs in one transaction: if any step fails,
-- nothing changes.
--
-- What it does, in plain words:
--   1. Members can no longer make themselves admin/console or move to another
--      workspace. Only the platform console can change a role or workspace.
--   2. Members can no longer mark their own booking as paid, change its price,
--      or book for ₱0. The database works out the price from the space's rates.
--   3. Two people can no longer book the same desk for overlapping hours, and
--      nobody can book a desk that is under maintenance.
--   4. The 5-bookings-per-day limit is enforced by the database, not the browser.
--   5. Each workspace only sees its own data. A suspended workspace loses
--      access until it is reactivated.
--   6. Payment confirmations/rejections are written to the audit log by the
--      database (admins can no longer skip or fake entries), and confirming a
--      payment uses one credit from the member's active plan.
--   7. Logo/hero uploads are limited to JPEG/PNG/WebP up to 5 MB by storage
--      itself, and only the workspace's own admins can change its files.
--   8. The demo accounts from supabase/demo_seed.sql (whose password is in the
--      public GitHub repo) get a random password if they still use it.
--
-- The last statement prints a short report — send it back for checking.
-- ============================================================================

begin;

-- ── 0. Tables the app uses that the repo never defined (no-op if present) ──
create table if not exists public.maintenance_slots (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  space_id   text not null,
  date       date not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, space_id, date)
);

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete set null,
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ── 1. Helpers ───────────────────────────────────────────────────────────────
-- Who is calling? '' means no API request (SQL editor, the auth server,
-- scheduled jobs) — those are trusted. 'authenticated'/'anon' are app users.
create or replace function public.app_request_role() returns text
language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '')
$$;

create or replace function public.app_is_backend() returns boolean
language sql stable set search_path = public as $$
  select public.app_request_role() not in ('authenticated', 'anon')
$$;

-- These read profiles with owner rights so policies never recurse into
-- profiles' own policies.
create or replace function public.app_my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- The caller's workspace, only while that workspace is active.
create or replace function public.app_my_tenant() returns uuid
language sql stable security definer set search_path = public as $$
  select p.tenant_id
  from public.profiles p
  join public.tenants t on t.id = p.tenant_id
  where p.id = auth.uid() and t.status = 'active'
$$;

-- The caller's workspace whatever its status (so a suspended workspace can
-- still see its own name).
create or replace function public.app_my_tenant_any() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

-- ── 2. Start from a clean set of policies on every app table ────────────────
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'tenants', 'spaces', 'bookings', 'subscriptions',
                        'studio_settings', 'maintenance_slots', 'audit_log')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.profiles          enable row level security;
alter table public.tenants           enable row level security;
alter table public.spaces            enable row level security;
alter table public.bookings          enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.studio_settings   enable row level security;
alter table public.maintenance_slots enable row level security;
alter table public.audit_log         enable row level security;

-- ── 3. profiles ──────────────────────────────────────────────────────────────
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.app_my_role() = 'console'
  or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant())
);

create policy profiles_update on public.profiles for update to authenticated
  using      (id = auth.uid() or public.app_my_role() = 'console')
  with check (id = auth.uid() or public.app_my_role() = 'console');
-- No insert/delete policy: profiles are created by the signup trigger and the
-- create-user function, both of which run with owner rights.

create or replace function public.profiles_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- Every new account starts as a member, whatever the signup form sent.
    -- Promotions happen afterwards by UPDATE (console or create-user).
    new.role := 'client';
    if new.tenant_id is not null
       and not exists (select 1 from public.tenants where id = new.tenant_id and status = 'active') then
      new.tenant_id := null;
    end if;
    return new;
  end if;

  if public.app_is_backend() then
    return new;
  end if;

  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'This field cannot be changed.' using errcode = '42501';
  end if;

  if new.role is distinct from old.role or new.tenant_id is distinct from old.tenant_id then
    if coalesce(public.app_my_role(), '') <> 'console' then
      raise exception 'Only the platform console can change a role or workspace.' using errcode = '42501';
    end if;
    if new.role not in ('client', 'admin') or old.role = 'console' then
      raise exception 'The console role can only be granted from the SQL editor.' using errcode = '42501';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();

-- ── 4. tenants ───────────────────────────────────────────────────────────────
-- Tenant pages are only shown after sign-in, so nothing is readable anonymously.
create policy tenants_read on public.tenants for select to authenticated using (
  public.app_my_role() = 'console' or id = public.app_my_tenant_any()
);

create policy tenants_console_write on public.tenants for all to authenticated
  using      (public.app_my_role() = 'console')
  with check (public.app_my_role() = 'console');

-- ── 5. spaces ────────────────────────────────────────────────────────────────
-- Members see all of their workspace's spaces (including retired ones, so old
-- bookings still show a label); the booking page itself only lists active ones.
create policy spaces_read on public.spaces for select to authenticated using (
  tenant_id = public.app_my_tenant() or public.app_my_role() = 'console'
);

create policy spaces_admin_write on public.spaces for all to authenticated
  using      (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()))
  with check (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()));

do $$ begin
  alter table public.spaces add constraint spaces_rates_not_negative
    check (price >= 0 and hourly >= 0) not valid;
exception when duplicate_object then null; end $$;

-- ── 6. bookings ──────────────────────────────────────────────────────────────
create policy bookings_read on public.bookings for select to authenticated using (
  user_id = auth.uid()
  or public.app_my_role() = 'console'
  or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant())
);

create policy bookings_insert on public.bookings for insert to authenticated
  with check (user_id = auth.uid() and tenant_id = public.app_my_tenant());

create policy bookings_update on public.bookings for update to authenticated
  using      (user_id = auth.uid() or public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()))
  with check (user_id = auth.uid() or public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()));
-- No delete policy: bookings are cancelled, never deleted.

do $$ begin
  alter table public.bookings add constraint bookings_price_not_negative check (price >= 0) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.bookings add constraint bookings_payment_status_valid
    check (payment_status in ('pending', 'awaiting_confirmation', 'confirmed', 'expired')) not valid;
exception when duplicate_object then null; end $$;

-- Runs with owner rights so it can see other members' bookings when checking
-- for overlaps (members themselves can only read their own).
create or replace function public.bookings_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_space public.spaces%rowtype;
  v_role  text;
  v_hours int;
  v_today date := (now() at time zone 'Asia/Manila')::date;
begin
  if public.app_is_backend() then
    return new;
  end if;

  v_role := coalesce(public.app_my_role(), '');

  if tg_op = 'INSERT' then
    select * into v_space from public.spaces where id = new.space_id;
    if not found or not v_space.is_active then
      raise exception 'That space is not available.' using errcode = 'P0001';
    end if;
    if v_space.tenant_id is distinct from new.tenant_id then
      raise exception 'That space belongs to a different workspace.' using errcode = '42501';
    end if;
    if new.start_hour < 0 or new.end_hour > 24 or new.end_hour <= new.start_hour then
      raise exception 'Pick a valid time range.' using errcode = 'P0001';
    end if;
    if new.date < v_today then
      raise exception 'You cannot book a date in the past.' using errcode = 'P0001';
    end if;
    if new.date > v_today + 60 then
      raise exception 'Bookings open up to 60 days ahead.' using errcode = 'P0001';
    end if;

    -- The database sets the price and the payment state; the browser's values are ignored.
    v_hours := new.end_hour - new.start_hour;
    new.price := case
      when v_space.type = 'room' then v_space.hourly * v_hours
      when v_hours >= 8          then v_space.price
      else                            v_space.hourly * v_hours
    end;
    new.status          := 'upcoming';
    new.payment_status  := 'pending';
    new.client_deadline := now() + interval '30 minutes';
    new.admin_deadline  := null;

    if v_role = 'client' and (
      select count(*) from public.bookings
      where user_id = new.user_id and created_at > now() - interval '24 hours'
    ) >= 5 then
      raise exception 'You''ve reached the 5-booking limit for a 24-hour window. Try again later.'
        using errcode = 'P0001';
    end if;

    -- One booking at a time per space and day, so two people cannot both win.
    perform pg_advisory_xact_lock(hashtext(new.space_id || '|' || new.date::text));

    if exists (
      select 1 from public.maintenance_slots m
      where m.space_id = new.space_id and m.date = new.date and m.tenant_id = new.tenant_id
    ) then
      raise exception 'That space is under maintenance on this date.' using errcode = 'P0001';
    end if;

    if exists (
      select 1 from public.bookings b
      where b.space_id = new.space_id
        and b.date = new.date
        and b.status <> 'cancelled'
        and coalesce(b.payment_status, '') <> 'expired'
        and not (b.payment_status = 'pending' and b.client_deadline < now())  -- lapsed unpaid hold
        and b.start_hour < new.end_hour
        and b.end_hour   > new.start_hour
    ) then
      raise exception 'Someone just booked that slot. Please pick another time or space.'
        using errcode = '23P01';
    end if;

    return new;
  end if;

  -- UPDATE ------------------------------------------------------------------
  if new.user_id   is distinct from old.user_id
  or new.tenant_id is distinct from old.tenant_id
  or new.space_id  is distinct from old.space_id then
    raise exception 'A booking cannot be moved to another member, workspace or space.' using errcode = '42501';
  end if;

  -- Workspace admins (and the console) run payments for their workspace.
  if v_role = 'console' or (v_role = 'admin' and old.tenant_id = public.app_my_tenant()) then
    return new;
  end if;

  -- The member who owns the booking may only cancel it, say they've paid,
  -- or let an unpaid hold lapse.
  if new.date            is distinct from old.date
  or new.start_hour      is distinct from old.start_hour
  or new.end_hour        is distinct from old.end_hour
  or new.price           is distinct from old.price
  or new.client_deadline is distinct from old.client_deadline
  or new.notes           is distinct from old.notes then
    raise exception 'You can only cancel a booking or mark it as paid.' using errcode = '42501';
  end if;

  if new.status is distinct from old.status and new.status <> 'cancelled' then
    raise exception 'You can only cancel a booking.' using errcode = '42501';
  end if;

  if new.payment_status is distinct from old.payment_status then
    if old.payment_status = 'pending' and new.payment_status = 'awaiting_confirmation' then
      new.admin_deadline := now() + interval '30 minutes';
    elsif new.payment_status = 'expired' and old.payment_status in ('pending', 'awaiting_confirmation') then
      null;
    else
      raise exception 'Only the workspace can confirm a payment.' using errcode = '42501';
    end if;
  elsif new.admin_deadline is distinct from old.admin_deadline then
    raise exception 'You can only cancel a booking or mark it as paid.' using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists bookings_guard on public.bookings;
create trigger bookings_guard before insert or update on public.bookings
  for each row execute function public.bookings_guard();

-- After a payment decision: write the audit entry and use one plan credit.
create or replace function public.bookings_after_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_space_label text;
begin
  if new.payment_status is not distinct from old.payment_status then
    return new;
  end if;

  if new.payment_status = 'confirmed' then
    update public.subscriptions s
       set credits_used = least(s.credits_used + 1, s.credits_total)
     where s.id = (
       select id from public.subscriptions
       where user_id = new.user_id and tenant_id = new.tenant_id and status = 'active'
       order by created_at desc limit 1
     );
  end if;

  -- Log decisions made by someone other than the member (admin confirm/reject).
  if new.payment_status in ('confirmed', 'expired')
     and auth.uid() is not null and auth.uid() <> new.user_id then
    select label into v_space_label from public.spaces where id = new.space_id;
    insert into public.audit_log (tenant_id, actor_id, action, entity_type, entity_id, metadata)
    values (
      new.tenant_id, auth.uid(),
      case when new.payment_status = 'confirmed' then 'payment_confirmed' else 'payment_rejected' end,
      'booking', new.id::text,
      jsonb_build_object('price', new.price, 'space', v_space_label, 'date', new.date)
    );
  end if;

  return new;
end $$;

drop trigger if exists bookings_after_payment on public.bookings;
create trigger bookings_after_payment after update on public.bookings
  for each row execute function public.bookings_after_payment();

-- Who is sitting where — for the booking page and floor map — without
-- revealing who booked or what they paid.
create or replace function public.tenant_occupancy()
returns table (space_id text, date date, start_hour int, end_hour int, mine boolean)
language sql stable security definer set search_path = public as $$
  select b.space_id, b.date, b.start_hour, b.end_hour, (b.user_id = auth.uid())
  from public.bookings b
  where b.tenant_id = public.app_my_tenant()
    and b.status <> 'cancelled'
    and coalesce(b.payment_status, '') <> 'expired'
    and not (b.payment_status = 'pending' and b.client_deadline < now())  -- lapsed unpaid hold
    and b.date >= (now() at time zone 'Asia/Manila')::date - 1
$$;

revoke all on function public.tenant_occupancy() from public, anon;
grant execute on function public.tenant_occupancy() to authenticated;

-- ── 7. subscriptions ─────────────────────────────────────────────────────────
create policy subscriptions_read on public.subscriptions for select to authenticated using (
  user_id = auth.uid()
  or public.app_my_role() = 'console'
  or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant())
);

create policy subscriptions_admin_write on public.subscriptions for all to authenticated
  using      (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()))
  with check (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()));

do $$ begin
  alter table public.subscriptions add constraint subscriptions_credits_in_range
    check (credits_used >= 0 and credits_used <= credits_total) not valid;
exception when duplicate_object then null; end $$;

-- ── 8. studio_settings, maintenance_slots, audit_log ────────────────────────
create policy studio_settings_read on public.studio_settings for select to authenticated using (
  tenant_id = public.app_my_tenant() or public.app_my_role() = 'console'
);

create policy studio_settings_admin_write on public.studio_settings for all to authenticated
  using      (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()))
  with check (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()));

create policy maintenance_read on public.maintenance_slots for select to authenticated using (
  tenant_id = public.app_my_tenant() or public.app_my_role() = 'console'
);

create policy maintenance_admin_write on public.maintenance_slots for all to authenticated
  using      (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()))
  with check (public.app_my_role() = 'console'
              or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant()));

create policy audit_log_read on public.audit_log for select to authenticated using (
  public.app_my_role() = 'console'
  or (public.app_my_role() = 'admin' and tenant_id = public.app_my_tenant())
);
-- No insert policy: only the bookings trigger above writes audit entries.

-- ── 9. Storage: tenant-assets bucket (logos, hero images) ───────────────────
insert into storage.buckets (id, name, public)
values ('tenant-assets', 'tenant-assets', true)
on conflict (id) do nothing;

update storage.buckets
   set file_size_limit    = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'tenant-assets';

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname like 'tenant_assets%'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

-- Public image URLs keep working (the bucket is public). Listing and writing
-- files is limited to the workspace's own admins, inside their own folder.
create policy tenant_assets_admin_select on storage.objects for select to authenticated using (
  bucket_id = 'tenant-assets'
  and (storage.foldername(name))[1] = public.app_my_tenant()::text
  and public.app_my_role() in ('admin', 'console')
);

create policy tenant_assets_admin_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'tenant-assets'
  and (storage.foldername(name))[1] = public.app_my_tenant()::text
  and public.app_my_role() in ('admin', 'console')
);

create policy tenant_assets_admin_update on storage.objects for update to authenticated
  using (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] = public.app_my_tenant()::text
    and public.app_my_role() in ('admin', 'console')
  )
  with check (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] = public.app_my_tenant()::text
    and public.app_my_role() in ('admin', 'console')
  );

create policy tenant_assets_admin_delete on storage.objects for delete to authenticated using (
  bucket_id = 'tenant-assets'
  and (storage.foldername(name))[1] = public.app_my_tenant()::text
  and public.app_my_role() in ('admin', 'console')
);

-- ── 10. Older functions: pin search_path, close anonymous access ────────────
do $$ begin
  alter function public.handle_new_user() set search_path = public;
exception when undefined_function then null; end $$;

do $$ begin
  alter function public.get_my_role() set search_path = public;
exception when undefined_function then null; end $$;

do $$ begin
  alter function public.get_my_tenant_id() set search_path = public;
exception when undefined_function then null; end $$;

do $$ begin
  alter function public.check_booking_conflict(text, date, int, int, uuid) set search_path = public;
  revoke execute on function public.check_booking_conflict(text, date, int, int, uuid) from public, anon;
exception when undefined_function then null; end $$;

-- ── 11. Demo accounts whose password is published in the public repo ───────
do $$ begin
  update auth.users
     set encrypted_password = extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf'))
   where email in ('admin@demo.com', 'client@demo.com')
     and encrypted_password = extensions.crypt('Admin1234!', encrypted_password);
exception when others then
  raise notice 'Demo password check skipped: %', sqlerrm;
end $$;

commit;

-- ── Report (send this result back) ──────────────────────────────────────────
select 'policies' as item,
       string_agg(tablename || '.' || policyname, ', ' order by tablename, policyname) as detail
from pg_policies
where schemaname = 'public'
union all
select 'triggers',
       string_agg(event_object_table || '.' || trigger_name, ', ' order by event_object_table, trigger_name)
from information_schema.triggers
where trigger_schema = 'public'
union all
select 'demo accounts present',
       count(*)::text
from auth.users where email in ('admin@demo.com', 'client@demo.com')
union all
select 'signup trigger (handle_new_user)',
       pg_get_functiondef('public.handle_new_user'::regproc);
