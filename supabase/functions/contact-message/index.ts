// Deploy with:
//   npx supabase functions deploy contact-message --project-ref <your-project-ref>
//
// Sends the public Contact form to HNSCorpPH's inbox. The recipient is fixed here (CONTACT_TO
// secret, default below), so the form can only ever email us. Reply-To is the visitor's address.
//
// Abuse limits: a hidden "website" field catches bots, forms submitted in under 3 seconds are
// dropped, and each server instance accepts at most 5 messages per address per hour and 30 per
// hour overall. The overall cap protects the Resend sending quota that booking emails also use.
// (In-memory, so a cold start resets it — good enough for a contact form.)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_ADDRESS   = Deno.env.get('EMAIL_FROM') ?? 'AltSpaceCW <bookings@hnscorpph.com>'
const CONTACT_TO     = Deno.env.get('CONTACT_TO') ?? 'hnscorpph@gmail.com'

const ALLOWED_ORIGINS = [
  'https://altspacecw.hnscorpph.com',
  'https://www.altspacecw.hnscorpph.com',
]

const EMAIL_RE = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,24}$/i
const HOUR = 60 * 60 * 1000
const PER_SENDER_PER_HOUR = 5
const TOTAL_PER_HOUR      = 30
const sent: { at: number; key: string }[] = []

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get('Origin'))
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405)
  if (!RESEND_API_KEY)          return json({ error: 'Messaging is not configured' }, 503)

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return json({ error: 'Bad request' }, 400)

  // Bots fill the hidden field or submit instantly — accept quietly, send nothing
  const elapsed = Number(body.elapsed_ms ?? 0)
  if (clean(body.website, 200) || !(elapsed >= 3000)) return json({ ok: true })

  const name    = clean(body.name, 100)
  const email   = clean(body.email, 200).toLowerCase()
  const company = clean(body.company, 150)
  const message = clean(body.message, 4000)
  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return json({ error: 'Please fill in your name, a valid email and a short message.' }, 400)
  }

  const now = Date.now()
  while (sent.length && now - sent[0].at > HOUR) sent.shift()
  if (sent.length >= TOTAL_PER_HOUR || sent.filter(s => s.key === email).length >= PER_SENDER_PER_HOUR) {
    return json({ error: 'We have received several messages already. Please email us directly instead.' }, 429)
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#1e293b">
      <h2 style="margin:0 0 12px">New AltSpaceCW enquiry</h2>
      <p><strong>Name:</strong> ${esc(name)}<br>
         <strong>Email:</strong> ${esc(email)}<br>
         <strong>Business:</strong> ${esc(company || '—')}</p>
      <p style="white-space:pre-wrap;border-left:3px solid #f59e0b;padding-left:12px">${esc(message)}</p>
      <p style="font-size:12px;color:#94a3b8">Sent from the contact form at altspacecw.hnscorpph.com/contact. Reply to this email to answer them.</p>
    </div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [CONTACT_TO],
        reply_to: email,
        subject: `AltSpaceCW enquiry from ${name.replace(/[\r\n]+/g, ' ')}${company ? ` (${company.replace(/[\r\n]+/g, ' ')})` : ''}`,
        html,
      }),
    })
    if (!res.ok) {
      console.error('Resend rejected the contact email, status', res.status)
      return json({ error: 'Your message could not be sent. Please email us directly.' }, 502)
    }
    sent.push({ at: now, key: email })
    return json({ ok: true })
  } catch {
    return json({ error: 'Your message could not be sent. Please email us directly.' }, 500)
  }
})
