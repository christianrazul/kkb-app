import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { Button } from '../components/Button'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

export function Login() {
  const { user, loading, loginWithGoogle } = useAuth()

  if (loading) return <div className="grid min-h-dvh place-items-center text-sm font-bold text-mute">Loading KKB…</div>
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink px-[60px] py-14 text-cream md:flex">
        <div>
          <div className="font-display text-[30px] font-extrabold tracking-[-0.5px]">KKB<span className="text-terra-light">.</span></div>
          <div className="mt-0.5 text-[12px] text-mute-3">kanya-kanyang bayad</div>
        </div>
        <div className="max-w-[400px]">
          <div className="font-display text-[36px] font-bold leading-[1.15] text-pretty">Split bills with friends, minus the awkward math.</div>
          <div className="mt-[14px] text-[14.5px] leading-[1.55] text-cream-dim">Track group expenses in their original currency, see who owes what, and settle up in a tap.</div>
        </div>
        <div className="text-[12px] text-mute-3">Original-currency logs · Locked daily rates · Private groups</div>
      </div>

      <div className="grid place-items-center px-5 py-8 sm:p-10">
        <div className="rise w-full max-w-[380px]">
          <div className="font-display text-[23px] font-bold">Welcome to KKB</div>
          <div className="mt-1.5 mb-[22px] text-[13px] text-mute">Sign in securely with your Google account.</div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => loginWithGoogle()}
            className="flex w-full items-center justify-center gap-[10px] !border-ink/[.18] !bg-white p-3 text-[14px] hover:!bg-sand"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-mute-3">KKB only uses your name, email, and profile picture to identify you inside shared groups.</p>
          <p className="mt-3 text-center text-[11px] text-mute-3">
            By continuing, you agree to the <Link to="/terms" className="underline hover:text-ink">Terms</Link> and acknowledge the <Link to="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
