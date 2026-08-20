import type { CurrencyCode } from './types'

/** Runtime exchange rates, expressed as "₱ per 1 unit of currency". */
const RATES: Record<CurrencyCode, number> = {
  PHP: 1,
  USD: 1,
  EUR: 1,
  JPY: 1,
  SGD: 1,
}

export const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'PHP', label: 'PHP ₱' },
  { code: 'USD', label: 'USD $' },
  { code: 'EUR', label: 'EUR €' },
  { code: 'JPY', label: 'JPY ¥' },
  { code: 'SGD', label: 'SGD S$' },
]

export function rate(c: CurrencyCode): number {
  return RATES[c] ?? 1
}

export function setPhpRates(rates: Partial<Record<CurrencyCode, number>>): void {
  for (const currency of CURRENCIES) {
    const nextRate = rates[currency.code]
    if (nextRate && nextRate > 0) RATES[currency.code] = nextRate
  }
  RATES.PHP = 1
}

/** Convert an amount between currencies via the ₱ base. */
export function conv(amt: number, from: CurrencyCode, to: CurrencyCode): number {
  return (amt * rate(from)) / rate(to)
}

export function fmt(amt: number, cur: CurrencyCode): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.round(amt * 100) / 100)
}

/** Formats a signed net with an explicit + / − (unicode minus) prefix. */
export function fmtSigned(net: number, cur: CurrencyCode): string {
  return (net >= 0 ? '+' : '−') + fmt(Math.abs(net), cur)
}

/** ~₱30 "close enough to settled" threshold, expressed in the display currency. */
export function eps(cur: CurrencyCode): number {
  return 30 / rate(cur)
}
