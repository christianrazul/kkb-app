import { describe, expect, it } from 'vitest'
import { formatTime, philippineDateTime, todayIso } from './format'

describe('Philippine date and time formatting', () => {
  it('uses Asia/Manila even when the UTC date is still the previous day', () => {
    const instant = new Date('2026-08-21T16:30:00Z')

    expect(philippineDateTime(instant)).toEqual({ date: '2026-08-22', time: '00:30' })
    expect(todayIso(instant)).toBe('2026-08-22')
  })

  it('formats stored hour and minute values in either group format', () => {
    expect(formatTime('00:05', 'TWELVE_HOUR')).toBe('12:05 AM')
    expect(formatTime('14:30', 'TWELVE_HOUR')).toBe('2:30 PM')
    expect(formatTime('14:30', 'TWENTY_FOUR_HOUR')).toBe('14:30')
  })
})
