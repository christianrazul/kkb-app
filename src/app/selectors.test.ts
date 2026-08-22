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
  timeFormat: 'TWELVE_HOUR',
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

  it('sorts same-day expenses by their optional time and formats it for the group', () => {
    const sameDay = [
      expense('untimed', '2026-01-05', 10, 10, 'PHP', 'a', ['a']),
      expense('morning', '2026-01-05', 10, 10, 'PHP', 'a', ['a'], '08:15'),
      expense('evening', '2026-01-05', 10, 10, 'PHP', 'a', ['a'], '18:45'),
    ]

    const twelveHourRows = groupView(group, members, sameDay, 'PHP', 'a', 0.01, true).expenseRows
    expect(twelveHourRows.map((row) => row.id)).toEqual(['evening', 'morning', 'untimed'])
    expect(twelveHourRows.map((row) => row.time)).toEqual(['6:45 PM', '8:15 AM', undefined])

    const oldestRows = groupView(
      group,
      members,
      sameDay,
      'PHP',
      'a',
      0.01,
      true,
      { sort: 'oldest', currency: 'all', memberId: 'all' },
    ).expenseRows
    expect(oldestRows.map((row) => row.id)).toEqual(['morning', 'evening', 'untimed'])

    const twentyFourHourRows = groupView(
      { ...group, timeFormat: 'TWENTY_FOUR_HOUR' },
      members,
      sameDay,
      'PHP',
      'a',
      0.01,
      true,
    ).expenseRows
    expect(twentyFourHourRows.map((row) => row.time)).toEqual(['18:45', '08:15', undefined])
  })
})

describe('group summary', () => {
  it('uses a member count and Splitwise-style aggregate balance labels', () => {
    const summary = groupView(group, members, expenses, 'PHP', 'a', 0.01, true)

    expect(summary.meta).toBe('3 members')
    expect(summary.balances.map(({ name, dirLabel, amtFmt, tone }) => ({ name, dirLabel, amtFmt, tone })))
      .toEqual([
        { name: 'Ana Cruz', dirLabel: 'gets back', amtFmt: '₱850', tone: 'pos' },
        { name: 'Ben Lim', dirLabel: 'owes', amtFmt: '₱50', tone: 'neg' },
        { name: 'Cara Ong', dirLabel: 'owes', amtFmt: '₱800', tone: 'neg' },
      ])
  })

  it('uses singular member copy and a settled-up state without an amount', () => {
    const soloGroup = { ...group, members: ['a'] }
    const summary = groupView(soloGroup, members, [], 'PHP', 'a', 0.01, true)

    expect(summary.meta).toBe('1 member')
    expect(summary.balances[0]).toMatchObject({
      name: 'Ana Cruz',
      dirLabel: 'settled up',
      amtFmt: '',
      tone: 'muted',
    })
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
  time?: string,
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
    time,
    createdAt: `${date}T00:00:00Z`,
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
    createdAt: `${date}T00:00:00Z`,
    settle: true,
  }
}
