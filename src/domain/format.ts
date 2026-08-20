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

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
