import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Space } from '../../types/app'
import { useApp } from '../../context/AppContext'
import { ALL_SPACES } from '../../lib/mockData'
import { TODAY, DAYS, MONTHS, addDays, dateKey, sameDay, fmtRange } from '../../lib/dateHelpers'
import { useDragScroll } from '../../hooks/useDragScroll'
import { Pill } from '../ui/Pill'
import { CapacityTile } from './CapacityTile'
import { SpaceGrid } from './SpaceGrid'
import type { AnnotatedSpace } from './SpaceGrid'
import { BookingSummary } from './BookingSummary'
import { ConfirmModal } from './ConfirmModal'

type FilterType = 'all' | 'hot' | 'dedicated' | 'room'

function Section({
  eyebrow, title, right, children,
}: { eyebrow: string; title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{eyebrow}</div>
          <h2 className="mt-1 text-[26px] leading-tight tracking-tight text-slate-900">{title}</h2>
        </div>
        {right}
      </header>
      {children}
    </section>
  )
}

function priceFor(space: Space, hrs: number): number {
  if (space.type === 'room') return space.hourly * hrs
  if (hrs >= 8) return space.price   // day rate
  return space.hourly * hrs
}

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i) // 8..19

export function BookingView() {
  const app = useApp()

  const [selectedDate, setSelectedDate] = useState<Date>(TODAY)
  const [filter,       setFilter]       = useState<FilterType>('all')
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [showConfirm,   setShowConfirm]  = useState(false)

  const dKey = dateKey(selectedDate)
  const { ref: dateStripRef, dragHandlers } = useDragScroll()

  /* ── Capacity counts ─────────────────────────────────────────── */
  function countAvail(type: string) {
    const list = ALL_SPACES.filter(s => s.type === type)
    const avail = list.filter(s => !app.isOccupied(s.id, dKey, 9, 17)).length
    return { avail, total: list.length }
  }
  const hot  = countAvail('hot')
  const ded  = countAvail('dedicated')
  const room = countAvail('room')

  /* ── Filtered pool ───────────────────────────────────────────── */
  const pool = useMemo(() => {
    if (filter === 'all') return ALL_SPACES
    return ALL_SPACES.filter(s => s.type === filter)
  }, [filter])

  /* ── Time slot helpers ───────────────────────────────────────── */
  function toggleSlot(h: number) {
    setSelectedSlots(cur =>
      cur.includes(h) ? cur.filter(x => x !== h) : [...cur, h].sort((a, b) => a - b)
    )
  }
  const selectFullDay = () => setSelectedSlots(HOURS)
  const clearSlots    = () => setSelectedSlots([])

  const range = useMemo(() => {
    if (selectedSlots.length === 0) return null
    return { start: Math.min(...selectedSlots), end: Math.max(...selectedSlots) + 1 }
  }, [selectedSlots])

  /* ── Annotated spaces ────────────────────────────────────────── */
  const annotated: AnnotatedSpace[] = useMemo(() => {
    const start = range?.start ?? 9
    const end   = range?.end   ?? 17
    return pool.map(s => {
      const occ  = app.isOccupied(s.id, dKey, start, end)
      const slot = (app.occupancy[dKey] ?? {})[s.id]
      return { ...s, occupied: occ, slot }
    })
  }, [pool, range, dKey, app.occupancy])

  const selectedSpace = annotated.find(s => s.id === selectedSpaceId) ?? null

  // Auto-deselect if chosen space becomes occupied
  useEffect(() => {
    if (selectedSpace?.occupied) setSelectedSpaceId(null)
  }, [selectedSpace])

  const hours = range ? range.end - range.start : 0
  const total = selectedSpace ? priceFor(selectedSpace, hours) : 0

  /* ── Date strip ──────────────────────────────────────────────── */
  const stripDays = Array.from({ length: 14 }, (_, i) => addDays(TODAY, i))

  function dayBusyness(d: Date): number {
    const k   = dateKey(d)
    const day = app.occupancy[k] ?? {}
    return Math.min(1, Object.keys(day).length / 22)
  }

  /* ── Confirm handler ─────────────────────────────────────────── */
  function handleConfirm() {
    if (!selectedSpace || !range) return
    app.addBooking({
      space: {
        id: selectedSpace.id, label: selectedSpace.label,
        type: selectedSpace.type, zone: selectedSpace.zone,
        price: selectedSpace.price, hourly: selectedSpace.hourly,
        capacity: selectedSpace.capacity,
      },
      date: dKey,
      start: range.start,
      end:   range.end,
      price: total,
    })
    setShowConfirm(false)
    setSelectedSpaceId(null)
    setSelectedSlots([])
    app.setView('dashboard')
  }

  return (
    <div className="mx-auto max-w-[1320px] px-8 pb-24 pt-10">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <header className="fade-up">
        <div className="flex items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
              AltSpaceCW open · 8:00 AM – 10:00 PM
            </div>
            <h1 className="mt-3 text-[64px] leading-[1.05] tracking-tight text-slate-900">
              Good morning, <span className="serif-italic text-amber-700">Maya.</span>
              <br />
              Let&rsquo;s find you <span className="serif-italic text-slate-700">a good seat.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600">
              The BGC floor is open and the Atlas boardroom is free after 2 PM.
              Book a hot desk, dedicated seat, or the whole afternoon.
            </p>
          </div>
          <div className="hidden shrink-0 lg:block">
            <CapacityTile hot={hot} ded={ded} room={room} />
          </div>
        </div>
      </header>

      {/* ── Controls ──────────────────────────────────────────── */}
      <section className="mt-12 grid grid-cols-12 gap-8">

        {/* LEFT */}
        <div className="col-span-12 xl:col-span-8">

          {/* 01 — Date picker */}
          <Section
            eyebrow="01 · Pick a date"
            title={<>When are you <span className="serif-italic">coming in</span>?</>}
          >
            <div
              ref={dateStripRef}
              className="-mx-1 flex gap-2 overflow-x-auto no-scrollbar pb-2 pl-1 pr-1 cursor-grab"
              {...dragHandlers}
            >
              {stripDays.map(d => {
                const active = sameDay(d, selectedDate)
                const busy   = dayBusyness(d)
                const isT    = sameDay(d, TODAY)
                return (
                  <button
                    key={dateKey(d)}
                    onClick={() => setSelectedDate(d)}
                    className={`group relative flex w-[80px] shrink-0 flex-col items-center rounded-2xl border px-3 py-4 transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white shadow-soft'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-[11px] font-medium uppercase tracking-wider ${active ? 'text-amber-300' : 'text-slate-500'}`}>
                      {isT ? 'Today' : DAYS[d.getDay()]}
                    </span>
                    <span className="mt-1 font-serif text-3xl leading-none">{d.getDate()}</span>
                    <span className={`mt-1 text-[10px] ${active ? 'text-white/70' : 'text-slate-400'}`}>
                      {MONTHS[d.getMonth()]}
                    </span>
                    <span className={`mt-3 h-1 w-8 overflow-hidden rounded-full ${active ? 'bg-white/20' : 'bg-stone-100'}`}>
                      <span
                        className={`block h-full ${
                          active       ? 'bg-amber-400'
                          : busy > 0.7 ? 'bg-rose-400'
                          : busy > 0.4 ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(8, busy * 100)}%` }}
                      />
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* 02 — Filter pills */}
          <Section
            eyebrow="02 · What kind of space"
            title={<>Pick a <span className="serif-italic">vibe</span>.</>}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Pill active={filter === 'all'}       onClick={() => setFilter('all')}       count={ALL_SPACES.length} icon="LayoutGrid">All</Pill>
              <Pill active={filter === 'hot'}       onClick={() => setFilter('hot')}       count={hot.avail}         icon="Coffee">Hot Desks</Pill>
              <Pill active={filter === 'dedicated'} onClick={() => setFilter('dedicated')} count={ded.avail}         icon="Monitor">Dedicated</Pill>
              <Pill active={filter === 'room'}      onClick={() => setFilter('room')}      count={room.avail}        icon="Users">Conference Rooms</Pill>
              <div className="ml-auto hidden items-center gap-3 text-xs text-slate-500 sm:flex">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Available</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"   /> Selected</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300"   /> Booked</span>
              </div>
            </div>
          </Section>

          {/* 03 — Time slots */}
          <Section
            eyebrow="03 · Choose your hours"
            title={<>An <span className="serif-italic">hour</span>, an <span className="serif-italic">afternoon</span>, or the <span className="serif-italic">full day</span>.</>}
            right={
              <div className="flex items-center gap-2">
                <button onClick={selectFullDay} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300">
                  Full day · 9–7
                </button>
                <button onClick={clearSlots} className="rounded-full border border-transparent px-3 py-1.5 text-xs text-slate-500 hover:bg-stone-100">
                  Clear
                </button>
              </div>
            }
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>Tap to add hourly slots — contiguous picks are fine.</span>
                {range && (
                  <span className="font-medium text-slate-900">
                    {fmtRange(range.start, range.end)} · {hours}h
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                {HOURS.map(h => {
                  const sel     = selectedSlots.includes(h)
                  const popular = h >= 10 && h <= 15
                  return (
                    <button
                      key={h}
                      onClick={() => toggleSlot(h)}
                      className={`relative flex h-16 flex-col items-center justify-center rounded-xl border text-sm transition ${
                        sel
                          ? 'border-amber-500 bg-amber-500 text-white shadow-soft'
                          : 'border-slate-200 bg-stone-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <span className={`text-[11px] uppercase tracking-wider ${sel ? 'text-amber-100' : 'text-slate-400'}`}>
                        {h < 12 ? 'AM' : 'PM'}
                      </span>
                      <span className="font-serif text-xl leading-none">{((h + 11) % 12) + 1}</span>
                      {popular && !sel && (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          {/* 04 — Space grid */}
          <Section
            eyebrow="04 · Pick your spot"
            title={<>{annotated.filter(s => !s.occupied).length} <span className="serif-italic">open</span> right now.</>}
          >
            <SpaceGrid
              spaces={annotated}
              selectedId={selectedSpaceId}
              onSelect={id => setSelectedSpaceId(id)}
              hours={hours || 8}
              priceFor={priceFor}
            />
          </Section>
        </div>

        {/* RIGHT — summary sidebar */}
        <div className="col-span-12 xl:col-span-4">
          <BookingSummary
            date={selectedDate}
            range={range}
            space={selectedSpace}
            total={total}
            hours={hours}
            onConfirm={() => setShowConfirm(true)}
            onClear={() => { setSelectedSpaceId(null); setSelectedSlots([]) }}
          />
        </div>
      </section>

      {/* Confirm modal */}
      {showConfirm && selectedSpace && range && (
        <ConfirmModal
          date={selectedDate}
          range={range}
          space={selectedSpace}
          total={total}
          hours={hours}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
