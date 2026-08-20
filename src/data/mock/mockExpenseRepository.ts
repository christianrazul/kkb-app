import type { Expense, Group, Member } from '@/domain/types'
import { todayIso } from '@/domain/format'
import type {
  ExpenseRepository,
  NewExpenseInput,
  SettlementInput,
} from '../types'
import { SEED_EXPENSES, SEED_GROUPS, SEED_MEMBERS } from '../seed'

/**
 * In-memory repository seeded with the demo dataset. State lives for the tab
 * session only. A real implementation would issue network requests here.
 */
export class MockExpenseRepository implements ExpenseRepository {
  private members: Member[] = SEED_MEMBERS
  private groups: Group[] = SEED_GROUPS
  private expenses: Expense[] = [...SEED_EXPENSES]

  async listMembers(): Promise<Member[]> {
    return this.members
  }

  async listGroups(): Promise<Group[]> {
    return this.groups
  }

  async listExpenses(): Promise<Expense[]> {
    return [...this.expenses]
  }

  async addExpense(input: NewExpenseInput): Promise<Expense> {
    const rec: Expense = {
      id: 'e' + Date.now(),
      gid: input.gid,
      desc: input.desc,
      amount: input.amount,
      cur: input.cur,
      paidBy: input.paidBy,
      parts: input.parts,
      date: todayIso(),
      settle: false,
    }
    this.expenses = [...this.expenses, rec]
    return rec
  }

  async recordSettlement(input: SettlementInput): Promise<Expense> {
    const rec: Expense = {
      id: 'e' + Date.now(),
      gid: input.gid,
      desc: 'Settlement',
      amount: Math.round(input.amount * 100) / 100,
      cur: input.cur,
      paidBy: input.from,
      parts: [input.to],
      date: todayIso(),
      settle: true,
    }
    this.expenses = [...this.expenses, rec]
    return rec
  }
}
