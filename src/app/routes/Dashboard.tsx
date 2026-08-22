import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useCurrency } from '../providers/CurrencyProvider'
import { useData } from '../providers/DataProvider'
import { dashboardView } from '../selectors'
import { Avatar } from '../components/Avatar'
import { toneText } from '../components/tone'
import { eps, fmt, fmtSigned } from '@/domain/currency'
import { Button } from '../components/Button'
import { GroupModal } from '../components/GroupModal'
import { KkbInviteModal } from '../components/KkbInviteModal'
import { EmptyState } from '../components/EmptyState'

const cardBase = 'rounded-[18px] border border-ink/[.08] bg-cream'
const cardTitle = 'font-display text-[14.5px] font-bold'
const statLabel = 'text-[11.5px] font-bold tracking-[.8px]'

export function Dashboard() {
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [invitingToKkb, setInvitingToKkb] = useState(false)
  const { meId } = useAuth()
  const { cur } = useCurrency()
  const { members, groups, expenses, loaded } = useData()
  const navigate = useNavigate()

  const vm = dashboardView(members, groups, expenses, cur, meId, eps(cur))

  return (
    <div className="rise mx-auto max-w-[980px]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-[20px] font-bold">Your shared expenses</div>
          <div className="text-[12.5px] text-mute">Balances use locked expense-date rates.</div>
        </div>
        <div className="grid flex-none grid-cols-2 gap-2 sm:flex">
          <Button variant="secondary" onClick={() => setInvitingToKkb(true)} className="min-h-11 whitespace-nowrap px-4">Invite to KKB</Button>
          <Button onClick={() => setCreatingGroup(true)} className="min-h-11 whitespace-nowrap px-4">New group</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className={`${cardBase} px-4 py-4 sm:px-[22px] sm:py-5`}>
          <div className={`${statLabel} text-mute`}>YOU ARE OWED</div>
          <div className="mt-1.5 font-display text-[27px] font-bold text-pos">{fmt(vm.owed, cur)}</div>
        </div>
        <div className={`${cardBase} px-4 py-4 sm:px-[22px] sm:py-5`}>
          <div className={`${statLabel} text-mute`}>YOU OWE</div>
          <div className="mt-1.5 font-display text-[27px] font-bold text-neg">{fmt(vm.owe, cur)}</div>
        </div>
        <div className="rounded-[18px] bg-ink px-4 py-4 text-cream sm:px-[22px] sm:py-5">
          <div className={`${statLabel} text-mute-3`}>NET BALANCE</div>
          <div
            className={`mt-1.5 font-display text-[27px] font-bold ${
              vm.net >= 0 ? 'text-pos-soft' : 'text-neg-soft'
            }`}
          >
            {fmtSigned(vm.net, cur)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div className={`${cardBase} px-4 pt-2 pb-2.5 sm:px-[22px]`}>
          <div className={`${cardTitle} pt-[14px] pb-1.5`}>Friends</div>
          {loaded && vm.friendRows.length === 0 && (
            <EmptyState
              title="No balances yet"
              message="Balances will appear after expenses are added."
              className="min-h-[120px] border-t border-ink/[.06] py-7"
            />
          )}
          {vm.friendRows.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 border-t border-ink/[.06] py-3"
            >
              <Avatar label={f.initials} color={f.color} size={34} fontSize={12} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">{f.name}</span>
              <span className="flex-none whitespace-nowrap text-right">
                <span className="block text-[11px] text-mute">{f.dirLabel}</span>
                <span className={`block text-[14px] font-bold ${toneText[f.tone]}`}>
                  {f.amtFmt}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className={`${cardBase} px-4 pt-2 pb-[18px] sm:px-[22px]`}>
            <div className={`${cardTitle} pt-[14px] pb-2.5`}>Your groups</div>
            <div className="flex flex-col gap-2">
              {loaded && vm.groupCards.length === 0 && (
                <EmptyState
                  title="No groups yet"
                  message="Create a group to start tracking expenses."
                  className="min-h-[130px] rounded-[14px] bg-sand py-7"
                />
              )}
              {vm.groupCards.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="flex min-w-0 items-center gap-3 rounded-[14px] border border-ink/[.05] bg-sand px-3.5 py-3 text-left transition-colors hover:bg-sand-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
                >
                  <Avatar label={g.initial} color={g.tile} size={36} radius={11} fontSize={14} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold">{g.name}</span>
                    <span className="block text-[11.5px] text-mute">{g.meta}</span>
                  </span>
                  <span className={`flex-none whitespace-nowrap text-[13px] font-bold ${toneText[g.tone]}`}>{g.balShort}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`${cardBase} px-4 pt-2 pb-3 sm:px-[22px]`}>
            <div className={`${cardTitle} pt-[14px] pb-1`}>Recent</div>
            {loaded && vm.recentRows.length === 0 && (
              <EmptyState
                title="No recent activity yet"
                message="Your latest expenses and settlements will appear here."
                className="min-h-[110px] border-t border-ink/[.06] py-6"
              />
            )}
            {vm.recentRows.map((r) => (
              <div
                key={r.id}
                className="flex items-baseline gap-2.5 border-t border-ink/[.06] py-[9px] text-[12.5px]"
              >
                <span className="w-12 flex-none text-[11px] text-mute">{r.date}</span>
                <span className="min-w-0 flex-1 truncate">{r.line}</span>
                <span className="flex-none whitespace-nowrap font-bold text-mute-2">{r.amt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {creatingGroup && <GroupModal onClose={() => setCreatingGroup(false)} />}
      {invitingToKkb && <KkbInviteModal onClose={() => setInvitingToKkb(false)} />}
    </div>
  )
}
