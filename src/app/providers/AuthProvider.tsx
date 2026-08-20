import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authService } from '@/data'
import { ME_ID } from '@/data/seed'
import type { AuthUser } from '@/data/types'

interface AuthContextValue {
  user: AuthUser | null
  /** Current user's member id, used by balance selectors. */
  meId: string
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.current())

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authService.login(email, password))
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setUser(await authService.signup(name, email, password))
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setUser(await authService.loginWithGoogle())
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, meId: user?.id ?? ME_ID, login, signup, loginWithGoogle, logout }),
    [user, login, signup, loginWithGoogle, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
