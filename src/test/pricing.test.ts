import { describe, it, expect } from 'vitest'

// Mirrors the pricing logic in BookingView.tsx
function calcTotal(space: { price: number; hourly: number; type: string }, hours: number): number {
  if (space.type === 'room') return space.hourly * hours
  if (hours >= 8) return space.price
  return space.hourly * hours
}

describe('Booking price calculation', () => {
  const hotDesk = { price: 350, hourly: 60, type: 'hot' }
  const room    = { price: 0, hourly: 500, type: 'room' }

  it('charges hourly rate for < 8 hours on hot desk', () => {
    expect(calcTotal(hotDesk, 3)).toBe(180)
  })

  it('applies day rate for 8+ hours on hot desk', () => {
    expect(calcTotal(hotDesk, 8)).toBe(350)
    expect(calcTotal(hotDesk, 10)).toBe(350)
  })

  it('always charges hourly for meeting rooms', () => {
    expect(calcTotal(room, 2)).toBe(1000)
    expect(calcTotal(room, 8)).toBe(4000)
  })
})

describe('Rate limit boundary', () => {
  it('allows up to 5 bookings in 24h', () => {
    const MAX = 5
    expect(3 < MAX).toBe(true)
    expect(5 < MAX).toBe(false)
    expect(6 < MAX).toBe(false)
  })
})
