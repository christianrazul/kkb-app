import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { Button } from '../components/Button'

export function KkbInvitation() {
  const { user, loading, loginWithGoogle } = useAuth()

  if (loading) return <div className="grid min-h-dvh place-items-center text-sm font-bold text-mute">Loading KKB…</div>
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="grid min-h-dvh place-items-center bg-sand px-4 py-8">
      <main className="rise w-full max-w-[440px] rounded-[22px] border border-ink/10 bg-cream p-6 shadow-[0_20px_60px_rgba(58,49,40,.12)] sm:p-8">
        <div className="font-display text-[27px] font-extrabold">KKB<span className="text-terra">.</span></div>
        <div className="mt-7 text-[11px] font-bold tracking-[1px] text-terra">KKB INVITATION</div>
        <h1 className="mt-2 font-display text-[25px] font-bold leading-tight">Split bills without the awkward math.</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-mute-2">
          Create your KKB account to track shared expenses in their original currency and settle balances with friends.
        </p>
        <Button onClick={() => loginWithGoogle('/dashboard')} className="mt-6 min-h-12 w-full px-5">
          Join KKB with Google
        </Button>
        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-mute-3">
          Joining KKB does not add you to a group. Group access always requires a separate invitation.
        </p>
      </main>
    </div>
  )
}
