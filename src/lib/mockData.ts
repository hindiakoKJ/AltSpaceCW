import type { Space, Member, OccupancyMap, Booking, TypeMeta } from '../types/app'
import { TODAY, dateKey, addDays } from './dateHelpers'

/* ─── Inventory ──────────────────────────────────────────────────── */

export const HOT_DESKS: Space[] = Array.from({ length: 20 }, (_, i) => ({
  id:     `HD-${String(i + 1).padStart(2, '0')}`,
  label:  `Hot Desk ${i + 1}`,
  type:   'hot',
  zone:   i < 10 ? 'Open Floor — North' : 'Open Floor — South',
  price:  25,
  hourly: 5,
}))

export const DEDICATED: Space[] = Array.from({ length: 8 }, (_, i) => ({
  id:     `DD-${String(i + 1).padStart(2, '0')}`,
  label:  `Dedicated ${i + 1}`,
  type:   'dedicated',
  zone:   'Quiet Wing',
  price:  45,
  hourly: 9,
}))

export const ROOMS: Space[] = [
  { id: 'RM-ATLAS',  label: 'Atlas',  type: 'room', zone: 'Boardrooms',   capacity: 8, price: 25, hourly: 25 },
  { id: 'RM-MERCER', label: 'Mercer', type: 'room', zone: 'Boardrooms',   capacity: 6, price: 22, hourly: 22 },
  { id: 'RM-VEGA',   label: 'Vega',   type: 'room', zone: 'Phone Booths', capacity: 4, price: 18, hourly: 18 },
]

export const ALL_SPACES: Space[] = [...HOT_DESKS, ...DEDICATED, ...ROOMS]

export const TYPE_META: Record<string, TypeMeta> = {
  hot:       { label: 'Hot Desk',        plural: 'Hot Desks',        accent: 'amber',   icon: 'Coffee' },
  dedicated: { label: 'Dedicated Desk',  plural: 'Dedicated Desks',  accent: 'emerald', icon: 'Monitor' },
  room:      { label: 'Conference Room', plural: 'Conference Rooms', accent: 'slate',   icon: 'Users' },
}

/* ─── Members ────────────────────────────────────────────────────── */

export const MEMBERS: Member[] = [
  { name: 'Maya Chen',      avatar: 'MC', color: 'bg-amber-100 text-amber-900',     plan: 'Resident',  isMe: true },
  { name: 'Idris Okafor',   avatar: 'IO', color: 'bg-emerald-100 text-emerald-900', plan: 'Resident' },
  { name: 'Lena Park',      avatar: 'LP', color: 'bg-sky-100 text-sky-900',         plan: 'Flex' },
  { name: 'Noah Albright',  avatar: 'NA', color: 'bg-rose-100 text-rose-900',       plan: 'Flex' },
  { name: 'Priya Raman',    avatar: 'PR', color: 'bg-violet-100 text-violet-900',   plan: 'Resident' },
  { name: 'Tomás Reyes',    avatar: 'TR', color: 'bg-orange-100 text-orange-900',   plan: 'Day pass' },
  { name: 'Hana Sato',      avatar: 'HS', color: 'bg-teal-100 text-teal-900',       plan: 'Resident' },
  { name: 'Jules Whitford', avatar: 'JW', color: 'bg-stone-200 text-stone-800',     plan: 'Flex' },
  { name: 'Ade Bashir',     avatar: 'AB', color: 'bg-indigo-100 text-indigo-900',   plan: 'Resident' },
  { name: 'Cleo Martín',    avatar: 'CM', color: 'bg-pink-100 text-pink-900',       plan: 'Day pass' },
  { name: 'Sasha Vega',     avatar: 'SV', color: 'bg-lime-100 text-lime-900',       plan: 'Flex' },
  { name: 'Owen Kessler',   avatar: 'OK', color: 'bg-cyan-100 text-cyan-900',       plan: 'Resident' },
]

export const CURRENT_USER = MEMBERS[0]

/* ─── Seed occupancy ─────────────────────────────────────────────── */

export function buildSeedOccupancy(): OccupancyMap {
  const map: OccupancyMap = {}
  const todayKey = dateKey(TODAY)

  // Today's bookings
  const occupiedToday: [string, number, number, number][] = [
    ['HD-01', 1, 9, 17], ['HD-02', 2, 10, 14], ['HD-03', 3, 9, 12],
    ['HD-05', 4, 8, 18], ['HD-06', 5, 13, 17], ['HD-08', 6, 9, 13],
    ['HD-10', 7, 10, 16], ['HD-12', 8, 9, 17], ['HD-14', 9, 14, 18],
    ['HD-16', 10, 11, 15], ['HD-17', 11, 9, 17], ['HD-19', 2, 9, 12],
    ['DD-01', 1, 9, 18], ['DD-02', 8, 9, 18], ['DD-03', 4, 9, 18],
    ['DD-05', 7, 9, 18], ['DD-06', 11, 9, 18],
    ['RM-ATLAS',  3, 13, 14],
    ['RM-MERCER', 5, 10, 11],
  ]

  map[todayKey] = {}
  occupiedToday.forEach(([id, memberIdx, start, end]) => {
    map[todayKey][id] = { memberIdx, start, end }
  })
  map[todayKey]['HD-20'] = { maintenance: true }
  map[todayKey]['DD-08'] = { maintenance: true }

  // Sprinkle upcoming days
  for (let d = 1; d <= 13; d++) {
    const k = dateKey(addDays(TODAY, d))
    map[k] = {}
    const count = 6 + ((d * 3) % 9)
    for (let i = 0; i < count; i++) {
      const idx = (d * 7 + i * 3) % HOT_DESKS.length
      const memberIdx = ((d + i) % (MEMBERS.length - 1)) + 1
      map[k][HOT_DESKS[idx].id] = { memberIdx, start: 9, end: 17 }
    }
  }

  return map
}

/* ─── Seed bookings for current user ────────────────────────────── */

export function buildSeedBookings(): Booking[] {
  return [
    // Upcoming
    { id: 'b-up1', space: ALL_SPACES.find(s => s.id === 'DD-04')!,    date: dateKey(addDays(TODAY, 1)), start: 9,  end: 17, price: 45, status: 'upcoming' },
    { id: 'b-up2', space: ALL_SPACES.find(s => s.id === 'RM-ATLAS')!, date: dateKey(addDays(TODAY, 3)), start: 14, end: 16, price: 50, status: 'upcoming' },
    { id: 'b-up3', space: ALL_SPACES.find(s => s.id === 'HD-07')!,    date: dateKey(addDays(TODAY, 6)), start: 9,  end: 17, price: 25, status: 'upcoming' },
    // Past
    { id: 'b-p1', space: ALL_SPACES.find(s => s.id === 'HD-04')!,     date: dateKey(addDays(TODAY, -2)),  start: 9,  end: 17, price: 25, status: 'past' },
    { id: 'b-p2', space: ALL_SPACES.find(s => s.id === 'DD-04')!,     date: dateKey(addDays(TODAY, -5)),  start: 9,  end: 18, price: 45, status: 'past' },
    { id: 'b-p3', space: ALL_SPACES.find(s => s.id === 'RM-MERCER')!, date: dateKey(addDays(TODAY, -7)),  start: 10, end: 12, price: 44, status: 'past' },
    { id: 'b-p4', space: ALL_SPACES.find(s => s.id === 'HD-09')!,     date: dateKey(addDays(TODAY, -12)), start: 9,  end: 13, price: 20, status: 'past' },
    { id: 'b-p5', space: ALL_SPACES.find(s => s.id === 'HD-11')!,     date: dateKey(addDays(TODAY, -18)), start: 9,  end: 17, price: 25, status: 'past' },
  ]
}
