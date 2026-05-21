import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_ADDRESS   = 'AltSpaceCW <noreply@altspacecw.hnscorpph.com>'

interface EmailPayload {
  type: 'booking_created' | 'payment_confirmed' | 'payment_submitted'
  to_email: string
  to_name: string
  booking: {
    id: string
    space_label: string
    space_zone: string
    date: string          // YYYY-MM-DD
    start: number
    end: number
    price: number
  }
}

function fmt12h(h: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:00 ${suffix}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function buildEmail(p: EmailPayload): { subject: string; html: string } {
  const { booking, to_name } = p
  const dateStr  = formatDate(booking.date)
  const timeStr  = `${fmt12h(booking.start)} – ${fmt12h(booking.end)}`
  const hours    = booking.end - booking.start
  const ref      = booking.id.slice(0, 8).toUpperCase()
  const price    = `₱${booking.price.toLocaleString()}`

  const base = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1e293b">
      <div style="font-size:20px;font-weight:700;margin-bottom:2px">AltSpace<span style="background:#f59e0b;color:#1c1917;padding:1px 6px;border-radius:3px;font-family:monospace;font-size:11px;margin-left:4px">CW</span></div>
      <div style="font-size:11px;color:#94a3b8;font-style:italic;margin-bottom:32px">a place to do the work.</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
      <div style="font-size:13px;color:#64748b;margin-bottom:6px">REF # ${ref}</div>
      <table style="width:100%;font-size:14px;margin-top:16px">
        <tr><td style="color:#64748b;padding:6px 0">Date</td><td style="font-weight:500;text-align:right">${dateStr}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Space</td><td style="font-weight:500;text-align:right">${booking.space_label}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Zone</td><td style="font-weight:500;text-align:right">${booking.space_zone}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Hours</td><td style="font-weight:500;text-align:right">${timeStr} · ${hours}h</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Charge</td><td style="font-weight:500;text-align:right">${price}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
  `
  const footer = `
      <p style="font-size:11px;color:#94a3b8;margin-top:28px;line-height:1.6">
        Payment is collected by the operator via cash or bank transfer. Questions? Contact your co-working space administrator.
      </p>
    </div>
  `

  if (p.type === 'booking_created') {
    return {
      subject: `Booking confirmed – ${booking.space_label} on ${dateStr}`,
      html: base + `
        <h2 style="font-size:22px;margin:0 0 8px">Hi ${to_name},</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 16px">Your booking is confirmed. Please complete payment within <strong>30 minutes</strong> to hold your spot.</p>
      ` + footer,
    }
  }

  if (p.type === 'payment_submitted') {
    return {
      subject: `Payment received – awaiting confirmation`,
      html: base + `
        <h2 style="font-size:22px;margin:0 0 8px">Hi ${to_name},</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 16px">Your payment has been submitted. The operator will confirm within <strong>30 minutes</strong>.</p>
      ` + footer,
    }
  }

  // payment_confirmed
  return {
    subject: `✓ Payment confirmed – ${booking.space_label}`,
    html: base + `
      <h2 style="font-size:22px;margin:0 0 8px">Hi ${to_name},</h2>
      <p style="font-size:15px;color:#475569;margin:0 0 16px">Your payment has been confirmed. Your booking is fully reserved. See you there!</p>
    ` + footer,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
  }

  const payload: EmailPayload = await req.json()
  const { subject, html } = buildEmail(payload)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [payload.to_email], subject, html }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
})
