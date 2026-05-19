import { supabase } from '../lib/supabase'

interface ConflictCheckParams {
  spaceId: string
  date: string       // YYYY-MM-DD
  startHour: number  // 0-23
  endHour: number    // 1-24
  excludeBookingId?: string
}

/**
 * Calls the Supabase RPC that checks for overlapping bookings.
 * Returns true if a conflict exists (booking should be BLOCKED).
 */
export async function checkBookingConflict(params: ConflictCheckParams): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('check_booking_conflict', {
    p_space_id:           params.spaceId,
    p_date:               params.date,
    p_start_hour:         params.startHour,
    p_end_hour:           params.endHour,
    p_exclude_booking_id: params.excludeBookingId ?? null,
  })

  if (error) {
    console.error('Conflict check failed:', error.message)
    return true  // fail-safe: treat as conflict
  }

  return data as boolean
}
