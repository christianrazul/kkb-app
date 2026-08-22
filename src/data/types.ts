import type { CurrencyCode, Expense, Group, Member, TimeFormat } from '@/domain/types'

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
  current(): Promise<AuthUser | null>
  loginWithGoogle(returnTo?: string): void
  logout(): Promise<void>
}

export interface NewExpenseInput {
  gid: string
  desc: string
  amount: string
  cur: CurrencyCode
  paidBy: string
  parts: string[]
  date: string
  time?: string
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
  load(): Promise<{ members: Member[]; groups: Group[]; expenses: Expense[] }>
  addExpense(input: NewExpenseInput): Promise<Expense>
  updateExpense(expenseId: string, input: NewExpenseInput): Promise<Expense>
  deleteExpense(groupId: string, expenseId: string): Promise<void>
  recordSettlement(input: SettlementInput): Promise<Expense>
  createGroup(name: string, tileColor: string): Promise<void>
  updateGroup(groupId: string, name: string, tileColor: string, timeFormat: TimeFormat): Promise<void>
  deleteGroup(groupId: string): Promise<void>
  inviteMember(groupId: string, email: string): Promise<void>
  revokeInvite(groupId: string, inviteId: string): Promise<void>
  removeMember(groupId: string, memberId: string): Promise<void>
  inviteToKkb(email: string): Promise<{ inviteUrl: string; deliveryStatus: 'QUEUED' | 'SENT' | 'FAILED' }>
}
