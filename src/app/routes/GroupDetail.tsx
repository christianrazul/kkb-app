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
    <div className="rise mx-auto max-w-[1180px]">
      <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:gap-4">
        <Avatar label={vm.initial} color={vm.tile} size={54} radius={16} fontSize={22} display />
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 font-display text-[23px] font-bold [overflow-wrap:anywhere] sm:text-[25px]">{vm.name}</h1>
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

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <aside
          aria-labelledby="group-balances-heading"
          className="order-1 rounded-[18px] border border-ink/[.08] bg-cream px-4 pt-4 pb-2 sm:px-5 xl:order-2 xl:sticky xl:top-0"
        >
          <h2 id="group-balances-heading" className="font-display text-[15px] font-bold">
            Group balances
          </h2>
          <p className="mt-0.5 pb-2 text-[11.5px] text-mute">
            {displayCur === 'ORIGINAL' ? 'Balances shown in PHP.' : `Balances shown in ${displayCur}.`}
          </p>
          {vm.balances.map((balance) => (
            <div key={balance.id} className="flex min-w-0 items-center gap-3 border-t border-ink/[.06] py-3">
              <Avatar label={balance.initials} color={balance.color} size={36} fontSize={11} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold [overflow-wrap:anywhere]">{balance.name}</span>
                <span className={`mt-px block text-[12.5px] font-semibold ${toneText[balance.tone]}`}>
                  {balance.dirLabel}
                  {balance.amtFmt && (
                    <span className="ml-1 whitespace-nowrap [font-variant-numeric:tabular-nums]">{balance.amtFmt}</span>
                  )}
                </span>
              </span>
            </div>
          ))}
        </aside>

        <section aria-label="Group expenses" className="order-2 min-w-0 xl:order-1">
          <div className="mb-3 grid w-full grid-cols-3 gap-1.5 sm:ml-auto sm:w-auto sm:justify-end sm:[grid-template-columns:repeat(3,122px)]">
            <select
              aria-label="Sort expenses"
              value={sort}
              onChange={(event) => setSort(event.target.value as ExpenseSort)}
              className="h-10 min-w-0 cursor-pointer rounded-lg border border-ink/15 bg-cream px-2 text-[11.5px] font-semibold text-ink outline-none sm:w-[122px]"
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
              className="h-10 min-w-0 cursor-pointer rounded-lg border border-ink/15 bg-cream px-2 text-[11.5px] font-semibold text-ink outline-none sm:w-[122px]"
            >
              <option value="all">All currencies</option>
              {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}
            </select>
            <select
              aria-label="Filter by member"
              value={memberFilter}
              onChange={(event) => setMemberFilter(event.target.value)}
              className="h-10 min-w-0 cursor-pointer rounded-lg border border-ink/15 bg-cream px-2 text-[11.5px] font-semibold text-ink outline-none sm:w-[122px]"
            >
              <option value="all">All members</option>
              {filterMemberIds.map((id) => (
                <option key={id} value={id}>
                  {memberByLabel(members, id)}{group.formerMembers.includes(id) ? ' (former)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-ink/[.08] bg-cream px-3 sm:px-5">
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
                className={`flex items-center gap-2.5 py-3 first:border-t-0 last:border-b-0 sm:gap-3 ${
                  e.manageable
                    ? '-mx-3 cursor-pointer border-t border-ink/[.06] px-3 transition-colors hover:bg-sand-2/70 sm:-mx-5 sm:px-5'
                    : '-mx-3 border-y border-pos/25 bg-pos/10 px-3 sm:-mx-5 sm:px-5'
                }`}
              >
                <span className="w-14 flex-none text-center sm:w-[58px]">
                  <span className="block text-[10px] font-bold tracking-[.8px] text-mute-3">{e.mon}</span>
                  <span className="block font-display text-[17px] font-bold text-mute-4">{e.day}</span>
                  {e.time && <span className="mt-0.5 block whitespace-nowrap text-[9.5px] font-semibold text-mute">{e.time}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold [overflow-wrap:anywhere]">{e.desc}</span>
                  <span className="mt-px block text-[12px] text-mute">{e.paidLine}</span>
                </span>
                <span className="flex-none whitespace-nowrap text-right [font-variant-numeric:tabular-nums]">
                  <span className="block text-[11px] text-mute">{e.dirLabel}</span>
                  <span className={`block text-[14px] font-bold ${toneText[e.tone]}`}>{e.shareFmt}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
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
