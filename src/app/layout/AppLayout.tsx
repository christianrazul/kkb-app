import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DisplayCurrencySelect } from '../components/DisplayCurrencySelect'
import { useCurrency } from '../providers/CurrencyProvider'
import { useData } from '../providers/DataProvider'

function useHeaderTitle(): string {
  const { pathname } = useLocation()
  const { groupById } = useData()
  if (pathname.startsWith('/activity')) return 'Activity'
  if (pathname.startsWith('/groups/')) {
    const id = pathname.split('/')[2]
    return groupById(id)?.name ?? 'Group'
  }
  return 'Dashboard'
}

export function AppLayout() {
  const { displayCur, setDisplayCur } = useCurrency()
  const title = useHeaderTitle()
  const [navOpen, setNavOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeNav = useCallback(() => {
    setNavOpen(false)
    requestAnimationFrame(() => menuButtonRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!navOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeNav()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeNav, navOpen])

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar open={navOpen} onClose={closeNav} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex flex-none items-center justify-between gap-3 px-4 pt-3 sm:px-6 sm:pt-4 lg:px-9 lg:pt-[18px]">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setNavOpen(true)}
              className="grid size-10 flex-none cursor-pointer place-items-center rounded-xl border border-ink/[.1] bg-cream text-ink transition-colors hover:bg-sand-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra lg:hidden"
              aria-label="Open navigation"
              aria-controls="app-navigation"
              aria-expanded={navOpen}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
            <div className="min-w-0 truncate font-display text-[17px] font-bold sm:text-[18px]">{title}</div>
          </div>
          <label className="flex flex-none items-center gap-2 text-[12.5px] font-bold text-mute-2">
            <span className="hidden sm:inline">Show in</span>
            <DisplayCurrencySelect
              value={displayCur}
              onChange={setDisplayCur}
              className="min-h-10 bg-cream px-2.5 py-2 text-[13px] font-bold sm:px-3"
            />
          </label>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:px-9 lg:pb-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
