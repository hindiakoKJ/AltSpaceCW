import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppContextValue, Booking, BookingStatus, OccupancyMap, Space, ToastState, UserRole, ViewType } from '../types/app'
import type { DbSpace, DbBooking } from '../types/database'
import { ALL_SPACES } from '../lib/mockData'
import { dateKey, fmtLongDate, parseKey } from '../lib/dateHelpers'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

function toAppSpace(db: DbSpace): Space {
  return {
    id:       db.id,
    label:    db.label,
    type:     db.type,
    zone:     db.zone,
    price:    Number(db.price),
    hourly:   Number(db.hourly),
    capacity: db.capacity ?? undefined,
  }
}

function toAppBooking(db: DbBooking & { space?: DbSpace }): Booking {
  const space = db.space ? toAppSpace(db.space) : ALL_SPACES.find(s => s.id === db.space_id)!
  const todayKey = dateKey(new Date())
  const status: BookingStatus = db.date >= todayKey ? 'upcoming' : 'past'
  return {
    id:     db.id,
    space,
    date:   db.date,
    start:  db.start_hour,
    end:    db.end_hour,
    price:  Number(db.price),
    status,
  }
}

const AppCtx = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()

  const [view,       setView]       = useState<ViewType>('book')
  const [userRole,   setUserRole]   = useState<UserRole>('client')
  const [occupancy,  setOccupancy]  = useState<OccupancyMap>({})
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [toast,      setToast]      = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync role from Supabase profile
  useEffect(() => {
    if (profile) setUserRole(profile.role as UserRole)
  }, [profile])

  // Load bookings + occupancy when user changes
  useEffect(() => {
    if (!user) {
      setMyBookings([])
      setOccupancy({})
      return
    }
    loadData(user.id)
  }, [user?.id])

  async function loadData(userId: string) {
    // Load current user's bookings (with space info joined)
    const { data: myData } = await sb
      .from('bookings')
      .select('*, space:spaces(*)')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('date', { ascending: false })

    if (myData) {
      setMyBookings((myData as (DbBooking & { space?: DbSpace })[]).map(toAppBooking))
    }

    // Load all bookings to build occupancy map
    const { data: allData } = await sb
      .from('bookings')
      .select('space_id, date, start_hour, end_hour, user_id')
      .neq('status', 'cancelled')

    if (allData) {
      const occ: OccupancyMap = {}
      for (const b of allData as { space_id: string; date: string; start_hour: number; end_hour: number; user_id: string }[]) {
        if (!occ[b.date]) occ[b.date] = {}
        if (!occ[b.date][b.space_id]) {
          occ[b.date][b.space_id] = {
            start: b.start_hour,
            end:   b.end_hour,
            ...(b.user_id === userId ? { mine: true as const } : {}),
          }
        }
      }
      setOccupancy(occ)
    }
  }

  function showToast(t: ToastState) {
    setToast(t)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  function isOccupied(spaceId: string, dKey: string, start: number, end: number): boolean {
    const slot = occupancy[dKey]?.[spaceId]
    if (!slot) return false
    if (slot.maintenance) return true
    return !(end <= (slot.start ?? 0) || start >= (slot.end ?? 24))
  }

  function addBooking(b: Omit<Booking, 'id' | 'status'>) {
    if (!user) return

    // Optimistic update — add immediately with a temp ID
    const tempId = `tmp-${Date.now()}`
    const booking: Booking = { ...b, id: tempId, status: 'upcoming' }
    setMyBookings(bs => [booking, ...bs])
    setOccupancy(o => ({
      ...o,
      [b.date]: {
        ...(o[b.date] ?? {}),
        [b.space.id]: { start: b.start, end: b.end, mine: true as const },
      },
    }))
    showToast({ kind: 'success', title: 'Booking confirmed!', body: `${b.space.label} · ${fmtLongDate(parseKey(b.date))}` })

    // Persist to Supabase, swap temp ID with real DB ID on success
    sb.from('bookings').insert({
      user_id:    user.id,
      space_id:   b.space.id,
      date:       b.date,
      start_hour: b.start,
      end_hour:   b.end,
      price:      b.price,
      status:     'upcoming',
    }).select('id').single().then(({ data, error }: { data: { id: string } | null; error: { message: string } | null }) => {
      if (error) {
        setMyBookings(bs => bs.filter(x => x.id !== tempId))
        setOccupancy(o => {
          if (!o[b.date]) return o
          const day = { ...o[b.date] }
          if (day[b.space.id]?.mine) delete day[b.space.id]
          return { ...o, [b.date]: day }
        })
        showToast({ kind: 'error', title: 'Booking failed', body: error.message })
      } else if (data) {
        setMyBookings(bs => bs.map(x => x.id === tempId ? { ...x, id: data.id } : x))
      }
    })
  }

  function cancelBooking(id: string) {
    const b = myBookings.find(x => x.id === id)

    // Optimistic update
    setMyBookings(bs => bs.filter(x => x.id !== id))
    if (b) {
      setOccupancy(o => {
        if (!o[b.date]) return o
        const day = { ...o[b.date] }
        if (day[b.space.id]?.mine) delete day[b.space.id]
        return { ...o, [b.date]: day }
      })
      showToast({ kind: 'info', title: 'Booking cancelled', body: `${b.space.label} · ${fmtLongDate(parseKey(b.date))}` })
    }

    // Persist to Supabase
    sb.from('bookings').update({ status: 'cancelled' }).eq('id', id).then(
      ({ error }: { error: { message: string } | null }) => {
        if (error) {
          if (b) setMyBookings(bs => [b, ...bs])
          showToast({ kind: 'error', title: 'Cancel failed', body: error.message })
        }
      }
    )
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
