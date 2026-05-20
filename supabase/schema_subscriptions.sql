-- Subscriptions table — run in Supabase SQL editor
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name      text        NOT NULL,
  billing_cycle  text        NOT NULL CHECK (billing_cycle IN ('monthly','annual','prepaid')),
  status         text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  credits_total  integer     NOT NULL CHECK (credits_total > 0),
  credits_used   integer     NOT NULL DEFAULT 0,
  started_at     timestamptz NOT NULL DEFAULT now(),
  renews_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sub_user_tenant_status ON public.subscriptions(user_id, tenant_id, status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Client: read own subscriptions
CREATE POLICY "sub_client_read" ON public.subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin: full access within their tenant (console role can access any tenant)
CREATE POLICY "sub_admin_all" ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','console')
        AND (profiles.tenant_id = subscriptions.tenant_id OR profiles.role = 'console')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','console')
        AND (profiles.tenant_id = subscriptions.tenant_id OR profiles.role = 'console')
    )
  );
