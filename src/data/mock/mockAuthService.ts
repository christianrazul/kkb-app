import type { AuthService, AuthUser } from '../types'
import { ME_ID } from '../seed'

const STORAGE_KEY = 'kkb.auth'

/**
 * Demo auth: any credentials succeed and resolve to the seeded current user.
 * The session is persisted to localStorage so a refresh keeps you signed in.
 */
export class MockAuthService implements AuthService {
  private read(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  }

  private write(user: AuthUser): AuthUser {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }

  current(): AuthUser | null {
    return this.read()
  }

  async login(email: string): Promise<AuthUser> {
    return this.write({ id: ME_ID, name: 'Ana Reyes', email })
  }

  async signup(name: string, email: string): Promise<AuthUser> {
    return this.write({ id: ME_ID, name: name || 'Ana Reyes', email })
  }

  async loginWithGoogle(): Promise<AuthUser> {
    return this.write({ id: ME_ID, name: 'Ana Reyes', email: 'ana.reyes@gmail.com' })
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
}
