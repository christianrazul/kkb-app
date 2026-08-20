import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { Button } from '../components/Button'
import { Field } from '../components/Field'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
)

export function Login() {
  const { user, login, signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  const isSignup = mode === 'signup'
  const go = () => navigate('/dashboard', { replace: true })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSignup) await signup(name, email, pass)
    else await login(email, pass)
    go()
  }

  const onGoogle = async () => {
    await loginWithGoogle()
    go()
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink px-[60px] py-14 text-cream md:flex">
        <div>
          <div className="font-display text-[30px] font-extrabold tracking-[-0.5px]">
            KKB<span className="text-terra-light">.</span>
          </div>
          <div className="mt-0.5 text-[12px] text-mute-3">kanya-kanyang bayad</div>
        </div>
        <div className="max-w-[400px]">
          <div className="font-display text-[36px] font-bold leading-[1.15] text-pretty">
            Split bills with friends, minus the awkward math.
          </div>
          <div className="mt-[14px] text-[14.5px] leading-[1.55] text-cream-dim">
            Track group expenses in ₱ or any currency, see who owes what, and settle up in a tap.
          </div>
        </div>
        <div className="flex gap-[22px] text-[12px] text-mute-3">
          <span>₱ PHP by default</span>
          <span>·</span>
          <span>Multi-currency</span>
          <span>·</span>
          <span>Free for barkadas</span>
        </div>
      </div>

      <div className="grid place-items-center px-5 py-8 sm:p-10">
        <form onSubmit={onSubmit} className="rise w-full max-w-[380px]">
          <div className="font-display text-[23px] font-bold">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </div>
          <div className="mt-1.5 mb-[22px] text-[13px] text-mute">
            {isSignup ? 'Start splitting in under a minute.' : 'Log in to see who owes who.'}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={onGoogle}
            className="flex w-full items-center justify-center gap-[10px] !border-ink/[.18] !bg-white p-3 text-[14px] hover:!bg-sand"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-[11.5px] font-bold tracking-[.8px] text-mute-3">
            <span className="h-px flex-1 bg-ink/[.12]" />
            OR
            <span className="h-px flex-1 bg-ink/[.12]" />
          </div>

          <div className="flex flex-col gap-3">
            {isSignup && (
              <Field
                label="FULL NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan dela Cruz"
              />
            )}
            <Field
              label="EMAIL"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Field
              label="PASSWORD"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" className="mt-1.5 p-[13px] text-[14px]">
              {isSignup ? 'Create account' : 'Log in'}
            </Button>
          </div>

          <div className="mt-[18px] text-center text-[13px] text-mute-2">
            {isSignup ? 'Already have an account?' : 'New to KKB?'}{' '}
            <button
              type="button"
              onClick={() => setMode(isSignup ? 'login' : 'signup')}
              className="cursor-pointer border-none bg-none p-0 text-[13px] font-bold text-terra hover:text-terra-dark"
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
