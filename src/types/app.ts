export type ViewType  = 'book' | 'dashboard' | 'admin'
export type UserRole  = 'client' | 'admin'
export type SpaceType = 'hot' | 'dedicated' | 'room'
export type BookingStatus = 'upcoming' | 'past'
export type ToastKind = 'success' | 'info' | 'error'

export interface Member {
  name: string
  avatar: string
  color: string   // Tailwind bg+text classes e.g. "bg-amber-100 text-amber-900"
  plan: string
  isMe?: boolean
}

export interface Space {
  id: string
  label: string
  type: SpaceType
  zone: string
  price: number   // day rate
  hourly: number  // hourly rate
  capacity?: number
}

export interface OccupancySlot {
  memberIdx?: number
  start?: number
  end?: number
  maintenance?: true
  mine?: true
}

/** dateKey → { spaceId → slot } */
export type OccupancyMap = Record<string, Record<string, OccupancySlot>>

export interface Booking {
  id: string
  space: Space
  date: string       // YYYY-MM-DD
  start: number      // hour 0-23
  end: number        // hour 0-23
  price: number
  status: BookingStatus
}

export interface ToastState {
  kind: ToastKind
  title: string
  body: string
}

export interface TypeMeta {
  label: string
  plural: string
  accent: 'amber' | 'emerald' | 'slate'
  icon: string
}

/* ── Studio setup types ────────────────────────────────────────────── */

export interface DayHours {
  open: boolean
  from: string  // e.g. "08:00"
  to: string    // e.g. "22:00"
}

export interface StudioProfile {
  name: string
  tagline: string
  address: string
  city: string
  timezone: string
  phone: string
  email: string
  website: string
  hours: Record<string, DayHours>  // key: 'mon' | 'tue' | ... | 'sun'
}

export interface MembershipPlan {
  id: string
  name: string
  price: number           // monthly (or per-use for day pass)
  perUnit: 'month' | 'day' | 'visit'
  dayCredits: number | null   // null = unlimited
  dedicated: boolean
  roomHours: number       // meeting room hours included
  color: string           // tailwind color name: 'stone' | 'amber' | 'emerald' | 'slate' | 'violet'
  popular?: boolean
  description: string
}

export interface AmenityItem {
  id: string
  label: string
  icon: string
  enabled: boolean
  category: 'tech' | 'comfort' | 'services' | 'facilities'
}

export interface AppContextValue {
  view: ViewType
  setView: (v: ViewType) => void
  userRole: UserRole
  setUserRole: (r: UserRole) => void
  occupancy: OccupancyMap
  isOccupied: (spaceId: string, dKey: string, start: number, end: number) => boolean
  toggleMaintenance: (spaceId: string, dKey: string) => void
  myBookings: Booking[]
  addBooking: (b: Omit<Booking, 'id' | 'status'>) => void
  cancelBooking: (id: string) => void
  toast: ToastState | null
  parseKey: (k: string) => Date
}
