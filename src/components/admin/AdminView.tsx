import { useEffect, useState } from 'react'
import type { Space } from '../../types/app'
import { useApp } from '../../context/AppContext'
import { useTenant } from '../../context/TenantContext'
import { ALL_SPACES, MEMBERS, TYPE_META } from '../../lib/mockData'
import { TODAY, addDays, dateKey, fmtLongDate, fmtHourShort, parseKey } from '../../lib/dateHelpers'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'
import { Pill } from '../ui/Pill'
import { SetupPanel } from './SetupPanel'
import { CountdownTimer } from '../ui/CountdownTimer'
import { supabase } from '../../lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

type AdminTab = 'operations' | 'setup'

/* ── Metric: Occupancy donut ──────────────────────────────────────── */

function OccupancyCard({ pct, occupied, total }: { pct: number; occupied: number; total: number }) {
  const r = 56, c = 2 * Math.PI * r
  return (
    <div className="col-span-12 md:col-span-5 rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300">Today&rsquo;s occupancy</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-7xl leading-none">{pct}<span className="text-3xl text-amber-300">%</span></span>
          </div>
          <div className="mt-2 text-sm text-white/70">
            <span className="text-white">{occupied}</span> of {total} spaces in use
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">Peak at 11 AM</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">↑ 12% WoW</span>
          </div>
        </div>
        <svg width="148" height="148" viewBox="0 0 148 148" className="shrink-0">
          <circle cx="74" cy="74" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
          <circle
            cx="74" cy="74" r={r}
            stroke="#F59E0B" strokeWidth="10" fill="none" strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
            transform="rotate(-90 74 74)"
          />
          <text x="74" y="80" textAnchor="middle" fontFamily="Instrument Serif" fontSize="34" fill="white">{pct}%</text>
        </svg>
      </div>
    </div>
  )
}

/* ── Metric: Revenue sparkline ────────────────────────────────────── */

function RevenueCard({ amount, delta }: { amount: number; delta: number }) {
  const points = [38, 44, 41, 56, 52, 63, 68, 72, 70]
  const max    = Math.max(...points)

  return (
    <div className="col-span-12 md:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Total revenue · today</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-serif text-6xl leading-none text-slate-900">₱{amount.toLocaleString()}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className={`inline-flex items-center gap-1 rounded-full ${delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} px-2 py-0.5 text-xs font-medium`}>
          <Icon name={delta >= 0 ? 'TrendingUp' : 'TrendingDown'} size={12} />
          {delta >= 0 ? '+' : ''}{delta}%
        </span>
        <span className="text-slate-500">vs. yesterday</span>
      </div>
      <svg viewBox="0 0 200 60" className="mt-4 w-full">
        <defs>
          <linearGradient id="rev-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M 0 ${60 - (points[0] / max) * 50} ${points.map((p, i) => `L ${(i / (points.length - 1)) * 200} ${60 - (p / max) * 50}`).join(' ')} L 200 60 L 0 60 Z`}
          fill="url(#rev-grad)"
        />
        <path
          d={`M 0 ${60 - (points[0] / max) * 50} ${points.map((p, i) => `L ${(i / (points.length - 1)) * 200} ${60 - (p / max) * 50}`).join(' ')}`}
          fill="none" stroke="#F59E0B" strokeWidth="2"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-slate-400">
        <span>8 AM</span><span>noon</span><span>4 PM</span>
      </div>
    </div>
  )
}

/* ── Metric: Active members ───────────────────────────────────────── */

function ActiveUsersCard({ users, count }: { users: (typeof MEMBERS[number] | undefined)[]; count: number }) {
  return (
    <div className="col-span-12 md:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Active members</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-serif text-6xl leading-none text-slate-900">{count}</span>
        <span className="text-sm text-slate-500">checked in</span>
      </div>
      <div className="mt-5 flex -space-x-2">
        {users.filter(Boolean).slice(0, 5).map((u, i) => (
          <Avatar key={i} member={u!} size={32} ring />
        ))}
        {count > 5 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-white ring-2 ring-white">
            +{count - 5}
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-slate-500">
        <span className="font-medium text-slate-900">3 visitors</span> waiting at the front desk.
      </div>
    </div>
  )
}

/* ── Breakdown bar ────────────────────────────────────────────────── */

function BreakdownCard({ type, day }: { type: string; day: Record<string, { maintenance?: true }> }) {
  const list  = ALL_SPACES.filter(s => s.type === type)
  const used  = list.filter(s => day[s.id] && !day[s.id].maintenance).length
  const total = list.length
  const pct   = (used / total) * 100
  const meta  = TYPE_META[type]
  const accentBar = { amber: 'bg-amber-500', emerald: 'bg-emerald-500', slate: 'bg-slate-700' }[meta.accent]

  return (
    <div className="col-span-12 md:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-700">
            <Icon name={meta.icon} size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{meta.plural}</div>
            <div className="text-xs text-slate-500">{used}/{total} occupied</div>
          </div>
        </div>
        <div className="font-serif text-2xl text-slate-900">{Math.round(pct)}%</div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full ${accentBar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ── Space detail modal ───────────────────────────────────────────── */

const HOURS_RANGE = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM – 9 PM

function SpaceDetailModal({
  space, slot, onToggleMaintenance, onClose,
}: {
  space: Space
  slot?: { start?: number; end?: number; maintenance?: true }
  onToggleMaintenance: () => void
  onClose: () => void
}) {
  const isMaint  = !!(slot?.maintenance)
  const isBooked = !isMaint && slot !== undefined
  const isRoom   = space.type === 'room'

  function hourStatus(h: number): 'booked' | 'free' | 'maint' {
    if (isMaint) return 'maint'
    if (isBooked && slot && h >= (slot.start ?? 0) && h < (slot.end ?? 0)) return 'booked'
    return 'free'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-serif text-2xl text-slate-900">{space.label}</div>
            <div className="mt-0.5 text-xs uppercase tracking-wider text-slate-400">
              {TYPE_META[space.type].label}
              {isRoom && space.capacity ? ` · ${space.capacity} people` : ''}
              {' · '}{space.zone}
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-stone-100">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Status badge */}
        <div className="mt-4">
          {isMaint ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
              <Icon name="Wrench" size={13} /> Under maintenance
            </span>
          ) : isBooked && slot ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Reserved {fmtHourShort(slot.start ?? 0)} – {fmtHourShort(slot.end ?? 0)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available all day
            </span>
          )}
        </div>

        {/* Hourly timeline */}
        <div className="mt-5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">Hourly schedule</div>
          <div className="flex gap-0.5">
            {HOURS_RANGE.map(h => {
              const s = hourStatus(h)
              return (
                <div key={h} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`h-8 w-full rounded-md ${
                    s === 'booked' ? 'bg-amber-400'
                    : s === 'maint' ? 'bg-slate-200'
                    : 'bg-emerald-100'
                  }`} />
                  <span className="text-[9px] text-slate-400">{h <= 12 ? h : h - 12}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-100 border border-emerald-200" /> Free</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" /> Reserved</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-200" /> Maintenance</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => { onToggleMaintenance(); onClose() }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-700 hover:bg-stone-50"
          >
            <Icon name="Wrench" size={14} />
            {isMaint ? 'Mark available' : 'Mark maintenance'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Inventory tile ───────────────────────────────────────────────── */

function InventoryTile({
  space, slot, onClick,
}: {
  space: Space
  slot?: { start?: number; end?: number; maintenance?: true }
  onClick: () => void
}) {
  const isMaint  = !!(slot?.maintenance)
  const isBooked = !isMaint && slot !== undefined
  const isRoom   = space.type === 'room'

  const baseCls = isMaint
    ? 'border-slate-200 bg-stone-100'
    : isBooked
    ? 'border-amber-200 bg-amber-50/70'
    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft'

  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-2xl border ${baseCls} p-3 text-left transition`}
    >
      <div className="font-serif text-xl text-slate-900">
        {isRoom ? space.label : space.id.split('-')[1]}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {isRoom ? `${TYPE_META[space.type].label} · ${space.capacity}p` : TYPE_META[space.type].label}
      </div>

      <div className="mt-2">
        {isMaint ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
            <Icon name="Wrench" size={10} /> Maintenance
          </div>
        ) : isBooked && slot ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Reserved {fmtHourShort(slot.start ?? 0)}–{fmtHourShort(slot.end ?? 0)}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available
          </div>
        )}
      </div>
    </button>
  )
}

/* ── Activity feed ────────────────────────────────────────────────── */

const WHEN_LABELS = ['2m ago','8m ago','14m ago','27m ago','41m ago','1h ago','1h ago','2h ago']

function ActivityFeed({ day }: { day: Record<string, { memberIdx?: number; start?: number; end?: number; maintenance?: true }> }) {
  const entries = Object.entries(day)
    .filter(([, s]) => !s.maintenance)
    .slice(0, 8)
    .map(([spaceId, s], i) => ({
      id: spaceId,
      member: s.memberIdx !== undefined ? MEMBERS[s.memberIdx] : undefined,
      space:  ALL_SPACES.find(x => x.id === spaceId),
      when:   WHEN_LABELS[i] ?? '2h ago',
      action: i % 3 === 0 ? 'checked in to' : i % 3 === 1 ? 'booked' : 'swapped seat to',
    }))

  return (
    <div className="col-span-12 lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Live activity</div>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">What just happened</h3>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" /> Live
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {entries.map(e => e.member && e.space && (
          <li key={e.id} className="flex items-center gap-3 py-3">
            <Avatar member={e.member} size={32} />
            <div className="flex-1">
              <div className="text-sm text-slate-900">
                <span className="font-medium">{e.member.name}</span>{' '}
                <span className="text-slate-500">{e.action}</span>{' '}
                <span className="font-medium">{e.space.label}</span>
              </div>
              <div className="text-xs text-slate-500">{e.member.plan} · {e.space.zone}</div>
            </div>
            <div className="font-mono text-[11px] text-slate-400">{e.when}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Maintenance queue ────────────────────────────────────────────── */

const STATIC_TICKETS = [
  { id: 'T-104', label: 'Espresso machine descale',   zone: 'Pantry',              due: 'Today' },
  { id: 'T-103', label: 'HVAC zone north — filter',   zone: 'Open Floor — North',  due: 'Tomorrow' },
  { id: 'T-101', label: 'Atlas display HDMI port',    zone: 'Boardrooms',           due: 'May 22' },
]

function MaintenanceQueue({
  day, dKey,
}: { day: Record<string, { maintenance?: true }>; dKey: string }) {
  const app             = useApp()
  const maintenanceItems = Object.entries(day).filter(([, s]) => s.maintenance)

  return (
    <div className="col-span-12 lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Maintenance</div>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{maintenanceItems.length + STATIC_TICKETS.length} open</h3>
        </div>
        <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300">
          New ticket
        </button>
      </div>
      <ul className="space-y-3">
        {maintenanceItems.map(([id]) => {
          const space = ALL_SPACES.find(s => s.id === id)
          return space && (
            <li key={id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-stone-50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-300">
                <Icon name="Wrench" size={14} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{space.label} out of service</div>
                <div className="text-xs text-slate-500">{space.zone}</div>
              </div>
              <button
                onClick={() => app.toggleMaintenance(id, dKey)}
                className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-600"
              >
                Mark ready
              </button>
            </li>
          )
        })}
        {STATIC_TICKETS.map(t => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Icon name="AlertTriangle" size={14} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{t.label}</div>
              <div className="text-xs text-slate-500">{t.zone} · due {t.due}</div>
            </div>
            <div className="font-mono text-[10px] text-slate-400">{t.id}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Main admin view ──────────────────────────────────────────────── */

interface PendingPayment {
  id: string
  space: { label: string; type: string; zone: string } | null
  date: string
  start_hour: number
  end_hour: number
  price: number
  admin_deadline: string | null
  user: { full_name: string; email: string } | null
}

export function AdminView() {
  const app = useApp()
  const { tenant } = useTenant()

  const [adminTab,    setAdminTab]    = useState<AdminTab>('operations')
  const [dateOffset,  setDateOffset]  = useState(0)
  const [zoneFilter,  setZoneFilter]  = useState('all')
  const [searchQ,     setSearchQ]     = useState('')
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])

  useEffect(() => {
    if (!tenant) return
    sb.from('bookings')
      .select('id, date, start_hour, end_hour, price, admin_deadline, space:spaces(label, type, zone), user:profiles(full_name, email)')
      .eq('tenant_id', tenant.id)
      .eq('payment_status', 'awaiting_confirmation')
      .order('admin_deadline', { ascending: true })
      .then(({ data }: { data: PendingPayment[] | null }) => {
        if (data) setPendingPayments(data)
      })
  }, [tenant?.id])

  const date   = addDays(TODAY, dateOffset)
  const dKey   = dateKey(date)
  const day    = app.occupancy[dKey] ?? {}

  // Metrics
  const totalSpaces    = ALL_SPACES.length
  const occupiedCount  = Object.values(day).filter(s => !s.maintenance).length
  const maintCount     = Object.values(day).filter(s => s.maintenance).length
  const occPct         = Math.round((occupiedCount / totalSpaces) * 100)

  const revenue = Math.round(
    Object.values(day).reduce((sum, s) => {
      if (s.maintenance) return sum
      const hrs = (s.end ?? 17) - (s.start ?? 9)
      return sum + hrs * 5 + 20
    }, 0)
  )

  const yKey  = dateKey(addDays(date, -1))
  const yDay  = app.occupancy[yKey] ?? {}
  const yRev  = Math.round(Object.values(yDay).reduce((s, x) => s + (x.maintenance ? 0 : ((x.end ?? 17) - (x.start ?? 9)) * 5 + 20), 0))
  const revDelta = yRev > 0 ? Math.round(((revenue - yRev) / yRev) * 100) : 0

  const zones = Array.from(new Set(ALL_SPACES.map(s => s.zone)))

  const filteredSpaces = ALL_SPACES.filter(s => {
    if (zoneFilter !== 'all' && s.zone !== zoneFilter) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      const slotMember = day[s.id] && !day[s.id].maintenance && day[s.id].memberIdx !== undefined
        ? (MEMBERS[day[s.id].memberIdx!]?.name ?? '').toLowerCase()
        : ''
      return s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || slotMember.includes(q)
    }
    return true
  })

  const activeUsers = Object.entries(day).filter(([, s]) => !s.maintenance).slice(0, 6).map(([, s]) => MEMBERS[s.memberIdx ?? 0])

  return (
    <div className="mx-auto max-w-[1400px] px-8 pb-24 pt-10">

      {/* ── Admin tab bar ───────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setAdminTab('operations')}
          className={`flex items-center gap-2.5 rounded-2xl border px-5 py-2.5 text-sm font-medium transition ${
            adminTab === 'operations'
              ? 'border-slate-900 bg-slate-900 text-white shadow-soft'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <Icon name="BarChart2" size={14} />
          Operations
          <span className={`text-xs ${adminTab === 'operations' ? 'text-white/50' : 'text-slate-400'}`}>
            Floor · Activity · Revenue
          </span>
        </button>
        <button
          onClick={() => setAdminTab('setup')}
          className={`flex items-center gap-2.5 rounded-2xl border px-5 py-2.5 text-sm font-medium transition ${
            adminTab === 'setup'
              ? 'border-slate-900 bg-slate-900 text-white shadow-soft'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <Icon name="Settings2" size={14} />
          Studio Setup
          <span className={`text-xs ${adminTab === 'setup' ? 'text-white/50' : 'text-slate-400'}`}>
            Profile · Spaces · Plans
          </span>
          {adminTab !== 'setup' && (
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
              Configure
            </span>
          )}
        </button>
      </div>

      {/* ── Setup panel ─────────────────────────────────────────────── */}
      {adminTab === 'setup' && <SetupPanel />}

      {/* ── Operations panel ────────────────────────────────────────── */}
      {adminTab === 'operations' && <>

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-6 fade-up">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
            <Icon name="ShieldCheck" size={13} /> Admin · Operator
          </div>
          <h1 className="mt-2 text-[52px] leading-[1.05] tracking-tight text-slate-900">
            The studio is{' '}
            <span className="serif-italic text-amber-700">{occPct}% full</span>{' '}
            {dateOffset === 0 ? 'right now.' : <span className="serif-italic">on this day.</span>}
          </h1>
          <div className="mt-2 text-sm text-slate-500">
            {fmtLongDate(date)} · Last sync 2 min ago · Operator: <span className="text-slate-900">HNSCorpPH</span>
          </div>
        </div>

        {/* Date stepper */}
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-soft">
          <button
            onClick={() => setDateOffset(x => Math.max(0, x - 1))}
            disabled={dateOffset === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-stone-100 disabled:text-slate-300"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="px-3 text-sm font-medium text-slate-900">
            {dateOffset === 0 ? 'Today' : fmtLongDate(date)}
          </div>
          <button
            onClick={() => setDateOffset(x => Math.min(13, x + 1))}
            disabled={dateOffset === 13}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-stone-100 disabled:text-slate-300"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </header>

      {/* Metric cards */}
      <section className="mt-10 grid grid-cols-12 gap-4">
        <OccupancyCard pct={occPct} occupied={occupiedCount} total={totalSpaces - maintCount} />
        <RevenueCard   amount={revenue} delta={revDelta} />
        <ActiveUsersCard users={activeUsers} count={occupiedCount} />
      </section>

      {/* Breakdown by type */}
      <section className="mt-4 grid grid-cols-12 gap-4">
        <BreakdownCard type="hot"       day={day} />
        <BreakdownCard type="dedicated" day={day} />
        <BreakdownCard type="room"      day={day} />
      </section>

      {/* Pending payments */}
      {pendingPayments.length > 0 && (
        <section className="mt-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Pending payments</div>
          <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">
            {pendingPayments.length} <span className="serif-italic">awaiting confirmation</span>.
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {pendingPayments.map(p => (
              <div key={p.id} className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-serif text-xl text-slate-900">{p.space?.label}</div>
                    <div className="text-xs text-slate-500">{p.space?.zone} · {fmtLongDate(parseKey(p.date))}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">{fmtHourShort(p.start_hour)} – {fmtHourShort(p.end_hour)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium text-slate-900">₱{p.price.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{p.user?.full_name || p.user?.email || 'Unknown'}</div>
                  </div>
                </div>
                {p.admin_deadline && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Icon name="Clock" size={12} />
                    Confirm within <CountdownTimer deadline={p.admin_deadline} />
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={async () => {
                      await sb.from('bookings').update({ payment_status: 'confirmed' }).eq('id', p.id)
                      setPendingPayments(ps => ps.filter(x => x.id !== p.id))
                    }}
                    className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Confirm payment
                  </button>
                  <button
                    onClick={async () => {
                      await sb.from('bookings').update({ payment_status: 'expired' }).eq('id', p.id)
                      setPendingPayments(ps => ps.filter(x => x.id !== p.id))
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-stone-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floor inventory */}
      <section className="mt-12">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Floor map</div>
            <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">
              Who&rsquo;s <span className="serif-italic">sitting where</span>.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Icon name="Search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search member or seat…"
                className="w-64 rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <Pill active={zoneFilter === 'all'} onClick={() => setZoneFilter('all')}>All zones</Pill>
            {zones.map(z => (
              <Pill key={z} active={zoneFilter === z} onClick={() => setZoneFilter(z)}>{z}</Pill>
            ))}
          </div>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          {zones
            .filter(z => zoneFilter === 'all' || zoneFilter === z)
            .map(zone => {
              const items = filteredSpaces.filter(s => s.zone === zone)
              if (items.length === 0) return null
              const gridCls = items[0].type === 'room'
                ? 'grid-cols-1 md:grid-cols-3'
                : items[0].type === 'dedicated'
                ? 'grid-cols-2 md:grid-cols-4'
                : 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-8'

              return (
                <div key={zone} className="mb-8 last:mb-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{zone}</h3>
                    <span className="text-xs text-slate-500">
                      {items.length} spaces · {items.filter(s => day[s.id] && !day[s.id].maintenance).length} occupied
                    </span>
                  </div>
                  <div className={`grid gap-2 ${gridCls}`}>
                    {items.map(s => (
                      <InventoryTile
                        key={s.id}
                        space={s}
                        slot={day[s.id]}
                        onClick={() => setSelectedSpace(s)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </section>

      {/* Activity + maintenance */}
      <section className="mt-8 grid grid-cols-12 gap-4">
        <ActivityFeed     day={day} />
        <MaintenanceQueue day={day} dKey={dKey} />
      </section>

      </>}

      {selectedSpace && (
        <SpaceDetailModal
          space={selectedSpace}
          slot={day[selectedSpace.id]}
          onToggleMaintenance={() => { app.toggleMaintenance(selectedSpace.id, dKey); setSelectedSpace(null) }}
          onClose={() => setSelectedSpace(null)}
        />
      )}
    </div>
  )
}
