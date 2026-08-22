import type { TimeFormat } from './types'

export const PHILIPPINE_TIME_ZONE = 'Asia/Manila'

/** Splits an ISO date into an uppercase short month and day-of-month. */
export function dateBits(iso: string): { mon: string; day: string } {
  const d = new Date(iso + 'T12:00:00')
  return {
    mon: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  }
}

/** "Miguel Santos" -> "MS". */
export function initials(full: string): string {
  return full
    .split(' ')
    .map((w) => w[0])
    .join('')
}

export function philippineDateTime(date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PHILIPPINE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  }
}

export function todayIso(date = new Date()): string {
  return philippineDateTime(date).date
}

export function formatTime(time: string, format: TimeFormat): string {
  const [hourText, minute = '00'] = time.split(':')
  const hour = Number(hourText)
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return time
  if (format === 'TWENTY_FOUR_HOUR') return `${hourText.padStart(2, '0')}:${minute}`

  const period = hour < 12 ? 'AM' : 'PM'
  return `${hour % 12 || 12}:${minute} ${period}`
}
