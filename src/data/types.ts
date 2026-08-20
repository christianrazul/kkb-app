import type { CurrencyCode, Expense, Group, Member } from '@/domain/types'

export interface AuthUser {
  id: string
  name: string
  email: string
}

/**
 * Authentication boundary. The mock implementation accepts any credentials;
 * a real implementation would call an identity backend and return the session.
 */
export interface AuthService {
  /** Restore a persisted session, if any. */
  current(): AuthUser | null
  login(email: string, password: string): Promise<AuthUser>
  signup(name: string, email: string, password: string): Promise<AuthUser>
  loginWithGoogle(): Promise<AuthUser>
  logout(): Promise<void>
}

export interface NewExpenseInput {
  gid: string
  desc: string
  amount: number
  cur: CurrencyCode
  paidBy: string
  parts: string[]
}

export interface SettlementInput {
  gid: string
  from: string
  to: string
  amount: number
  cur: CurrencyCode
}

/**
 * Data boundary for groups, members, and expenses. Swap the mock for an
 * HTTP-backed implementation without touching the domain or UI layers.
 */
export interface ExpenseRepository {
  listMembers(): Promise<Member[]>
  listGroups(): Promise<Group[]>
  listExpenses(): Promise<Expense[]>
  addExpense(input: NewExpenseInput): Promise<Expense>
  recordSettlement(input: SettlementInput): Promise<Expense>
}
