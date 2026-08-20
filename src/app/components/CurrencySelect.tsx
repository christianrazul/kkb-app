import { CURRENCIES } from '@/domain/currency'
import type { CurrencyCode } from '@/domain/types'

interface CurrencySelectProps {
  value: CurrencyCode
  onChange: (cur: CurrencyCode) => void
  className?: string
}

export function CurrencySelect({ value, onChange, className = '' }: CurrencySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
      className={`cursor-pointer rounded-xl border border-ink/15 text-ink outline-none ${className}`}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.label}
        </option>
      ))}
    </select>
  )
}
