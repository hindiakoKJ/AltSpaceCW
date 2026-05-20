export type ViewType     = 'book' | 'dashboard' | 'admin'
export type UserRole     = 'client' | 'admin' | 'console'
export type SpaceType    = 'hot' | 'dedicated' | 'room'
export type BookingStatus = 'upcoming' | 'past'
export type ToastKind    = 'success' | 'info' | 'error'
export type PaymentStatus = 'pending' | 'awaiting_confirmation' | 'confirmed' | 'expired'

export interface Tenant {
  id:         string
  name:       string
  slug:       string
  status:     'active' | 'suspended'
  admin_email?: string | null
  created_at: string
}

export interface Member {
  name: string
  avatar: string
  color: string
  plan: string
  isMe?: boolean
}

export interface Space {
  id: string
  label: string
  type: SpaceType
  zone: string
  price: number
  hourly: number
  capacity?: number
}

export interface OccupancySlot {
  memberIdx?: number
  start?: number
  end?: number
  maintenance?: true
  mine?: true
}

export type OccupancyMap = Record<string, Record<string, OccupancySlot>>

export interface Booking {
  id: string
  space: Space
  date: string
  start: number
  end: number
  price: number
  status: BookingStatus
  payment_status: PaymentStatus
  client_deadline: string | null
  admin_deadline: string | null
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

/* ── Studio setup types ──────────────────────────────────────── */

export interface DayHours {
  open: boolean
  from: string
  to: string
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
  hours: Record<string, DayHours>
  booking_buffer_hours: number
}

export interface MembershipPlan {
  id: string
  name: string
  price: number
  perUnit: 'month' | 'day' | 'visit'
  dayCredits: number | null
  dedicated: boolean
  roomHours: number
  color: string
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

export interface Subscription {
  id:           string
  planName:     string
  billingCycle: 'monthly' | 'annual' | 'prepaid'
  status:       'active' | 'expired' | 'cancelled'
  creditsTotal: number
  creditsUsed:  number
  creditsLeft:  number
  startedAt:    string
  renewsAt:     string | null
}

export interface StudioSettings {
  name:          string
  tagline:       string
  logoUrl:       string | null
  heroImageUrl:  string | null
  amenities:     AmenityItem[]
}

export interface AppContextValue {
  view: ViewType
  setView: (v: ViewType) => void
  userRole: UserRole
  spaces: Space[]
  occupancy: OccupancyMap
  isOccupied: (spaceId: string, dKey: string, start: number, end: number) => boolean
  toggleMaintenance: (spaceId: string, dKey: string) => void
  myBookings: Booking[]
  addBooking: (b: Omit<Booking, 'id' | 'status' | 'payment_status' | 'client_deadline' | 'admin_deadline'>) => void
  cancelBooking: (id: string) => void
  markPaid: (id: string) => void
  confirmPayment: (id: string) => void
  showToast: (t: ToastState) => void
  toast: ToastState | null
  parseKey: (k: string) => Date
  bookingBufferHours: number
  setBookingBufferHours: (h: number) => void
  subscription: Subscription | null
  reloadSubscription: () => void
  studioSettings: StudioSettings | null
  reloadStudioSettings: () => void
}
