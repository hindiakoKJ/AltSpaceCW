export type UserRole = 'client' | 'admin'
export type SpaceType = 'desk' | 'room'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Space {
  id: string
  name: string
  type: SpaceType
  capacity: number
  hourly_rate: number
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  space_id: string
  date: string           // ISO date string: YYYY-MM-DD
  start_time: string     // HH:MM (24h)
  end_time: string       // HH:MM (24h)
  status: BookingStatus
  total_amount: number
  notes: string | null
  created_at: string
  // joined fields (optional, populated via select)
  profile?: Profile
  space?: Space
}

// Supabase typed client database shape
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      spaces: {
        Row: Space
        Insert: Omit<Space, 'id' | 'created_at'>
        Update: Partial<Omit<Space, 'id' | 'created_at'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at' | 'profile' | 'space'>
        Update: Partial<Omit<Booking, 'id' | 'created_at' | 'profile' | 'space'>>
      }
    }
    Views: Record<string, never>
    Functions: {
      check_booking_conflict: {
        Args: {
          p_space_id: string
          p_date: string
          p_start_time: string
          p_end_time: string
          p_exclude_booking_id?: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
