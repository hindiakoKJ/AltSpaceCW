import { describe, it, expect } from 'vitest'
import { fmtRange, fmtLongDate } from '../lib/dateHelpers'

describe('fmtRange', () => {
  it('formats a morning range', () => {
    expect(fmtRange(9, 12)).toBe('9 AM – 12 PM')
  })
  it('formats a cross-noon range', () => {
    expect(fmtRange(11, 14)).toBe('11 AM – 2 PM')
  })
  it('formats an afternoon range', () => {
    expect(fmtRange(13, 17)).toBe('1 PM – 5 PM')
  })
  it('formats midnight as 12 AM', () => {
    expect(fmtRange(0, 1)).toBe('12 AM – 1 AM')
  })
  it('formats noon as 12 PM', () => {
    expect(fmtRange(12, 13)).toBe('12 PM – 1 PM')
  })
})

describe('fmtLongDate', () => {
  it('returns day-of-week, month, and date', () => {
    const d = new Date(2026, 4, 19) // Tue May 19 2026
    const result = fmtLongDate(d)
    expect(result).toContain('May')
    expect(result).toContain('19')
    expect(result).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/)
  })
})
