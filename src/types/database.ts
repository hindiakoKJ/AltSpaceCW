// Database types — mirrors supabase schema

export interface DbStudioSettings {
  id:                   string
  tenant_id:            string
  name:                 string
  tagline:              string
  address:              string
  city:                 string
  timezone:             string
  phone:                string
  email:                string
  website:              string
  booking_buffer_hours: number
  hours:                Record<string, { open: boolean; from: string; to: string }>
  logo_url:             string | null
  hero_image_url:       string | null
  plans:                unknown[]   // JSONB — MembershipPlan[]
  amenities:            unknown[]   // JSONB — AmenityItem[]
  updated_at:           string
}

export interface DbSubscription {
  id:            string
  tenant_id:     string
  user_id:       string
  plan_name:     string
  billing_cycle: 'monthly' | 'annual' | 'prepaid'
  status:        'active' | 'expired' | 'cancelled'
  credits_total: number
  credits_used:  number
  started_at:    string
  renews_at:     string | null
  created_at:    string
}

export interface Profile {
  id:         string
  full_name:  string
  role:       'client' | 'admin'
  plan:       string
  created_at: string
}

export interface DbSpace {
  id:         string
  label:      string
  type:       'hot' | 'dedicated' | 'room'
  zone:       string
  price:      number
  hourly:     number
  capacity:   number | null
  is_active:  boolean
  sort_order: number
  tenant_id:  string
}

export interface DbBooking {
  id:              string
  user_id:         string
  space_id:        string
  date:            string
  start_hour:      number
  end_hour:        number
  price:           number
  status:          'upcoming' | 'cancelled'
  payment_status:  'pending' | 'awaiting_confirmation' | 'confirmed' | 'expired'
  client_deadline: string | null
  admin_deadline:  string | null
  tenant_id:       string
  notes:           string | null
  created_at:      string
  space?:          DbSpace
}

export interface DbMaintenanceSlot {
  id:         string
  tenant_id:  string
  space_id:   string
  date:       string   // YYYY-MM-DD
  created_at: string
}

export interface DbAuditLog {
  id:          string
  tenant_id:   string | null
  actor_id:    string | null
  action:      string
  entity_type: string
  entity_id:   string | null
  metadata:    Record<string, unknown> | null
  created_at:  string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      spaces: {
        Row:    DbSpace
        Insert: Omit<DbSpace, 'sort_order'> & { sort_order?: number }
        Update: Partial<Omit<DbSpace, 'id'>>
      }
      bookings: {
        Row:    DbBooking
        Insert: Omit<DbBooking, 'id' | 'created_at' | 'space'>
        Update: Partial<Omit<DbBooking, 'id' | 'created_at' | 'space'>>
      }
      subscriptions: {
        Row:    DbSubscription
        Insert: Omit<DbSubscription, 'id' | 'created_at'>
        Update: Partial<Omit<DbSubscription, 'id' | 'created_at'>>
      }
      studio_settings: {
        Row:    DbStudioSettings
        Insert: Omit<DbStudioSettings, 'id'>
        Update: Partial<Omit<DbStudioSettings, 'id'>>
      }
      maintenance_slots: {
        Row:    DbMaintenanceSlot
        Insert: Omit<DbMaintenanceSlot, 'id' | 'created_at'>
        Update: Partial<Omit<DbMaintenanceSlot, 'id' | 'created_at'>>
      }
      audit_log: {
        Row:    DbAuditLog
        Insert: Omit<DbAuditLog, 'id' | 'created_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_tenant_id: { Args: Record<string, never>; Returns: string }
      get_my_role:      { Args: Record<string, never>; Returns: string }
    }
    Enums: Record<string, never>
  }
}
