import { supabase } from '../lib/supabase'

interface ConflictCheckParams {
  spaceId: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:MM
  endTime: string    // HH:MM
  excludeBookingId?: string
}

/**
 * Calls the Supabase RPC that checks for overlapping bookings.
 * Returns true if a conflict exists (booking should be BLOCKED).
 */
export async function checkBookingConflict(params: ConflictCheckParams): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_booking_conflict', {
    p_space_id:           params.spaceId,
    p_date:               params.date,
    p_start_time:         params.startTime,
    p_end_time:           params.endTime,
    p_exclude_booking_id: params.excludeBookingId ?? null,
  })

  if (error) {
    console.error('Conflict check failed:', error.message)
    // Fail-safe: treat as conflict to prevent accidental double-booking
    return true
  }

  return data as boolean
}
