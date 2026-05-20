// Database types — mirrors supabase/schema.sql exactly

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
  email:      string | null
  role:       'client' | 'admin'
  plan:       string
  created_at: string
}

export interface DbSpace {
  id:         string          // text PK, e.g. "HD-01"
  label:      string
  type:       'hot' | 'dedicated' | 'room'
  zone:       string
  price:      number          // day rate
  hourly:     number          // hourly rate
  capacity:   number | null
  is_active:  boolean
  sort_order: number
}

export interface DbBooking {
  id:             string
  user_id:        string
  space_id:       string
  date:           string          // YYYY-MM-DD
  start_hour:     number
  end_hour:       number
  price:          number
  status:         'upcoming' | 'cancelled'
  payment_status: 'pending' | 'awaiting_confirmation' | 'confirmed' | 'expired'
  client_deadline: string | null
  admin_deadline:  string | null
  notes:          string | null
  created_at:     string
  // joined via select('*, space:spaces(*)')
  space?: DbSpace
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
    }
    Views: Record<string, never>
    Functions: {
      check_booking_conflict: {
        Args: {
          p_space_id:           string
          p_date:               string
          p_start_hour:         number
          p_end_hour:           number
          p_exclude_booking_id?: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
