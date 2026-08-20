import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useCurrency } from '../providers/CurrencyProvider'
import { useData } from '../providers/DataProvider'
import { sidebarGroups } from '../selectors'
import { Avatar } from '../components/Avatar'
import { eps } from '@/domain/currency'
import { initials } from '@/domain/format'

const navItem = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2.5 text-left text-[13.5px] font-bold transition-colors ${
    isActive ? 'bg-sand-2 text-ink' : 'text-mute-2 hover:bg-sand-2/60'
  }`

const balTone: Record<'pos' | 'neg' | 'muted', string> = {
  pos: 'text-pos',
  neg: 'text-neg',
  muted: 'text-mute-3',
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, meId, logout } = useAuth()
  const { cur } = useCurrency()
  const { groups, expenses } = useData()
  const navigate = useNavigate()
  const asideRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const groupRows = sidebarGroups(groups, expenses, cur, meId, eps(cur))

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (!open) return
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 220)
    return () => window.clearTimeout(focusTimer)
  }, [open])

  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (!open || event.key !== 'Tab') return

    const controls = asideRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!controls?.length) return

    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className={`fixed inset-0 z-40 cursor-default bg-ink/40 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        tabIndex={-1}
      />
      <aside
        ref={asideRef}
        id="app-navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[calc(100%-3rem)] max-w-[280px] flex-none flex-col border-r border-ink/[.09] bg-cream px-3.5 py-5 shadow-[8px_0_30px_rgba(58,49,40,.12)] transition-[transform,visibility] duration-200 lg:visible lg:static lg:z-auto lg:w-[240px] lg:translate-x-0 lg:py-6 lg:shadow-none ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
        aria-label="Primary navigation"
        onKeyDown={trapFocus}
      >
        <div className="flex items-start justify-between gap-3 px-3 pb-5 lg:pb-6">
          <div>
            <div className="font-display text-[27px] font-extrabold tracking-[-0.5px] text-ink">
              KKB<span className="text-terra">.</span>
            </div>
            <div className="mt-0.5 text-[11.5px] text-mute">kanya-kanyang bayad</div>
          </div>
          {open && (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="grid size-10 flex-none cursor-pointer place-items-center rounded-xl text-mute-2 transition-colors hover:bg-sand-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra lg:hidden"
              aria-label="Close navigation"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="m4.5 4.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <nav className="flex flex-col gap-[3px]">
            <NavLink to="/dashboard" className={navItem} onClick={onClose}>
              Dashboard
            </NavLink>
            <NavLink to="/activity" className={navItem} onClick={onClose}>
              Activity
            </NavLink>
          </nav>

          <div className="mx-3 mt-[22px] mb-2 text-[10.5px] font-bold tracking-[1.2px] text-mute-3">
            GROUPS
          </div>
          <div className="flex flex-col gap-[3px]">
            {groupRows.map((g) => (
              <NavLink
                key={g.id}
                to={`/groups/${g.id}`}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
                    isActive ? 'bg-sand-2 text-ink' : 'text-mute-2 hover:bg-sand-2/60'
                  }`
                }
              >
                <Avatar label={g.initial} color={g.tile} size={28} radius={9} fontSize={12} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{g.name}</span>
                  <span className={`block text-[11px] font-semibold ${balTone[g.tone]}`}>
                    {g.balLine}
                  </span>
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex flex-none items-center gap-2.5 border-t border-ink/[.08] px-3 pt-3">
          <Avatar
            label={initials(user?.name ?? 'You')}
            color="#c25e3a"
            size={32}
            fontSize={12}
          />
          <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{user?.name ?? 'You'}</span>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="min-h-11 cursor-pointer px-1 text-[11.5px] font-bold text-mute-3 transition-colors hover:text-terra focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
          >
            Out
          </button>
        </div>
      </aside>
    </>
  )
}
