import type { Space } from '../../types/app'

export interface AnnotatedSpace extends Space {
  occupied: boolean
  slot?: { memberIdx?: number; start?: number; end?: number; maintenance?: true; mine?: true }
}

interface SpaceGridProps {
  spaces:     AnnotatedSpace[]
  selectedId: string | null
  onSelect:   (id: string) => void
  hours:      number
  priceFor:   (space: Space, hrs: number) => number
}

function StatePip({
  occupied, maintenance, selected, absolute,
}: { occupied: boolean; maintenance: boolean; selected: boolean; absolute?: boolean }) {
  let color = 'bg-emerald-500'
  if (maintenance) color = 'bg-slate-400'
  else if (occupied) color = 'bg-rose-400'
  if (selected) color = 'bg-amber-500'

  return (
    <span className={`${absolute ? 'absolute right-2 top-2' : ''} inline-flex h-2 w-2 rounded-full ${color}`} />
  )
}

function SpaceTile({
  space, selected, onClick, hours, priceFor,
}: {
  space: AnnotatedSpace; selected: boolean
  onClick: () => void; hours: number
  priceFor: (s: Space, h: number) => number
}) {
  const isRoom       = space.type === 'room'
  const isDed        = space.type === 'dedicated'
  const occupied     = space.occupied
  const maintenance  = !!(space.slot?.maintenance)

  const stateClass = selected
    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/30'
    : maintenance
    ? 'border-slate-200 bg-stone-100 text-slate-400'
    : occupied
    ? 'border-slate-200 bg-stone-50 text-slate-400'
    : 'border-slate-200 bg-white hover:border-slate-900'

  if (isRoom) {
    return (
      <button
        onClick={onClick}
        disabled={occupied}
        className={`flex flex-col gap-3 rounded-2xl border p-5 text-left transition shadow-soft ${stateClass}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-serif text-3xl text-slate-900">{space.label}</div>
            <div className="text-xs text-slate-500">{space.zone} · seats {space.capacity}</div>
          </div>
          <StatePip occupied={occupied} maintenance={maintenance} selected={selected} />
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div className="text-xs text-slate-500">₱{space.hourly}/hr</div>
          {!occupied && (
            <div className="text-sm font-medium text-slate-900">
              ₱{priceFor(space, hours || 1)}
              <span className="text-xs text-slate-500"> / {hours || 1}h</span>
            </div>
          )}
          {occupied && !maintenance && (
            <div className="text-xs font-medium text-rose-700">Booked til 2 PM</div>
          )}
          {maintenance && <div className="text-xs font-medium text-slate-500">Maintenance</div>}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={occupied}
      className={`group relative flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-4 transition ${stateClass} ${isDed ? 'h-24' : 'h-20'}`}
    >
      <StatePip occupied={occupied} maintenance={maintenance} selected={selected} absolute />
      <div className={`font-serif ${isDed ? 'text-2xl' : 'text-xl'} leading-none ${occupied ? 'text-slate-400' : 'text-slate-900'}`}>
        {space.id.split('-')[1]}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {space.type === 'hot' ? 'Hot' : 'Ded'}
      </div>
      {!occupied && (
        <div className="mt-0.5 font-mono text-[10px] text-slate-500">₱{space.hourly}/h</div>
      )}
    </button>
  )
}

const GROUPS = [
  { type: 'hot',       label: 'Hot Desks',        gridCls: 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-6' },
  { type: 'dedicated', label: 'Dedicated Desks',   gridCls: 'grid-cols-2 sm:grid-cols-4' },
  { type: 'room',      label: 'Conference Rooms',  gridCls: 'grid-cols-1 sm:grid-cols-3' },
]

export function SpaceGrid({ spaces, selectedId, onSelect, hours, priceFor }: SpaceGridProps) {
  return (
    <div className="space-y-8">
      {GROUPS.map(g => {
        const items = spaces.filter(s => s.type === g.type)
        if (items.length === 0) return null
        return (
          <div key={g.type}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{g.label}</h3>
              <span className="text-xs text-slate-500">
                {items.filter(s => !s.occupied).length} open · {items.length} total
              </span>
            </div>
            <div className={`grid gap-2 ${g.gridCls}`}>
              {items.map(s => (
                <SpaceTile
                  key={s.id}
                  space={s}
                  selected={selectedId === s.id}
                  onClick={() => !s.occupied && onSelect(s.id)}
                  hours={hours}
                  priceFor={priceFor}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
