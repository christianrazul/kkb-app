import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CurrencyCode } from '@/domain/types'
import { CURRENCIES } from '@/domain/currency'

const STORAGE_KEY = 'kkb.currency-display'
const DEFAULT_CURRENCY: CurrencyCode = 'PHP'
const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = 'ORIGINAL'

export type DisplayCurrency = CurrencyCode | 'ORIGINAL'

interface CurrencyContextValue {
  displayCur: DisplayCurrency
  setDisplayCur: (cur: DisplayCurrency) => void
  /** Currency used when mixed-currency totals require one common unit. */
  cur: CurrencyCode
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

function readStored(): DisplayCurrency {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'ORIGINAL') return raw
  return raw && CURRENCIES.some(({ code }) => code === raw) ? (raw as CurrencyCode) : DEFAULT_DISPLAY_CURRENCY
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCur, setDisplayCur] = useState<DisplayCurrency>(readStored)
  const cur = displayCur === 'ORIGINAL' ? DEFAULT_CURRENCY : displayCur

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, displayCur)
  }, [displayCur])

  const value = useMemo<CurrencyContextValue>(
    () => ({ cur, displayCur, setDisplayCur }),
    [cur, displayCur],
  )

  return <CurrencyContext value={value}>{children}</CurrencyContext>
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
