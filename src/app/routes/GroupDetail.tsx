import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useCurrency } from '../providers/CurrencyProvider'
import { useData } from '../providers/DataProvider'
import { groupView } from '../selectors'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { toneText } from '../components/tone'
import { ExpenseModal } from '../components/ExpenseModal'
import { SettleModal } from '../components/SettleModal'
import { eps } from '@/domain/currency'
import { InviteModal } from '../components/InviteModal'
import { EmptyState } from '../components/EmptyState'

export function GroupDetail() {
  const { groupId } = useParams()
  const { meId } = useAuth()
  const { cur, displayCur } = useCurrency()
  const { members, expenses, groupById, loaded } = useData()
  const [modal, setModal] = useState<'expense' | 'settle' | 'members' | null>(null)

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
  )

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
            <Button variant="secondary" onClick={() => setModal('members')} className="min-h-11 w-full whitespace-nowrap px-4 py-[11px] text-[13px] sm:w-auto">
              Members
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

      <div className="mb-[18px] flex flex-wrap gap-2">
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
      </div>

      <div className="rounded-[18px] border border-ink/[.08] bg-cream px-3 py-1.5 sm:px-6">
        {vm.expenseRows.length === 0 && (
          <EmptyState
            title="No expenses yet"
            message="Add an expense to start tracking this group."
            className="min-h-[180px] py-10 sm:min-h-[200px]"
          />
        )}
        {vm.expenseRows.map((e) => (
          <div key={e.id} className="flex items-center gap-2.5 border-t border-ink/[.06] py-3.5 sm:gap-3.5">
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
      {modal === 'settle' && <SettleModal group={group} onClose={() => setModal(null)} />}
      {modal === 'members' && <InviteModal group={group} onClose={() => setModal(null)} />}
    </div>
  )
}
