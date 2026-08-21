import type { AuthService, AuthUser } from '../types'
import { ApiError, request, resetCsrf } from './apiClient'

interface SessionResponse {
  id: string
  email: string
  displayName: string
}

export class HttpAuthService implements AuthService {
  async current(): Promise<AuthUser | null> {
    try {
      const session = await request<SessionResponse>('/api/auth/session')
      return { id: session.id, name: session.displayName, email: session.email }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  }

  loginWithGoogle(returnTo?: string): void {
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
    window.location.assign(`/api/auth/google${query}`)
  }

  async logout(): Promise<void> {
    await request<void>('/api/auth/logout', { method: 'POST' })
    resetCsrf()
  }
}
