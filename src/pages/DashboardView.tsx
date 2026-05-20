import type { ReactNode } from 'react'
import type { Booking } from '../types/app'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { TYPE_META } from '../lib/mockData'
import { DAYS, MONTHS, fmtLongDate, fmtRange } from '../lib/dateHelpers'
import { TODAY } from '../lib/dateHelpers'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { CountdownTimer } from '../components/ui/CountdownTimer'

/* ── Helpers ──────────────────────────────────────────────────────── */

function Section2({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-12">
      <header className="mb-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{eyebrow}</div>
        <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">{title}</h2>
      </header>
      {children}
    </section>
  )
}

function MemberStat({
  col, label, big, sub, meter, tone, hint,
}: {
  col: string; label: string; big: string; sub: string
  meter?: number; tone: 'amber' | 'slate' | 'emerald'; hint: string
}) {
  const tones = { amber: 'bg-amber-500', slate: 'bg-slate-700', emerald: 'bg-emerald-500' }
  return (
    <div className={`${col} rounded-3xl border border-slate-200 bg-white p-6 shadow-soft`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{label}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-5xl leading-none text-slate-900">{big}</span>
            <span className="text-sm text-slate-500">{sub}</span>
          </div>
        </div>
      </div>
      {typeof meter === 'number' && (
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className={`h-full ${tones[tone]}`} style={{ width: `${meter * 100}%` }} />
        </div>
      )}
      <div className="mt-3 text-xs text-slate-500">{hint}</div>
    </div>
  )
}

function DetailChip({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-slate-700">
      <Icon name={icon} size={12} />
      {label}
    </div>
  )
}

function UpcomingCard({
  booking, onCancel, onMarkPaid, onConfirmPayment,
}: {
  booking: Booking
  onCancel: () => void
  onMarkPaid: () => void
  onConfirmPayment: () => void
}) {
  const app  = useApp()
  const { profile } = useAuth()
  const d    = app.parseKey(booking.date)
  const meta = TYPE_META[booking.space.type]

  const fullName   = profile?.full_name ?? null
  const avatarText = (() => {
    if (fullName?.trim()) {
      const parts = fullName.trim().split(' ')
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase()
    }
    return (profile?.email ?? '??').slice(0, 2).toUpperCase()
  })()
  const meForAvatar = { name: fullName ?? 'Me', avatar: avatarText, color: 'bg-amber-100 text-amber-900', plan: '' }

  const accentBg = { amber: 'bg-amber-100 text-amber-900', emerald: 'bg-emerald-100 text-emerald-900', slate: 'bg-slate-900 text-white' }[meta.accent]
  const sidebar  = { amber: 'from-amber-500 to-amber-300', emerald: 'from-emerald-500 to-emerald-300', slate: 'from-slate-900 to-slate-600' }[meta.accent]

  const daysUntil = Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
  const daysLabel = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`

  const ps = booking.payment_status

  return (
    <div className="group relative flex overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition hover:shadow-soft-lg">
      <div className={`w-2 bg-gradient-to-b ${sidebar}`} />
      <div className="flex-1 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${accentBg}`}>
              <Icon name={meta.icon} size={12} />
              {meta.label}
            </div>
            <h3 className="mt-3 font-serif text-3xl leading-tight text-slate-900">{booking.space.label}</h3>
            <div className="mt-1 text-sm text-slate-500">{booking.space.zone}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">{daysLabel}</div>
            <div className="mt-1 font-serif text-2xl leading-tight text-slate-900">
              {DAYS[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}
            </div>
            <div className="font-mono text-xs text-slate-500">{fmtRange(booking.start, booking.end)}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <DetailChip icon="Clock"    label={`${booking.end - booking.start} hours`} />
          <DetailChip icon="Banknote" label={`₱${booking.price.toLocaleString()}`} />
          <DetailChip icon="QrCode"   label={`Check-in ${booking.space.id}`} />
        </div>

        {/* Payment status banner */}
        {ps === 'pending' && booking.client_deadline && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Payment pending.</span> Complete within{' '}
                <CountdownTimer deadline={booking.client_deadline} />
              </div>
              <button
                onClick={onMarkPaid}
                className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                I&rsquo;ve paid
              </button>
            </div>
          </div>
        )}
        {ps === 'awaiting_confirmation' && booking.admin_deadline && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-blue-800">
                <span className="font-semibold">Payment submitted.</span> Admin confirming within{' '}
                <CountdownTimer deadline={booking.admin_deadline} />
              </div>
              <span className="shrink-0 text-xs text-blue-600">Awaiting confirmation</span>
            </div>
          </div>
        )}
        {ps === 'confirmed' && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Payment confirmed
          </div>
        )}
        {ps === 'expired' && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            <Icon name="AlertCircle" size={12} className="mr-1 inline-block" />
            Expired — slot released
          </div>
        )}

        {/* Admin confirm button (only in admin role) */}
        {ps === 'awaiting_confirmation' && app.userRole === 'admin' && (
          <div className="mt-2">
            <button
              onClick={onConfirmPayment}
              className="w-full rounded-xl bg-slate-900 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Confirm payment
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <Avatar member={meForAvatar} size={28} ring />
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-stone-50">
              <Icon name="Calendar" size={12} className="mr-1 inline-block" />
              Add to calendar
            </button>
            <button
              onClick={onCancel}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              <Icon name="X" size={12} className="mr-1 inline-block" />
              Cancel booking
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, body, onCta }: { title: string; body: string; onCta: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <Icon name="CalendarClock" size={22} />
      </div>
      <h3 className="mt-4 font-serif text-3xl text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{body}</p>
      <button
        onClick={onCta}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Book a desk <Icon name="ArrowRight" size={14} />
      </button>
    </div>
  )
}

/* ── Main view ────────────────────────────────────────────────────── */

export function DashboardView() {
  const app = useApp()
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const { subscription } = app

  const upcoming = app.myBookings
    .filter(b => b.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))
  const past     = app.myBookings.filter(b => b.status === 'past').sort((a, b) => b.date.localeCompare(a.date))

  const totalSpend = past.reduce((s, b) => s + b.price, 0)

  function renewalHint(): string {
    if (!subscription) return 'No active plan'
    if (subscription.billingCycle === 'prepaid') return 'Prepaid — no expiry'
    if (subscription.renewsAt) {
      const d = new Date(subscription.renewsAt)
      return `Renews ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return 'Active'
  }

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">

      {/* Hero */}
      <header className="fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Your portal</div>
        <div className="mt-2 flex items-end justify-between gap-8">
          <h1 className="text-[28px] leading-[1.1] tracking-tight text-slate-900 sm:text-[42px] lg:text-[56px] lg:leading-[1.05]">
            Welcome back, <span className="serif-italic text-amber-700">{firstName}.</span>
            <br />
            You have <span className="serif-italic">{upcoming.length} bookings</span> on the horizon.
          </h1>
          <button
            onClick={() => app.setView('book')}
            className="hidden shrink-0 items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 lg:inline-flex"
          >
            <Icon name="Plus" size={16} />
            New booking
          </button>
        </div>
      </header>

      {/* Subscription / plan card */}
      <section className="mt-10">
        {subscription && subscription.status === 'active' ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Active plan</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-serif text-2xl text-slate-900">{subscription.planName}</span>
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium capitalize text-amber-800">
                    {subscription.billingCycle}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Credits used</div>
                <div className="mt-0.5 font-serif text-xl text-slate-900">
                  {subscription.creditsUsed} / {subscription.creditsTotal}
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(100, (subscription.creditsUsed / subscription.creditsTotal) * 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{subscription.creditsLeft} day credit{subscription.creditsLeft !== 1 ? 's' : ''} remaining</span>
              <span>{renewalHint()}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Icon name="CreditCard" size={20} />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {subscription?.status === 'expired' ? 'Your plan has expired' : 'No active membership plan'}
                </div>
                <div className="mt-0.5 text-sm text-slate-500">
                  Contact your space admin to get assigned a plan and start using day credits.
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Member stat strip */}
      <section className="mt-6 grid grid-cols-12 gap-4">
        <MemberStat
          col="col-span-12 md:col-span-4"
          label="Day credits"
          big={subscription ? `${subscription.creditsLeft}` : '—'}
          sub={subscription ? `of ${subscription.creditsTotal} this period` : 'no active plan'}
          meter={subscription ? subscription.creditsLeft / subscription.creditsTotal : undefined}
          tone="amber"
          hint={renewalHint()}
        />
        <MemberStat
          col="col-span-6 md:col-span-4"
          label="Days at AltSpaceCW"
          big={`${past.length + upcoming.length}`}
          sub="lifetime"
          tone="slate"
          hint={profile?.created_at ? `Joined ${new Date(profile.created_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}` : ''}
        />
        <MemberStat
          col="col-span-6 md:col-span-4"
          label="Spent this quarter"
          big={`₱${totalSpend.toLocaleString()}`}
          sub="across past visits"
          tone="emerald"
          hint="Invoiced monthly"
        />
      </section>

      {/* Upcoming bookings */}
      <Section2 eyebrow="Upcoming" title={<>Your <span className="serif-italic">next sessions</span>.</>}>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nothing booked yet."
            body="Block off a desk for tomorrow and start the week strong."
            onCta={() => app.setView('book')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {upcoming.map(b => (
              <UpcomingCard
                key={b.id}
                booking={b}
                onCancel={() => app.cancelBooking(b.id)}
                onMarkPaid={() => app.markPaid(b.id)}
                onConfirmPayment={() => app.confirmPayment(b.id)}
              />
            ))}
          </div>
        )}
      </Section2>

      {/* Past history */}
      <Section2 eyebrow="Past history" title={<>Where you&rsquo;ve <span className="serif-italic">been</span>.</>}>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-stone-50/60 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Space</th>
                <th className="px-6 py-3 font-medium">Hours</th>
                <th className="px-6 py-3 font-medium">Charge</th>
                <th className="px-6 py-3 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {past.map(b => {
                const d    = app.parseKey(b.date)
                const meta = TYPE_META[b.space.type]
                return (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-stone-50/60">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{fmtLongDate(d)}</div>
                      <div className="font-mono text-[11px] text-slate-400">{b.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-700">
                          <Icon name={meta.icon} size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{b.space.label}</div>
                          <div className="text-xs text-slate-500">{meta.label} · {b.space.zone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{fmtRange(b.start, b.end)}</div>
                      <div className="text-xs text-slate-400">{b.end - b.start}h</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-slate-900">₱{b.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-stone-50">
                        <Icon name="Download" size={12} />
                        PDF
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-stone-50/60 px-6 py-3 text-xs text-slate-500">
            <span>Showing {past.length} of {past.length} visits</span>
            <button className="text-slate-700 hover:underline">Export all (CSV)</button>
          </div>
        </div>
      </Section2>

      {/* Favorites */}
      <Section2 eyebrow="Saved" title={<>Your <span className="serif-italic">usual</span> spots.</>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { id: 'DD-04',   label: 'Dedicated 4', note: 'Quiet wing · faces north windows' },
            { id: 'HD-07',   label: 'Hot Desk 7',  note: 'Near the espresso bar' },
            { id: 'RM-VEGA', label: 'Vega',         note: 'Phone-booth pod · 4 seats' },
          ].map(f => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft hover:border-slate-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Icon name="Star" size={18} />
              </div>
              <div className="flex-1">
                <div className="font-serif text-xl text-slate-900">{f.label}</div>
                <div className="text-xs text-slate-500">{f.note}</div>
              </div>
              <button
                onClick={() => app.setView('book')}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-900 hover:text-slate-900"
              >
                Re-book
              </button>
            </div>
          ))}
        </div>
      </Section2>
    </div>
  )
}

// suppress unused import
