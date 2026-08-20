import type { Expense, Group, Member } from '@/domain/types'

/** The current user's member id in the demo dataset. */
export const ME_ID = 'u1'

export const SEED_MEMBERS: Member[] = [
  { id: 'u1', name: 'You', full: 'Ana Reyes', color: '#c25e3a' },
  { id: 'u2', name: 'Miguel', full: 'Miguel Santos', color: '#5b7ec9' },
  { id: 'u3', name: 'Bea', full: 'Bea Lim', color: '#c98a2e' },
  { id: 'u4', name: 'Carlo', full: 'Carlo Dizon', color: '#b0568f' },
  { id: 'u5', name: 'Dana', full: 'Dana Cruz', color: '#5a9260' },
]

export const SEED_GROUPS: Group[] = [
  { id: 'g1', name: 'Baguio Trip', tile: '#5b7ec9', members: ['u1', 'u2', 'u3', 'u4'] },
  { id: 'g2', name: 'Apartment 12B', tile: '#c98a2e', members: ['u1', 'u3', 'u5'] },
  { id: 'g3', name: 'Badminton Fridays', tile: '#5a9260', members: ['u1', 'u2', 'u4', 'u5'] },
]

let seq = 0
const E = (
  gid: string,
  desc: string,
  amount: number,
  cur: Expense['cur'],
  paidBy: string,
  parts: string[],
  date: string,
): Expense => ({ id: 'e' + ++seq, gid, desc, amount, cur, paidBy, parts, date, settle: false })

export const SEED_EXPENSES: Expense[] = [
  E('g1', 'Transient house (2 nights)', 7200, 'PHP', 'u2', ['u1', 'u2', 'u3', 'u4'], '2026-08-08'),
  E('g1', 'Gas + tolls', 2600, 'PHP', 'u1', ['u1', 'u2', 'u3', 'u4'], '2026-08-08'),
  E('g1', 'Good Shepherd pasalubong', 1150, 'PHP', 'u3', ['u1', 'u3', 'u4'], '2026-08-09'),
  E('g1', 'Dinner at Hill Station', 4380, 'PHP', 'u1', ['u1', 'u2', 'u3', 'u4'], '2026-08-09'),
  E('g1', 'Strawberry picking', 960, 'PHP', 'u4', ['u1', 'u2', 'u3', 'u4'], '2026-08-10'),
  E('g2', 'Meralco bill', 3840, 'PHP', 'u1', ['u1', 'u3', 'u5'], '2026-08-12'),
  E('g2', 'Internet (PLDT)', 1699, 'PHP', 'u3', ['u1', 'u3', 'u5'], '2026-08-05'),
  E('g2', 'Groceries', 2470, 'PHP', 'u5', ['u1', 'u3', 'u5'], '2026-08-16'),
  E('g3', 'Court rental', 1200, 'PHP', 'u4', ['u1', 'u2', 'u4', 'u5'], '2026-08-14'),
  E('g3', 'Shuttlecocks', 24, 'USD', 'u2', ['u1', 'u2', 'u4', 'u5'], '2026-08-14'),
  E('g3', 'Post-game snacks', 680, 'PHP', 'u1', ['u1', 'u2', 'u4', 'u5'], '2026-08-14'),
]
