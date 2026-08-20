import { useState } from 'react'
import { Modal } from './Modal'
import { useCurrency } from '../providers/CurrencyProvider'
import { useData } from '../providers/DataProvider'
import { settleSuggestions } from '@/domain/balances'
import { fmt } from '@/domain/currency'
import type { Group } from '@/domain/types'

interface SettleModalProps {
  group: Group
  onClose: () => void
}

export function SettleModal({ group, onClose }: SettleModalProps) {
  const { cur } = useCurrency()
  const { expenses, memberById, recordSettlement } = useData()
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = settleSuggestions(group, expenses, cur)

  const record = async (from: string, to: string, amount: number) => {
    const key = `${from}-${to}`
    setSavingKey(key)
    setError(null)
    try {
      await recordSettlement({ gid: group.id, from, to, amount, cur })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not record this settlement')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="font-display text-[18px] font-bold">Settle up · {group.name}</div>
      <div className="mt-1 mb-4 text-[12.5px] text-mute">
        Suggested payments to zero everyone out.
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((s, i) => (
          <div
            key={`${s.from}-${s.to}-${i}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-[14px] border border-ink/[.05] bg-sand px-3.5 py-3 sm:flex sm:gap-3"
          >
            <span className="min-w-0 flex-1 text-[13.5px] [overflow-wrap:anywhere]">
              <strong>{memberById(s.from)?.name}</strong> pays{' '}
              <strong>{memberById(s.to)?.name}</strong>
            </span>
            <span className="whitespace-nowrap text-[14px] font-bold">{fmt(s.amt, cur)}</span>
            <button
              type="button"
              onClick={() => void record(s.from, s.to, s.amt)}
              disabled={savingKey !== null}
              className="col-span-2 min-h-10 w-full cursor-pointer whitespace-nowrap rounded-full bg-ink px-[14px] py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#55483a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra sm:w-auto"
            >
              {savingKey === `${s.from}-${s.to}` ? 'Recording…' : 'Record'}
            </button>
          </div>
        ))}
        {error && <div className="text-[12.5px] font-semibold text-neg">{error}</div>}
        {rows.length === 0 && (
          <div className="py-[18px] text-center text-[14px] font-bold text-pos">
            All settled up — walang utang!
          </div>
        )}
      </div>
    </Modal>
  )
}
