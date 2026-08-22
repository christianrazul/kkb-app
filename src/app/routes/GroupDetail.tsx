import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useCurrency } from '../providers/CurrencyProvider'
import { useData } from '../providers/DataProvider'
import { groupView } from '../selectors'
import type { ExpenseSort } from '../selectors'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { toneText } from '../components/tone'
import { ExpenseModal } from '../components/ExpenseModal'
import { SettleModal } from '../components/SettleModal'
import { CURRENCIES, eps } from '@/domain/currency'
import type { CurrencyCode } from '@/domain/types'
import { EmptyState } from '../components/EmptyState'

export function GroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { meId } = useAuth()
  const { cur, displayCur } = useCurrency()
  const { members, expenses, groupById, loaded } = useData()
  const [modal, setModal] = useState<'expense' | 'settle' | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [sort, setSort] = useState<ExpenseSort>('newest')
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode | 'all'>('all')
  const [memberFilter, setMemberFilter] = useState<string | 'all'>('all')

  const group = groupId ? groupById(groupId) : undefined
  if (loaded && !group) return <Navigate to="/dashboard" replace />
  if (!group) return null

  const vm = groupView(
    group,
    members,
    expenses,
    cur,
    meId,
    eps(cur),
    displayCur === 'ORIGINAL',
    { sort, currency: currencyFilter, memberId: memberFilter },
  )
  const editingExpense = expenses.find((expense) => expense.id === editingExpenseId)
  const filterMemberIds = [...group.members, ...group.formerMembers]

  return (
    <div className="rise mx-auto max-w-[880px]">
      <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:gap-4">
        <Avatar label={vm.initial} color={vm.tile} size={54} radius={16} fontSize={22} display />
        <div className="min-w-0 flex-1">
          <div className="min-w-0 font-display text-[23px] font-bold [overflow-wrap:anywhere] sm:text-[25px]">{vm.name}</div>
          <div className="mt-0.5 text-[12.5px] text-mute">{vm.meta}</div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2.5 sm:ml-auto sm:flex">
          {group.owner && (
            <Button variant="secondary" onClick={() => navigate(`/groups/${group.id}/settings`)} className="min-h-11 w-full whitespace-nowrap px-4 py-[11px] text-[13px] sm:w-auto">
              Settings
            </Button>
          )}
          <Button variant="secondary" onClick={() => setModal('settle')} className="min-h-11 w-full whitespace-nowrap px-4 py-[11px] text-[13px] sm:w-auto sm:px-[18px]">
            Settle up
          </Button>
          <Button onClick={() => setModal('expense')} className="min-h-11 w-full whitespace-nowrap px-4 py-[11px] text-[13px] sm:w-auto sm:px-5">
            Add expense
          </Button>
        </div>
      </div>

      <div className="mb-[18px] flex flex-wrap items-center gap-2">
        {vm.balances.map((b) => (
          <span
            key={b.id}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-ink/[.09] bg-cream py-1.5 pr-[15px] pl-1.5 text-[12.5px]"
          >
            <Avatar label={b.initials} color={b.color} size={26} fontSize={10} />
            <span className="min-w-0 truncate font-bold">{b.name}</span>
            <span className={`flex-none whitespace-nowrap font-bold ${toneText[b.tone]}`}>{b.amtFmt}</span>
          </span>
        ))}
        <div className="grid w-full grid-cols-3 gap-1.5 sm:ml-auto sm:w-auto">
          <select
            aria-label="Sort expenses"
            value={sort}
            onChange={(event) => setSort(event.target.value as ExpenseSort)}
            className="h-9 min-w-0 cursor-pointer rounded-lg border border-ink/15 bg-cream px-2 text-[11.5px] font-semibold text-ink outline-none sm:w-[102px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest</option>
            <option value="lowest">Lowest</option>
          </select>
          <select
            aria-label="Filter by currency"
            value={currencyFilter}
            onChange={(event) => setCurrencyFilter(event.target.value as CurrencyCode | 'all')}
            className="h-9 min-w-0 cursor-pointer rounded-lg border border-ink/15 bg-cream px-2 text-[11.5px] font-semibold text-ink outline-none sm:w-[122px]"
          >
            <option value="all">All currencies</option>
            {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}
          </select>
          <select
            aria-label="Filter by member"
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
            className="h-9 min-w-0 cursor-pointer rounded-lg border border-ink/15 bg-cream px-2 text-[11.5px] font-semibold text-ink outline-none sm:w-[122px]"
          >
            <option value="all">All members</option>
            {filterMemberIds.map((id) => (
              <option key={id} value={id}>
                {memberByLabel(members, id)}{group.formerMembers.includes(id) ? ' (former)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-[18px] border border-ink/[.08] bg-cream px-3 py-1.5 sm:px-6">
        {vm.expenseRows.length === 0 && (
          <EmptyState
            title={expenses.some((expense) => expense.gid === group.id) ? 'No matching activity' : 'No expenses yet'}
            message={expenses.some((expense) => expense.gid === group.id) ? 'Adjust the filters to see more activity.' : 'Add an expense to start tracking this group.'}
            className="min-h-[180px] py-10 sm:min-h-[200px]"
          />
        )}
        {vm.expenseRows.map((e) => (
          <div
            key={e.id}
            onClick={e.manageable ? () => setEditingExpenseId(e.id) : undefined}
            className={`flex items-center gap-2.5 py-3.5 sm:gap-3.5 ${
              e.manageable
                ? '-mx-2 cursor-pointer border-t border-ink/[.06] px-2 transition-colors hover:bg-sand-2/70'
                : 'my-1 rounded-xl border border-pos/25 bg-pos/10 px-2.5'
            }`}
          >
            <span className="w-9 flex-none text-center sm:w-11">
              <span className="block text-[10px] font-bold tracking-[.8px] text-mute-3">{e.mon}</span>
              <span className="block font-display text-[17px] font-bold text-mute-4">{e.day}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold [overflow-wrap:anywhere]">{e.desc}</span>
              <span className="mt-px block text-[12px] text-mute">{e.paidLine}</span>
            </span>
            <span className="flex-none whitespace-nowrap text-right">
              <span className="block text-[11px] text-mute">{e.dirLabel}</span>
              <span className={`block text-[14px] font-bold ${toneText[e.tone]}`}>{e.shareFmt}</span>
            </span>
          </div>
        ))}
      </div>

      {modal === 'expense' && <ExpenseModal group={group} onClose={() => setModal(null)} />}
      {editingExpense && <ExpenseModal group={group} expense={editingExpense} onClose={() => setEditingExpenseId(null)} />}
      {modal === 'settle' && <SettleModal group={group} onClose={() => setModal(null)} />}
    </div>
  )
}

function memberByLabel(members: Array<{ id: string; full: string }>, id: string): string {
  return members.find((member) => member.id === id)?.full ?? 'Unknown member'
}
