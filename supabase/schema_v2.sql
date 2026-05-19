-- ============================================================
-- AltSpaceCW – Schema V2: Multi-tenancy
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ── 1. Add console role ──────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'admin', 'console'));

-- ── 2. Tenants table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text  NOT NULL,
  slug        text  UNIQUE NOT NULL,
  status      text  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  admin_email text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "console_manage_tenants" ON tenants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'console')
);

CREATE POLICY "members_read_own_tenant" ON tenants FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.tenant_id = tenants.id)
);

-- ── 3. Add tenant_id to profiles ─────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- ── 4. Add tenant_id to spaces ───────────────────────────────
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- ── 5. Add tenant_id to bookings ─────────────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- ── 6. Seed AltSpaceCW as first tenant ───────────────────────
INSERT INTO tenants (id, name, slug, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'AltSpaceCW', 'altspacecw', 'active')
ON CONFLICT (slug) DO NOTHING;

-- ── 7. Assign existing spaces + bookings to AltSpaceCW ───────
UPDATE spaces   SET tenant_id = '11111111-1111-1111-1111-111111111111' WHERE tenant_id IS NULL;
UPDATE bookings SET tenant_id = '11111111-1111-1111-1111-111111111111' WHERE tenant_id IS NULL;

-- ── 8. Enforce NOT NULL on spaces.tenant_id ──────────────────
ALTER TABLE spaces ALTER COLUMN tenant_id SET NOT NULL;

-- ── 9. Update spaces RLS for tenant isolation ─────────────────
DROP POLICY IF EXISTS "auth_read_active_spaces"    ON spaces;
DROP POLICY IF EXISTS "admins_manage_spaces"       ON spaces;

CREATE POLICY "tenant_read_active_spaces" ON spaces FOR SELECT USING (
  is_active = true AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.tenant_id = spaces.tenant_id)
    OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'console')
  )
);

CREATE POLICY "admins_manage_tenant_spaces" ON spaces FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = spaces.tenant_id
  )
);

-- ── 10. Update bookings RLS for tenant isolation ──────────────
DROP POLICY IF EXISTS "admins_read_all_bookings" ON bookings;

CREATE POLICY "admins_read_tenant_bookings" ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = bookings.tenant_id
  )
);
-- Console cannot read bookings (no financial data) — no policy added intentionally

-- ── 11. Console: read all profiles (for user management) ─────
DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;

CREATE POLICY "console_manage_profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'console')
);
