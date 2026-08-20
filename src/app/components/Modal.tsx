import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  children: ReactNode
  width?: number
}

export function Modal({ onClose, children, width = 430 }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid items-end justify-items-center bg-ink/40 p-0 sm:place-items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="rise-fast max-h-[calc(100dvh-1rem)] w-full overscroll-contain overflow-y-auto rounded-t-[22px] bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-h-[90dvh] sm:rounded-[22px] sm:p-[26px]"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}
