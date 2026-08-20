import { CURRENCIES } from '@/domain/currency'
import type { DisplayCurrency } from '../providers/CurrencyProvider'

interface DisplayCurrencySelectProps {
  value: DisplayCurrency
  onChange: (cur: DisplayCurrency) => void
  className?: string
}

export function DisplayCurrencySelect({
  value,
  onChange,
  className = '',
}: DisplayCurrencySelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as DisplayCurrency)}
      className={`cursor-pointer rounded-xl border border-ink/15 text-ink outline-none ${className}`}
    >
      <option value="ORIGINAL">Original</option>
      {CURRENCIES.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.label}
        </option>
      ))}
    </select>
  )
}
