import type { ReactNode } from 'react'
import type { Space } from '../../types/app'
import { Avatar } from '../ui/Avatar'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { fmtLongDate, fmtRange } from '../../lib/dateHelpers'

function initials(name: string | null | undefined, email: string | null | undefined) {
  if (name?.trim()) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return (email ?? '??').slice(0, 2).toUpperCase()
}

interface BookingSummaryProps {
  date:      Date
  range:     { start: number; end: number } | null
  space:     Space | null
  total:     number
  hours:     number
  onConfirm: () => void
  onClear:   () => void
}

function SummaryLine({ icon, label, value }: { icon: string; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-600">
        <Icon name={icon} size={14} />
      </div>
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm text-slate-900">{value}</div>
      </div>
    </div>
  )
}

export function BookingSummary({ date, range, space, total, hours, onConfirm, onClear }: BookingSummaryProps) {
  const { profile } = useAuth()
  const { subscription, studioSettings } = useApp()
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Member'
  const avatarInitials = initials(profile?.full_name, profile?.email)
  const me = { name: displayName, avatar: avatarInitials, color: 'bg-amber-100 text-amber-900', plan: '' }
  const ready = !!space && !!range

  function subLine(): string {
    if (!subscription) return 'No active plan · Pay per booking'
    if (subscription.status === 'expired') return `${subscription.planName} · Expired — pay per booking`
    const n = subscription.creditsLeft
    return `${subscription.planName} · ${n} day credit${n !== 1 ? 's' : ''} left`
  }

  return (
    <div className="xl:sticky xl:top-[88px]">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft-lg">

        {/* Header */}
        <div className="border-b border-slate-100 bg-stone-50 px-6 py-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Booking summary</div>
          <h3 className="mt-1 font-serif text-3xl leading-tight text-slate-900">
            {ready
              ? <><span>You&rsquo;re booking </span><span className="text-amber-700">{space!.label}</span>.</>
              : <>Build your <span className="serif-italic">perfect day</span>.</>
            }
          </h3>
        </div>

        {/* Lines */}
        <div className="px-6 py-5">
          <SummaryLine icon="Calendar" label="Date"  value={fmtLongDate(date)} />
          <SummaryLine icon="Clock"    label="Hours" value={
            range
              ? `${fmtRange(range.start, range.end)} · ${hours}h`
              : <span className="text-slate-400">Pick your hours →</span>
          } />
          <SummaryLine icon="MapPin"   label="Space" value={
            space
              ? `${space.label} · ${space.zone}`
              : <span className="text-slate-400">Pick a space →</span>
          } />
          {space?.type === 'room' && (
            <SummaryLine icon="Users" label="Seats" value={`Up to ${space.capacity} people`} />
          )}
          {(() => {
            const enabled = (studioSettings?.amenities ?? []).filter(a => a.enabled).map(a => a.label)
            return enabled.length > 0
              ? <SummaryLine icon="Wifi" label="Includes" value={enabled.join(' · ')} />
              : null
          })()}
        </div>

        {/* Price */}
        <div className="border-t border-slate-100 px-6 py-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Total</div>
              <div className="font-serif text-5xl leading-none text-slate-900">
                ₱{total.toLocaleString()}
                <span className="ml-2 text-base text-slate-400">PHP</span>
              </div>
            </div>
            {space && space.type !== 'room' && hours >= 8 && (
              <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                Day-rate applied
              </div>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-500">Payment collected by operator · cash or transfer.</div>
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t border-slate-100 bg-stone-50 px-6 py-5">
          <button
            disabled={!ready}
            onClick={onConfirm}
            className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold transition ${
              ready ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400'
            }`}
          >
            Review &amp; confirm
            <Icon name="ArrowRight" size={16} />
          </button>
          <button
            onClick={onClear}
            className="w-full rounded-full px-4 py-2 text-xs text-slate-500 hover:bg-stone-100"
          >
            Reset selection
          </button>
        </div>
      </div>

      {/* Member badge */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
        <Avatar member={me} size={36} />
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">{displayName}</div>
          <div className="text-xs text-slate-500">{subLine()}</div>
        </div>
        <Icon name="BadgeCheck" size={18} className="text-amber-600" />
      </div>
    </div>
  )
}
