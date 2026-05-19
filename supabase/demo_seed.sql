-- Demo seed data for AltSpaceCW
-- Run this in the Supabase SQL Editor for project ewvxsyixfiyisdtvnhwg
--
-- Creates:
--   • tenant: slug=demo, name="Demo Workspace"
--   • admin@demo.com  (role=admin,  tenant=demo)
--   • client@demo.com (role=client, tenant=demo)
--   Password for both: Admin1234!

-- ── 1. Create demo tenant ────────────────────────────────────────────────────
INSERT INTO public.tenants (name, slug, status, admin_email)
VALUES ('Demo Workspace', 'demo', 'active', 'admin@demo.com')
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Create auth users directly ───────────────────────────────────────────
-- The PostgreSQL trigger on auth.users will auto-create a row in public.profiles.

-- admin@demo.com
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@demo.com',
  crypt('Admin1234!', gen_salt('bf')),
  NOW(),   -- email already confirmed
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Admin"}',
  NOW(),
  NOW(),
  '', '', '', ''
)
ON CONFLICT (email) DO NOTHING;

-- client@demo.com
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'client@demo.com',
  crypt('Admin1234!', gen_salt('bf')),
  NOW(),   -- email already confirmed
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Client"}',
  NOW(),
  NOW(),
  '', '', '', ''
)
ON CONFLICT (email) DO NOTHING;

-- ── 3. Update profiles with correct role + tenant ────────────────────────────
-- (Trigger creates profiles with default role=client / tenant_id=null)
-- We UPDATE after to set the proper values.

UPDATE public.profiles
SET
  role      = 'admin',
  tenant_id = (SELECT id FROM public.tenants WHERE slug = 'demo'),
  full_name = 'Demo Admin'
WHERE email = 'admin@demo.com';

UPDATE public.profiles
SET
  role      = 'client',
  tenant_id = (SELECT id FROM public.tenants WHERE slug = 'demo'),
  full_name = 'Demo Client'
WHERE email = 'client@demo.com';
