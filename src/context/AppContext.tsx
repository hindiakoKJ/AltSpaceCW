import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppContextValue, Booking, BookingStatus, OccupancyMap, PaymentStatus, Space, ToastState, UserRole, ViewType } from '../types/app'
import type { DbSpace, DbBooking } from '../types/database'
import { ALL_SPACES } from '../lib/mockData'
import { dateKey, fmtLongDate, parseKey } from '../lib/dateHelpers'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useTenant } from './TenantContext'

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
  const payment_status: PaymentStatus = db.payment_status ?? 'confirmed'
  const client_deadline = db.client_deadline ?? null
  const admin_deadline = db.admin_deadline ?? null
  return { id: db.id, space, date: db.date, start: db.start_hour, end: db.end_hour, price: Number(db.price), status, payment_status, client_deadline, admin_deadline }
}

const AppCtx = createContext<AppContextValue | null>(null)

export function AppProvider({ children, initialView = 'book' }: { children: ReactNode; initialView?: ViewType }) {
  const { user, profile } = useAuth()
  const { tenant } = useTenant()

  const [view,       setView]       = useState<ViewType>(initialView)
  const [userRole,   setUserRole]   = useState<UserRole>((profile?.role as UserRole) ?? 'client')
  const [spaces,     setSpaces]     = useState<Space[]>(ALL_SPACES)
  const [occupancy,  setOccupancy]  = useState<OccupancyMap>({})
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [toast,      setToast]      = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync role from Supabase profile
  useEffect(() => {
    if (profile) setUserRole(profile.role as UserRole)
  }, [profile])

  // Load tenant spaces
  useEffect(() => {
    if (!tenant) return
    sb.from('spaces')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }: { data: DbSpace[] | null }) => {
        if (data && data.length > 0) setSpaces(data.map(toAppSpace))
      })
  }, [tenant?.id])

  // Load bookings + occupancy when user or tenant changes
  useEffect(() => {
    if (!user || !tenant) { setMyBookings([]); setOccupancy({}); return }
    loadData(user.id, tenant.id)
  }, [user?.id, tenant?.id])

  async function loadData(userId: string, tenantId: string) {
    const { data: myData } = await sb
      .from('bookings')
      .select('*, space:spaces(*)')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .order('date', { ascending: false })

    if (myData) {
      // Lazy expiry check
      const now = new Date().toISOString()
      const toExpire = (myData as DbBooking[]).filter(b =>
        (b.payment_status === 'pending' && b.client_deadline && b.client_deadline < now) ||
        (b.payment_status === 'awaiting_confirmation' && b.admin_deadline && b.admin_deadline < now)
      )
      if (toExpire.length > 0) {
        await sb.from('bookings').update({ payment_status: 'expired' }).in('id', toExpire.map(b => b.id))
        toExpire.forEach(b => { b.payment_status = 'expired' })
      }
      setMyBookings((myData as (DbBooking & { space?: DbSpace })[]).map(toAppBooking))
    }

    const { data: allData } = await sb
      .from('bookings')
      .select('space_id, date, start_hour, end_hour, user_id')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .neq('payment_status', 'expired')

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

  function addBooking(b: Omit<Booking, 'id' | 'status' | 'payment_status' | 'client_deadline' | 'admin_deadline'>) {
    if (!user || !tenant) return

    const tempId = `tmp-${Date.now()}`
    const clientDeadline = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...b,
      id: tempId,
      status: 'upcoming',
      payment_status: 'pending' as const,
      client_deadline: clientDeadline,
      admin_deadline: null,
    }
    setMyBookings(bs => [booking, ...bs])
    setOccupancy(o => ({
      ...o,
      [b.date]: { ...(o[b.date] ?? {}), [b.space.id]: { start: b.start, end: b.end, mine: true as const } },
    }))
    showToast({ kind: 'success', title: 'Booking confirmed!', body: `${b.space.label} · ${fmtLongDate(parseKey(b.date))}` })

    sb.from('bookings').insert({
      user_id:         user.id,
      space_id:        b.space.id,
      tenant_id:       tenant.id,
      date:            b.date,
      start_hour:      b.start,
      end_hour:        b.end,
      price:           b.price,
      status:          'upcoming',
      payment_status:  'pending',
      client_deadline: clientDeadline,
    }).select('id').single().then(({ data, error }: { data: { id: string } | null; error: { message: string } | null }) => {
      if (error) {
        setMyBookings(bs => bs.filter(x => x.id !== tempId))
        setOccupancy(o => {
          const day = { ...(o[b.date] ?? {}) }
          if (day[b.space.id]?.mine) delete day[b.space.id]
          return { ...o, [b.date]: day }
        })
        showToast({ kind: 'error', title: 'Booking failed', body: error.message })
      } else if (data) {
        setMyBookings(bs => bs.map(x => x.id === tempId ? { ...x, id: data.id } : x))
      }
    })
  }

  async function markPaid(id: string) {
    const adminDeadline = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await sb.from('bookings').update({
      payment_status: 'awaiting_confirmation',
      admin_deadline: adminDeadline,
    }).eq('id', id)
    setMyBookings(bs => bs.map(b => b.id === id
      ? { ...b, payment_status: 'awaiting_confirmation' as const, admin_deadline: adminDeadline }
      : b
    ))
    showToast({ kind: 'info', title: 'Payment submitted', body: 'Admin will confirm within 30 minutes.' })
  }

  async function confirmPayment(id: string) {
    await sb.from('bookings').update({ payment_status: 'confirmed' }).eq('id', id)
    setMyBookings(bs => bs.map(b => b.id === id ? { ...b, payment_status: 'confirmed' as const } : b))
    showToast({ kind: 'success', title: 'Payment confirmed!', body: 'Booking is fully reserved.' })
  }

  function cancelBooking(id: string) {
    const b = myBookings.find(x => x.id === id)
    setMyBookings(bs => bs.filter(x => x.id !== id))
    if (b) {
      setOccupancy(o => {
        const day = { ...(o[b.date] ?? {}) }
        if (day[b.space.id]?.mine) delete day[b.space.id]
        return { ...o, [b.date]: day }
      })
      showToast({ kind: 'info', title: 'Booking cancelled', body: `${b.space.label} · ${fmtLongDate(parseKey(b.date))}` })
    }
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
    spaces,
    occupancy, isOccupied, toggleMaintenance,
    myBookings, addBooking, cancelBooking, markPaid, confirmPayment,
    showToast,
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
