import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Field } from './Field'
import { CurrencySelect } from './CurrencySelect'
import { useCurrency } from '../providers/CurrencyProvider'
import { useAuth } from '../providers/AuthProvider'
import { useData } from '../providers/DataProvider'
import { fmt } from '@/domain/currency'
import type { CurrencyCode, Expense, Group } from '@/domain/types'
import { philippineDateTime } from '@/domain/format'

const selectCls =
  'rounded-xl border border-ink/15 bg-white px-2 py-[11px] text-[13.5px] text-ink outline-none'
const fieldLabel = 'flex flex-col gap-1.5 text-[11.5px] font-bold tracking-[.5px] text-mute-2'

interface ExpenseModalProps {
  group: Group
  expense?: Expense
  onClose: () => void
}

export function ExpenseModal({ group, expense, onClose }: ExpenseModalProps) {
  const { cur } = useCurrency()
  const { meId } = useAuth()
  const { memberById, addExpense, updateExpense, deleteExpense } = useData()
  const [initialDateTime] = useState(philippineDateTime)

  const [desc, setDesc] = useState(expense?.desc ?? '')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [fCur, setFCur] = useState<CurrencyCode>(expense?.cur ?? cur)
  const [paidBy, setPaidBy] = useState(
    expense && group.members.includes(expense.paidBy) ? expense.paidBy : meId,
  )
  const [parts, setParts] = useState<string[]>(() => {
    if (!expense) return group.members
    const activeParts = expense.parts.filter((id) => group.members.includes(id))
    return activeParts.length > 0 ? activeParts : group.members
  })
  const [date, setDate] = useState(expense?.date ?? initialDateTime.date)
  const [time, setTime] = useState(expense ? expense.time ?? '' : initialDateTime.time)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const includesFormerMember = Boolean(expense && (
    !group.members.includes(expense.paidBy) || expense.parts.some((id) => !group.members.includes(id))
  ))

  const now = philippineDateTime()
  const amt = parseFloat(amount)
  const dateIsNotFuture = Boolean(date) && date <= now.date
  const timeIsNotFuture = !time || date < now.date || (date === now.date && time <= now.time)
  const valid = desc.trim().length > 0 && amt > 0 && parts.length > 0 && dateIsNotFuture && timeIsNotFuture
  const splitHint = valid ? `${fmt(amt / parts.length, fCur)} each` : `${parts.length} selected`

  const toggle = (id: string) =>
    setParts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    if (!valid || saving || deleting) return
    setSaving(true)
    setError(null)
    try {
      const input = {
        gid: group.id,
        desc: desc.trim(),
        amount: amount.trim(),
        cur: fCur,
        paidBy,
        parts,
        date,
        time: time || undefined,
      }
      if (expense) await updateExpense(expense.id, input)
      else await addExpense(input)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the expense')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!expense || saving || deleting) return
    if (!window.confirm(`Delete “${expense.desc}”? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteExpense(group.id, expense.id)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the expense')
      setDeleting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 font-display text-[18px] font-bold [overflow-wrap:anywhere]">
        {expense ? 'Edit expense' : 'Add expense'} · {group.name}
      </div>
      <div className="flex flex-col gap-3.5">
        <Field
          label="DESCRIPTION"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. Dinner at Mang Larry's"
          maxLength={255}
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

        <div className="grid grid-cols-2 gap-2.5">
          <Field
            label="EXPENSE DATE"
            type="date"
            value={date}
            max={now.date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Field
            label="TIME (OPTIONAL)"
            type="time"
            step={60}
            value={time}
            max={date === now.date ? now.time : undefined}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>

        {time && (
          <button
            type="button"
            onClick={() => setTime('')}
            className="-mt-2 min-h-8 cursor-pointer self-end rounded-lg px-2 text-[11.5px] font-bold text-mute-2 transition-colors hover:bg-sand hover:text-ink"
          >
            Clear time
          </button>
        )}

        {!timeIsNotFuture && (
          <div className="text-[12px] font-semibold text-neg">Expense time cannot be in the future.</div>
        )}

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

        {includesFormerMember && (
          <div className="rounded-xl border border-ink/10 bg-sand px-3.5 py-2.5 text-[12px] leading-relaxed text-mute-2">
            This expense includes a former member. Saving will replace them with the active payer and participants selected above.
          </div>
        )}

        {error && <div className="text-[12.5px] font-semibold text-neg">{error}</div>}
        <div className={`mt-1 grid gap-2 ${expense ? 'grid-cols-[auto_minmax(0,1fr)]' : ''}`}>
          {expense && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={saving || deleting}
              className="min-h-11 cursor-pointer whitespace-nowrap rounded-full border border-neg/30 bg-cream px-4 text-[13px] font-bold text-neg transition-colors hover:bg-neg/5 disabled:cursor-default disabled:opacity-45"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <Button onClick={submit} disabled={!valid || saving || deleting} className="min-h-11 whitespace-nowrap p-[13px] text-[14px]">
            {saving ? 'Saving…' : expense ? 'Save changes' : 'Save expense'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
