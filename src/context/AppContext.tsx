import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type { AppContextValue, Booking, OccupancyMap, ToastState, UserRole, ViewType } from '../types/app'
import { buildSeedBookings, buildSeedOccupancy, ALL_SPACES } from '../lib/mockData'
import { dateKey, fmtLongDate, parseKey } from '../lib/dateHelpers'

const AppCtx = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView]         = useState<ViewType>('book')
  const [userRole, setUserRole] = useState<UserRole>('client')
  const [occupancy, setOccupancy] = useState<OccupancyMap>(() => buildSeedOccupancy())
  const [myBookings, setMyBookings] = useState<Booking[]>(() => buildSeedBookings())
  const [toast, setToast]         = useState<ToastState | null>(null)
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(t: ToastState) {
    setToast(t)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  function isOccupied(spaceId: string, dKey: string, start: number, end: number): boolean {
    const day = occupancy[dKey]
    if (!day) return false
    const slot = day[spaceId]
    if (!slot) return false
    if (slot.maintenance) return true
    // overlap check
    return !(end <= (slot.start ?? 0) || start >= (slot.end ?? 24))
  }

  function addBooking(b: Omit<Booking, 'id' | 'status'>) {
    const id = `b-${Math.random().toString(36).slice(2, 8)}`
    const booking: Booking = { ...b, id, status: 'upcoming' }
    setMyBookings(bs => [booking, ...bs])
    setOccupancy(o => {
      const next = { ...o, [b.date]: { ...(o[b.date] ?? {}) } }
      next[b.date][b.space.id] = { memberIdx: 0, start: b.start, end: b.end, mine: true }
      return next
    })
    showToast({ kind: 'success', title: 'Booking confirmed', body: `${b.space.label} · ${fmtLongDate(parseKey(b.date))}` })
  }

  function cancelBooking(id: string) {
    const b = myBookings.find(x => x.id === id)
    setMyBookings(bs => bs.filter(x => x.id !== id))
    if (b) {
      setOccupancy(o => {
        if (!o[b.date]) return o
        const dayCopy = { ...o[b.date] }
        if (dayCopy[b.space.id]?.mine) delete dayCopy[b.space.id]
        return { ...o, [b.date]: dayCopy }
      })
      showToast({ kind: 'info', title: 'Booking cancelled', body: `${b.space.label} · ${fmtLongDate(parseKey(b.date))}` })
    }
  }

  function toggleMaintenance(spaceId: string, dKey: string) {
    setOccupancy(o => {
      const day = { ...(o[dKey] ?? {}) }
      if (day[spaceId]?.maintenance) {
        delete day[spaceId]
        showToast({ kind: 'info', title: 'Back in service', body: spaceId })
      } else {
        day[spaceId] = { maintenance: true }
        showToast({ kind: 'info', title: 'Marked under maintenance', body: spaceId })
      }
      return { ...o, [dKey]: day }
    })
  }

  // Re-export parseKey so components can use it via context
  const value: AppContextValue = {
    view, setView,
    userRole, setUserRole,
    occupancy, isOccupied, toggleMaintenance,
    myBookings, addBooking, cancelBooking,
    toast,
    parseKey,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

// Suppress unused import warning — ALL_SPACES used by consumers
void ALL_SPACES
void dateKey
