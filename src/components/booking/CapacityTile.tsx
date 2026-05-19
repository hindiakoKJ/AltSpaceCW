interface CapacityCount { avail: number; total: number }

interface CapacityTileProps {
  hot:  CapacityCount
  ded:  CapacityCount
  room: CapacityCount
}

function PulseRing({ pct }: { pct: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="-mr-1">
      <circle cx="34" cy="34" r={r} stroke="#E7E5E0" strokeWidth="6" fill="none" />
      <circle
        cx="34" cy="34" r={r}
        stroke="#F59E0B" strokeWidth="6" fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 34 34)"
      />
      <text x="34" y="38" textAnchor="middle" fontFamily="Instrument Serif" fontSize="18" fill="#0F172A">{pct}</text>
    </svg>
  )
}

function CapacityRow({
  label, avail, total, tone, subtitle, pinned,
}: {
  label: string; avail: number; total: number
  tone: 'amber' | 'emerald' | 'slate'; subtitle: string; pinned?: boolean
}) {
  const pct = total === 0 ? 0 : (avail / total) * 100
  const tones = {
    amber:   { bar: 'bg-amber-500',   bg: 'bg-amber-50' },
    emerald: { bar: 'bg-emerald-500', bg: 'bg-emerald-50' },
    slate:   { bar: 'bg-slate-700',   bg: 'bg-slate-100' },
  }
  const t = tones[tone]

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-medium text-slate-900">
            {label}
            {pinned && (
              <span className="ml-1 inline-block rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                Booked
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-slate-500">
            <span className="text-slate-900">{avail}</span>/{total}
          </div>
        </div>
        <div className={`mt-1.5 h-1.5 w-full overflow-hidden rounded-full ${t.bg}`}>
          <div className={`h-full ${t.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-[11px] text-slate-500">{subtitle}</div>
      </div>
    </div>
  )
}

export function CapacityTile({ hot, ded, room }: CapacityTileProps) {
  const totalSpaces = hot.total + ded.total + room.total
  const usedSpaces  = (hot.total - hot.avail) + (ded.total - ded.avail) + (room.total - room.avail)
  const todayPct    = Math.round((usedSpaces / totalSpaces) * 100)

  return (
    <div className="w-[360px] rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Studio pulse</div>
          <div className="mt-1 font-serif text-3xl text-slate-900">
            {todayPct}% <span className="text-slate-400">busy</span>
          </div>
        </div>
        <PulseRing pct={todayPct} />
      </div>

      <div className="mt-5 space-y-3">
        <CapacityRow label="Hot Desks"      avail={hot.avail}  total={hot.total}  tone="amber"   subtitle="Open floor, BYO laptop" />
        <CapacityRow label="Dedicated"      avail={ded.avail}  total={ded.total}  tone="emerald" subtitle="Quiet wing · monitor" />
        <CapacityRow label="Meeting Room B" avail={room.avail} total={room.total} tone="slate"   subtitle="Booked until 2 PM" pinned />
      </div>
    </div>
  )
}
