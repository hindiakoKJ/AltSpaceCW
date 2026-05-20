import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppContextValue, Booking, BookingStatus, OccupancyMap, PaymentStatus, Space, StudioSettings, Subscription, ToastState, UserRole, ViewType } from '../types/app'
import type { DbSpace, DbBooking, DbSubscription, DbStudioSettings } from '../types/database'
import { ALL_SPACES } from '../lib/mockData'
import { dateKey, fmtLongDate, parseKey } from '../lib/dateHelpers'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useTenant } from './TenantContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

function toAppSubscription(db: DbSubscription): Subscription {
  return {
    id:           db.id,
    planName:     db.plan_name,
    billingCycle: db.billing_cycle,
    status:       db.status,
    creditsTotal: db.credits_total,
    creditsUsed:  db.credits_used,
    creditsLeft:  Math.max(0, db.credits_total - db.credits_used),
    startedAt:    db.started_at,
    renewsAt:     db.renews_at,
  }
}

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

  const [view,                setView]                = useState<ViewType>(initialView)
  const [userRole,            setUserRole]            = useState<UserRole>((profile?.role as UserRole) ?? 'client') // internal only, not exposed in context
  const [spaces,              setSpaces]              = useState<Space[]>(ALL_SPACES)
  const [occupancy,           setOccupancy]           = useState<OccupancyMap>({})
  const [myBookings,          setMyBookings]          = useState<Booking[]>([])
  const [toast,               setToast]               = useState<ToastState | null>(null)
  const [bookingBufferHours,  setBookingBufferHours]  = useState<number>(4)
  const [subscription,        setSubscription]        = useState<Subscription | null>(null)
  const [studioSettings,      setStudioSettings]      = useState<StudioSettings | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync role from Supabase profile
  useEffect(() => {
    if (profile) setUserRole(profile.role as UserRole)
  }, [profile])

  // Load studio settings (name, logo, hero, buffer hours)
  const reloadStudioSettings = useCallback(async () => {
    if (!tenant) { setStudioSettings(null); return }
    const { data } = await sb
      .from('studio_settings')
      .select('name, tagline, logo_url, hero_image_url, booking_buffer_hours')
      .eq('tenant_id', tenant.id)
      .maybeSingle() as { data: Pick<DbStudioSettings, 'name' | 'tagline' | 'logo_url' | 'hero_image_url' | 'booking_buffer_hours'> | null }
    if (data) {
      setBookingBufferHours(data.booking_buffer_hours)
      setStudioSettings({
        name:         data.name,
        tagline:      data.tagline,
        logoUrl:      data.logo_url,
        heroImageUrl: data.hero_image_url,
      })
    }
  }, [tenant?.id])

  useEffect(() => { reloadStudioSettings() }, [reloadStudioSettings])

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

  // Load subscription for current user+tenant
  const reloadSubscription = useCallback(async () => {
    if (!user || !tenant) { setSubscription(null); return }
    const { data } = await sb
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      // Lazy-expire: if renews_at is in the past, flip to expired
      if (data.renews_at && data.renews_at < new Date().toISOString()) {
        await sb.from('subscriptions').update({ status: 'expired' }).eq('id', data.id)
        setSubscription(null)
      } else {
        setSubscription(toAppSubscription(data as DbSubscription))
      }
    } else {
      setSubscription(null)
    }
  }, [user?.id, tenant?.id])

  useEffect(() => {
    reloadSubscription()
  }, [reloadSubscription])

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

    // Occupancy: only fetch what's needed — no user_id exposed to client
    const [{ data: allData }, { data: maintData }] = await Promise.all([
      sb.from('bookings')
        .select('space_id, date, start_hour, end_hour')
        .eq('tenant_id', tenantId)
        .neq('status', 'cancelled')
        .neq('payment_status', 'expired'),
      sb.from('maintenance_slots')
        .select('space_id, date')
        .eq('tenant_id', tenantId),
    ])

    if (allData || maintData) {
      const occ: OccupancyMap = {}

      // Own bookings (user_id match) — fetch separately to preserve 'mine' flag
      if (allData) {
        for (const b of allData as { space_id: string; date: string; start_hour: number; end_hour: number }[]) {
          if (!occ[b.date]) occ[b.date] = {}
          if (!occ[b.date][b.space_id]) {
            occ[b.date][b.space_id] = { start: b.start_hour, end: b.end_hour }
          }
        }
      }

      // Mark own bookings with 'mine' flag (separate query scoped to user)
      const { data: mySlots } = await sb
        .from('bookings')
        .select('space_id, date, start_hour, end_hour')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .neq('payment_status', 'expired')

      if (mySlots) {
        for (const b of mySlots as { space_id: string; date: string; start_hour: number; end_hour: number }[]) {
          if (occ[b.date]?.[b.space_id]) {
            occ[b.date][b.space_id] = { ...occ[b.date][b.space_id], mine: true as const }
          }
        }
      }

      // Merge maintenance slots
      if (maintData) {
        for (const m of maintData as { space_id: string; date: string }[]) {
          if (!occ[m.date]) occ[m.date] = {}
          occ[m.date][m.space_id] = { maintenance: true as const }
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

    // Deduct 1 credit from the booking owner's active subscription
    let bookingUserId: string | null = null
    const foundBooking = myBookings.find(b => b.id === id)
    if (foundBooking) {
      // Only admin has access to myBookings of other users via admin view — try via DB
      const { data: bRow } = await sb
        .from('bookings')
        .select('user_id')
        .eq('id', id)
        .maybeSingle()
      bookingUserId = bRow?.user_id ?? null
    } else {
      const { data: bRow } = await sb
        .from('bookings')
        .select('user_id')
        .eq('id', id)
        .maybeSingle()
      bookingUserId = bRow?.user_id ?? null
    }

    if (bookingUserId && tenant) {
      const { data: sub } = await sb
        .from('subscriptions')
        .select('*')
        .eq('user_id', bookingUserId)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sub) {
        await sb.from('subscriptions')
          .update({ credits_used: (sub.credits_used ?? 0) + 1 })
          .eq('id', sub.id)
        // If this is the current user's sub, reload
        if (bookingUserId === user?.id) {
          reloadSubscription()
        }
      }
    }

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

  async function toggleMaintenance(spaceId: string, dKey: string) {
    if (!tenant) return
    const isCurrentlyMaint = !!(occupancy[dKey]?.[spaceId]?.maintenance)

    if (isCurrentlyMaint) {
      // Remove from DB
      await sb.from('maintenance_slots')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('space_id', spaceId)
        .eq('date', dKey)
      setOccupancy(o => {
        const day = { ...(o[dKey] ?? {}) }
        delete day[spaceId]
        return { ...o, [dKey]: day }
      })
      showToast({ kind: 'info', title: 'Back in service', body: spaceId })
    } else {
      // Insert to DB
      await sb.from('maintenance_slots').upsert(
        { tenant_id: tenant.id, space_id: spaceId, date: dKey },
        { onConflict: 'tenant_id,space_id,date' }
      )
      setOccupancy(o => ({
        ...o,
        [dKey]: { ...(o[dKey] ?? {}), [spaceId]: { maintenance: true as const } },
      }))
      showToast({ kind: 'info', title: 'Marked under maintenance', body: spaceId })
    }
  }

  const value: AppContextValue = {
    view, setView,
    userRole,
    spaces,
    occupancy, isOccupied, toggleMaintenance,
    myBookings, addBooking, cancelBooking, markPaid, confirmPayment,
    showToast,
    toast,
    parseKey,
    bookingBufferHours, setBookingBufferHours,
    subscription, reloadSubscription,
    studioSettings, reloadStudioSettings,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
