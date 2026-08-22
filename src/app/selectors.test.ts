import { describe, expect, it } from 'vitest'
import { groupView } from './selectors'
import type { Expense, Group, Member } from '@/domain/types'

const members: Member[] = [
  { id: 'a', name: 'Ana', full: 'Ana Cruz', email: 'ana@example.test', color: '#111111' },
  { id: 'b', name: 'Ben', full: 'Ben Lim', email: 'ben@example.test', color: '#222222' },
  { id: 'c', name: 'Cara', full: 'Cara Ong', email: 'cara@example.test', color: '#333333' },
]

const group: Group = {
  id: 'group',
  name: 'Trip',
  tile: '#5b7ec9',
  members: members.map((member) => member.id),
  formerMembers: [],
  owner: true,
  pendingInvites: [],
}

const expenses: Expense[] = [
  expense('usd', '2026-01-02', 10, 500, 'USD', 'a', ['a', 'b']),
  expense('php', '2026-01-03', 100, 100, 'PHP', 'c', ['c']),
  settlement('settlement', '2026-01-04', 200, 'b', 'c'),
  expense('eur', '2026-01-01', 20, 1200, 'EUR', 'a', ['a', 'c']),
]

describe('group expense list options', () => {
  it('defaults to newest first and supports every sort direction', () => {
    expect(rows()).toEqual(['settlement', 'php', 'usd', 'eur'])
    expect(rows('oldest')).toEqual(['eur', 'usd', 'php', 'settlement'])
    expect(rows('highest')).toEqual(['eur', 'usd', 'settlement', 'php'])
    expect(rows('lowest')).toEqual(['php', 'settlement', 'usd', 'eur'])
  })

  it('filters by original currency', () => {
    expect(view({ sort: 'newest', currency: 'USD', memberId: 'all' }).expenseRows.map((row) => row.id))
      .toEqual(['usd'])
  })

  it('matches members who paid, shared, sent, or received', () => {
    expect(view({ sort: 'newest', currency: 'all', memberId: 'b' }).expenseRows.map((row) => row.id))
      .toEqual(['settlement', 'usd'])
    expect(view({ sort: 'newest', currency: 'all', memberId: 'c' }).expenseRows.map((row) => row.id))
      .toEqual(['settlement', 'php', 'eur'])
  })
})

function rows(sort: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest'): string[] {
  return view({ sort, currency: 'all', memberId: 'all' }).expenseRows.map((row) => row.id)
}

function view(options: Parameters<typeof groupView>[7]) {
  return groupView(group, members, expenses, 'PHP', 'a', 0.01, true, options)
}

function expense(
  id: string,
  date: string,
  amount: number,
  phpAmount: number,
  cur: Expense['cur'],
  paidBy: string,
  parts: string[],
): Expense {
  return {
    id,
    gid: group.id,
    desc: id,
    amount,
    phpAmount,
    cur,
    paidBy,
    parts,
    shares: parts.map((userId) => ({
      userId,
      originalAmount: amount / parts.length,
      phpAmount: phpAmount / parts.length,
    })),
    date,
    settle: false,
  }
}

function settlement(id: string, date: string, amount: number, from: string, to: string): Expense {
  return {
    id,
    gid: group.id,
    desc: 'Settlement',
    amount,
    phpAmount: amount,
    cur: 'PHP',
    paidBy: from,
    parts: [to],
    shares: [],
    date,
    settle: true,
  }
}
