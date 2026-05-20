// Deploy with:
//   npx supabase functions deploy create-user --project-ref ewvxsyixfiyisdtvnhwg
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by the edge runtime.
//
// Callers:
//   - role='console' : can create any role (client | admin) for any tenant
//   - role='admin'   : can only create role='client' scoped to their own tenant

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://altspacecw.hnscorpph.com',
  'https://www.altspacecw.hnscorpph.com',
]

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

// Keep a named const for use in the json helper (updated per-request below)
let CORS_HEADERS: ReturnType<typeof getCorsHeaders> = getCorsHeaders(null)

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  // Set CORS headers scoped to this request's origin
  CORS_HEADERS = getCorsHeaders(req.headers.get('Origin'))

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey          = Deno.env.get('SUPABASE_ANON_KEY')!

    // Service-role client — bypasses RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify caller JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const callerClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: callerUser }, error: callerErr } = await callerClient.auth.getUser()
    if (callerErr || !callerUser) return json({ error: 'Unauthorized' }, 401)

    // Fetch caller's profile (role + tenant_id)
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', callerUser.id)
      .single()

    if (profileErr || !callerProfile) return json({ error: 'Unauthorized' }, 401)

    const callerRole = callerProfile.role as string

    // Only console and admin may call this endpoint
    if (!['console', 'admin'].includes(callerRole)) {
      return json({ error: 'Forbidden: insufficient role' }, 403)
    }

    // Parse body
    const body = await req.json()
    const { email, password, full_name, tenant_id: bodyTenantId, role: bodyRole } = body

    if (!email || !password || !full_name) {
      return json({ error: 'email, password, and full_name are required' }, 400)
    }

    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400)
    }

    // Determine effective role and tenant_id based on caller
    let effectiveRole: string
    let effectiveTenantId: string | null

    if (callerRole === 'console') {
      // Console: full control — any role, any tenant
      if (!['client', 'admin'].includes(bodyRole)) {
        return json({ error: 'role must be client or admin' }, 400)
      }
      effectiveRole     = bodyRole
      effectiveTenantId = bodyTenantId || null
    } else {
      // Admin (tenant operator): can only create clients within their own tenant
      effectiveRole     = 'client'
      effectiveTenantId = callerProfile.tenant_id || null
    }

    // Create the auth user (email_confirm: true skips confirmation email)
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createErr || !newUser.user) {
      return json({ error: createErr?.message ?? 'Failed to create user' }, 400)
    }

    const userId = newUser.user.id

    // Update profile — retry up to 3× in case the DB trigger hasn't fired yet
    let updateError = null
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 300))

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ full_name, role: effectiveRole, tenant_id: effectiveTenantId })
        .eq('id', userId)

      updateError = error
      if (!error) break
    }

    if (updateError) {
      console.error('Profile update failed:', updateError)
    }

    return json({ id: userId, email: newUser.user.email })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return json({ error: message }, 500)
  }
})
