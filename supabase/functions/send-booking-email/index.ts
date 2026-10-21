// Deploy with:
//   npx supabase functions deploy send-booking-email --project-ref <your-project-ref>
//
// Secrets: RESEND_API_KEY (required), EMAIL_FROM (optional, must be on a domain verified in Resend).
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by the edge runtime.
//
// The caller only sends { type, booking_id }. Everything in the email — recipient included —
// is looked up here, so this cannot be used to send mail to arbitrary people:
//   - booking_created / payment_submitted: only the member who owns the booking, about their own booking
//   - payment_confirmed: only an admin of the booking's workspace (or the console), after confirming it
// The email always goes to the booking owner's account address.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_ADDRESS   = Deno.env.get('EMAIL_FROM') ?? 'AltSpaceCW <bookings@hnscorpph.com>'

const ALLOWED_ORIGINS = [
  'https://altspacecw.hnscorpph.com',
  'https://www.altspacecw.hnscorpph.com',
]

type EmailType = 'booking_created' | 'payment_submitted' | 'payment_confirmed'
const EMAIL_TYPES: EmailType[] = ['booking_created', 'payment_submitted', 'payment_confirmed']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

/** Escape HTML so names and labels can't inject markup or links into the email */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmt12h(h: number): string {
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:00 ${suffix}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

interface BookingDetails {
  id: string
  date: string
  start: number
  end: number
  price: number
  spaceLabel: string
  spaceZone: string
  workspace: string
  memberName: string
}

function buildEmail(type: EmailType, b: BookingDetails): { subject: string; html: string } {
  const dateStr = formatDate(b.date)
  const timeStr = `${fmt12h(b.start)} – ${fmt12h(b.end)}`
  const hours   = b.end - b.start
  const ref     = b.id.slice(0, 8).toUpperCase()
  const price   = `₱${Number(b.price).toLocaleString('en-PH')}`

  const base = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1e293b">
      <div style="font-size:20px;font-weight:700;margin-bottom:2px">${esc(b.workspace)}</div>
      <div style="font-size:11px;color:#94a3b8;font-style:italic;margin-bottom:32px">Bookings by AltSpaceCW</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
      <div style="font-size:13px;color:#64748b;margin-bottom:6px">REF # ${esc(ref)}</div>
      <table style="width:100%;font-size:14px;margin-top:16px">
        <tr><td style="color:#64748b;padding:6px 0">Date</td><td style="font-weight:500;text-align:right">${esc(dateStr)}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Space</td><td style="font-weight:500;text-align:right">${esc(b.spaceLabel)}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Zone</td><td style="font-weight:500;text-align:right">${esc(b.spaceZone)}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Hours</td><td style="font-weight:500;text-align:right">${esc(timeStr)} · ${esc(hours)}h</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Charge</td><td style="font-weight:500;text-align:right">${esc(price)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
  `
  const footer = `
      <p style="font-size:11px;color:#94a3b8;margin-top:28px;line-height:1.6">
        Payment is made directly to ${esc(b.workspace)}. Questions about this booking? Contact your co-working space.
        This is an automated message from AltSpaceCW, operated by HNSCorpPH.
      </p>
    </div>
  `
  const hi = `<h2 style="font-size:22px;margin:0 0 8px">Hi ${esc(b.memberName)},</h2>`

  if (type === 'booking_created') {
    return {
      subject: `Booking received – ${b.spaceLabel} on ${dateStr}`,
      html: base + hi + `
        <p style="font-size:15px;color:#475569;margin:0 0 16px">We've saved your spot. Please pay and tap <strong>I've paid</strong> within <strong>30 minutes</strong> to keep it.</p>
      ` + footer,
    }
  }

  if (type === 'payment_submitted') {
    return {
      subject: `Payment submitted – awaiting confirmation`,
      html: base + hi + `
        <p style="font-size:15px;color:#475569;margin:0 0 16px">Thanks — the space will confirm your payment within <strong>30 minutes</strong>.</p>
      ` + footer,
    }
  }

  return {
    subject: `Payment confirmed – ${b.spaceLabel} on ${dateStr}`,
    html: base + hi + `
      <p style="font-size:15px;color:#475569;margin:0 0 16px">Your payment is confirmed and your booking is fully reserved. See you there!</p>
    ` + footer,
  }
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get('Origin'))
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405)
  if (!RESEND_API_KEY)          return json({ error: 'Email is not configured' }, 503)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ── Who is calling? (a real signed-in user, not just the public anon key) ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)
    const caller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await caller.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    // ── What are they asking for? ──
    const body = await req.json().catch(() => null) as { type?: string; booking_id?: string } | null
    const type = body?.type as EmailType
    const bookingId = body?.booking_id ?? ''
    if (!EMAIL_TYPES.includes(type) || !UUID_RE.test(bookingId)) return json({ error: 'Bad request' }, 400)

    const { data: booking } = await admin
      .from('bookings')
      .select('id, user_id, tenant_id, date, start_hour, end_hour, price, payment_status, created_at, space:spaces(label, zone), tenant:tenants(name, status)')
      .eq('id', bookingId)
      .maybeSingle()
    if (!booking) return json({ error: 'Not found' }, 404)

    // ── May this caller trigger this email? ──
    if (type === 'payment_confirmed') {
      const { data: callerProfile } = await admin
        .from('profiles').select('role, tenant_id').eq('id', user.id).maybeSingle()
      const isOperator = callerProfile?.role === 'console'
        || (callerProfile?.role === 'admin' && callerProfile.tenant_id === booking.tenant_id)
      if (!isOperator || booking.payment_status !== 'confirmed') return json({ error: 'Forbidden' }, 403)
    } else {
      if (booking.user_id !== user.id) return json({ error: 'Forbidden' }, 403)
      if (type === 'booking_created') {
        // Only right after booking, so this can't be replayed to flood an inbox
        const ageMs = Date.now() - new Date(booking.created_at).getTime()
        if (booking.payment_status !== 'pending' || ageMs > 15 * 60 * 1000) return json({ error: 'Forbidden' }, 403)
      }
      if (type === 'payment_submitted' && booking.payment_status !== 'awaiting_confirmation') {
        return json({ error: 'Forbidden' }, 403)
      }
    }

    // ── Recipient is always the booking owner's own account email ──
    const { data: owner } = await admin.auth.admin.getUserById(booking.user_id)
    const toEmail = owner?.user?.email
    if (!toEmail) return json({ error: 'Not found' }, 404)
    const { data: ownerProfile } = await admin
      .from('profiles').select('full_name').eq('id', booking.user_id).maybeSingle()

    // deno-lint-ignore no-explicit-any
    const space  = (booking as any).space  as { label: string; zone: string } | null
    // deno-lint-ignore no-explicit-any
    const tenant = (booking as any).tenant as { name: string; status: string } | null
    if (tenant?.status !== 'active') return json({ error: 'Forbidden' }, 403)

    const { subject, html } = buildEmail(type, {
      id:         booking.id,
      date:       booking.date,
      start:      booking.start_hour,
      end:        booking.end_hour,
      price:      Number(booking.price),
      spaceLabel: space?.label ?? 'Your space',
      spaceZone:  space?.zone ?? '',
      workspace:  tenant?.name ?? 'Your co-working space',
      memberName: ownerProfile?.full_name || toEmail.split('@')[0],
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [toEmail], subject, html }),
    })
    if (!res.ok) {
      console.error('Resend rejected the email, status', res.status)
      return json({ error: 'Email could not be sent' }, 502)
    }
    return json({ ok: true })
  } catch {
    return json({ error: 'Internal server error' }, 500)
  }
})
