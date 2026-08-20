import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Field } from './Field'
import { CurrencySelect } from './CurrencySelect'
import { useCurrency } from '../providers/CurrencyProvider'
import { useAuth } from '../providers/AuthProvider'
import { useData } from '../providers/DataProvider'
import { fmt } from '@/domain/currency'
import type { CurrencyCode, Group } from '@/domain/types'

const selectCls =
  'rounded-xl border border-ink/15 bg-white px-2 py-[11px] text-[13.5px] text-ink outline-none'
const fieldLabel = 'flex flex-col gap-1.5 text-[11.5px] font-bold tracking-[.5px] text-mute-2'

interface ExpenseModalProps {
  group: Group
  onClose: () => void
}

export function ExpenseModal({ group, onClose }: ExpenseModalProps) {
  const { cur } = useCurrency()
  const { meId } = useAuth()
  const { memberById, addExpense } = useData()

  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [fCur, setFCur] = useState<CurrencyCode>(cur)
  const [paidBy, setPaidBy] = useState(meId)
  const [parts, setParts] = useState<string[]>(group.members)

  const amt = parseFloat(amount)
  const valid = desc.trim().length > 0 && amt > 0 && parts.length > 0
  const splitHint = valid ? `${fmt(amt / parts.length, fCur)} each` : `${parts.length} selected`

  const toggle = (id: string) =>
    setParts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    if (!valid) return
    await addExpense({ gid: group.id, desc: desc.trim(), amount: amt, cur: fCur, paidBy, parts })
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 font-display text-[18px] font-bold [overflow-wrap:anywhere]">Add expense · {group.name}</div>
      <div className="flex flex-col gap-3.5">
        <Field
          label="DESCRIPTION"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. Dinner at Mang Larry's"
        />

        <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2.5 sm:flex">
          <Field
            label="AMOUNT"
            className="min-w-0 flex-1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
          <label className={`w-[104px] sm:w-[116px] ${fieldLabel}`}>
            CURRENCY
            <CurrencySelect value={fCur} onChange={setFCur} className="bg-white px-2 py-[11px] text-[13.5px]" />
          </label>
        </div>

        <label className={fieldLabel}>
          PAID BY
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className={`cursor-pointer ${selectCls}`}
          >
            {group.members.map((id) => (
              <option key={id} value={id}>
                {memberById(id)?.name}
              </option>
            ))}
          </select>
        </label>

        <div className={fieldLabel}>
          SPLIT EQUALLY AMONG
          <div className="flex flex-wrap gap-2">
            {group.members.map((id) => {
              const on = parts.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={`min-h-10 cursor-pointer whitespace-nowrap rounded-full border px-[14px] py-2 text-[12.5px] font-bold tracking-normal transition-colors ${
                    on ? 'border-ink bg-ink text-cream' : 'border-ink/20 bg-cream text-mute-2'
                  }`}
                >
                  {memberById(id)?.name}
                </button>
              )
            })}
          </div>
          <div className="text-[12px] font-normal tracking-normal text-mute">{splitHint}</div>
        </div>

        <Button onClick={submit} disabled={!valid} className="mt-1 min-h-11 whitespace-nowrap p-[13px] text-[14px]">
          Save expense
        </Button>
      </div>
    </Modal>
  )
}
