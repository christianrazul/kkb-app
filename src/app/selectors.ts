import { netOf, pairNet } from '@/domain/balances'
import { conv, fmt, fmtSigned } from '@/domain/currency'
import { dateBits, formatTime, initials } from '@/domain/format'
import type { CurrencyCode, Expense, Group, Member } from '@/domain/types'

export type Tone = 'pos' | 'neg' | 'muted'

function toneOf(net: number, epsilon: number): Tone {
  if (Math.abs(net) < epsilon) return 'muted'
  return net > 0 ? 'pos' : 'neg'
}

/** Signed short balance: "✓" when settled, otherwise "+₱x" / "−₱x". */
function balShort(net: number, epsilon: number, cur: CurrencyCode): string {
  return Math.abs(net) < epsilon ? '✓' : fmtSigned(net, cur)
}

function byId(members: Member[]): (id: string) => Member {
  const map = new Map(members.map((m) => [m.id, m]))
  return (id) => map.get(id)!
}

/** Newest first by expense date/time, with stable fallbacks for untimed records. */
function newestFirst(a: Expense, b: Expense): number {
  const dateOrder = b.date.localeCompare(a.date)
  if (dateOrder) return dateOrder
  if (a.time && !b.time) return -1
  if (!a.time && b.time) return 1
  const timeOrder = (b.time ?? '').localeCompare(a.time ?? '')
  return timeOrder || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
}

function oldestFirst(a: Expense, b: Expense): number {
  const dateOrder = a.date.localeCompare(b.date)
  if (dateOrder) return dateOrder
  if (a.time && !b.time) return -1
  if (!a.time && b.time) return 1
  const timeOrder = (a.time ?? '').localeCompare(b.time ?? '')
  return timeOrder || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
}

export interface SidebarGroupVM {
  id: string
  name: string
  initial: string
  tile: string
  balLine: string
  tone: Tone
}

export function sidebarGroups(
  groups: Group[],
  expenses: Expense[],
  cur: CurrencyCode,
  meId: string,
  epsilon: number,
): SidebarGroupVM[] {
  return groups.map((g) => {
    const net = netOf(meId, expenses.filter((e) => e.gid === g.id), cur)
    const settled = Math.abs(net) < epsilon
    return {
      id: g.id,
      name: g.name,
      initial: g.name[0],
      tile: g.tile,
      balLine: settled ? 'settled up' : fmtSigned(net, cur),
      tone: toneOf(net, epsilon),
    }
  })
}

export interface FriendVM {
  id: string
  name: string
  initials: string
  color: string
  dirLabel: string
  amtFmt: string
  tone: Tone
}

export interface GroupCardVM {
  id: string
  name: string
  initial: string
  tile: string
  meta: string
  balShort: string
  tone: Tone
}

export interface RecentVM {
  id: string
  date: string
  line: string
  amt: string
}

export interface DashboardVM {
  owed: number
  owe: number
  net: number
  friendRows: FriendVM[]
  groupCards: GroupCardVM[]
  recentRows: RecentVM[]
}

export function dashboardView(
  members: Member[],
  groups: Group[],
  expenses: Expense[],
  cur: CurrencyCode,
  meId: string,
  epsilon: number,
): DashboardVM {
  const member = byId(members)

  let owed = 0
  let owe = 0
  const friendRows: FriendVM[] = members
    .filter((m) => m.id !== meId)
    .map((m) => {
      const net = pairNet(meId, m.id, expenses, cur)
      if (net > 0) owed += net
      else owe += -net
      const zero = Math.abs(net) < epsilon
      return {
        id: m.id,
        name: m.full,
        initials: initials(m.full),
        color: m.color,
        dirLabel: zero ? 'settled up' : net > 0 ? 'owes you' : 'you owe',
        amtFmt: zero ? '—' : fmt(Math.abs(net), cur),
        tone: toneOf(net, epsilon),
      }
    })

  const groupCards: GroupCardVM[] = groups.map((g) => {
    const net = netOf(meId, expenses.filter((e) => e.gid === g.id), cur)
    return {
      id: g.id,
      name: g.name,
      initial: g.name[0],
      tile: g.tile,
      meta: g.members.length + ' members',
      balShort: balShort(net, epsilon, cur),
      tone: toneOf(net, epsilon),
    }
  })

  const recentRows: RecentVM[] = [...expenses]
    .sort(newestFirst)
    .slice(0, 5)
    .map((e) => {
      const d = dateBits(e.date)
      const payer = member(e.paidBy).name
      return {
        id: e.id,
        date: d.mon + ' ' + d.day,
        line: e.settle ? `${payer} settled up` : `${payer} paid “${e.desc}”`,
        amt: fmt(e.amount, e.cur),
      }
    })

  return { owed, owe, net: owed - owe, friendRows, groupCards, recentRows }
}

export interface GroupBalanceVM {
  id: string
  name: string
  initials: string
  color: string
  amtFmt: string
  tone: Tone
}

export interface GroupExpenseVM {
  id: string
  mon: string
  day: string
  time?: string
  desc: string
  paidLine: string
  dirLabel: string
  shareFmt: string
  tone: Tone
  manageable: boolean
}

export type ExpenseSort = 'newest' | 'oldest' | 'highest' | 'lowest'

export interface GroupExpenseListOptions {
  sort: ExpenseSort
  currency: CurrencyCode | 'all'
  memberId: string | 'all'
}

export interface GroupVM {
  name: string
  initial: string
  tile: string
  meta: string
  balances: GroupBalanceVM[]
  expenseRows: GroupExpenseVM[]
}

export function groupView(
  group: Group,
  members: Member[],
  expenses: Expense[],
  cur: CurrencyCode,
  meId: string,
  epsilon: number,
  originalCurrency: boolean,
  listOptions: GroupExpenseListOptions = { sort: 'newest', currency: 'all', memberId: 'all' },
): GroupVM {
  const member = byId(members)
  const gExps = expenses.filter((e) => e.gid === group.id).sort(newestFirst)
  const listedExpenses = gExps
    .filter((expense) => listOptions.currency === 'all' || expense.cur === listOptions.currency)
    .filter((expense) => (
      listOptions.memberId === 'all' ||
      expense.paidBy === listOptions.memberId ||
      expense.parts.includes(listOptions.memberId)
    ))
    .sort((a, b) => {
      if (listOptions.sort === 'oldest') return oldestFirst(a, b)
      if (listOptions.sort === 'highest') return b.phpAmount - a.phpAmount || newestFirst(a, b)
      if (listOptions.sort === 'lowest') return a.phpAmount - b.phpAmount || newestFirst(a, b)
      return newestFirst(a, b)
    })

  const balances: GroupBalanceVM[] = group.members.map((id) => {
    const m = member(id)
    const net = netOf(id, gExps, cur)
    return {
      id,
      name: m.name,
      initials: initials(m.full),
      color: m.color,
      amtFmt: balShort(net, epsilon, cur),
      tone: toneOf(net, epsilon),
    }
  })

  const expenseRows: GroupExpenseVM[] = listedExpenses.map((e) => {
    const d = dateBits(e.date)
    const rowCur = originalCurrency ? e.cur : cur
    const total = originalCurrency ? e.amount : conv(e.phpAmount, 'PHP', cur)
    const myShare = e.shares.find((share) => share.userId === meId)
    const payerShare = e.shares.find((share) => share.userId === e.paidBy)
    const share = myShare
      ? originalCurrency
        ? myShare.originalAmount
        : conv(myShare.phpAmount, 'PHP', cur)
      : 0
    const paidShare = payerShare
      ? originalCurrency
        ? payerShare.originalAmount
        : conv(payerShare.phpAmount, 'PHP', cur)
      : 0
    const payer = member(e.paidBy)

    let dirLabel = 'not involved'
    let shareFmt = '—'
    let tone: Tone = 'muted'

    if (e.settle) {
      const toMe = e.parts.includes(meId)
      dirLabel = e.paidBy === meId ? 'you paid' : toMe ? 'you received' : ''
      shareFmt = fmt(total, rowCur)
      tone = e.paidBy === meId ? 'neg' : 'pos'
    } else if (e.paidBy === meId) {
      dirLabel = 'you lent'
      shareFmt = fmt(total - paidShare, rowCur)
      tone = 'pos'
    } else if (e.parts.includes(meId)) {
      dirLabel = 'you borrowed'
      shareFmt = fmt(share, rowCur)
      tone = 'neg'
    }

    const curNote = !originalCurrency && e.cur !== cur ? ` (${fmt(e.amount, e.cur)})` : ''
    return {
      id: e.id,
      mon: d.mon,
      day: d.day,
      time: e.time ? formatTime(e.time, group.timeFormat) : undefined,
      desc: e.settle ? `${payer.name} paid ${member(e.parts[0]).name}` : e.desc,
      paidLine: e.settle
        ? 'settlement'
        : `${payer.name} paid ${fmt(total, rowCur)}${curNote} · split ${e.parts.length} ways`,
      dirLabel,
      shareFmt,
      tone,
      manageable: !e.settle,
    }
  })

  return {
    name: group.name,
    initial: group.name[0],
    tile: group.tile,
    meta: group.members.map((id) => member(id).name).join(', '),
    balances,
    expenseRows,
  }
}

export interface ActivityVM {
  id: string
  initial: string
  tile: string
  line: string
  meta: string
  amt: string
}

export function activityFeed(
  groups: Group[],
  members: Member[],
  expenses: Expense[],
): ActivityVM[] {
  const member = byId(members)
  const group = new Map(groups.map((g) => [g.id, g]))
  return [...expenses].sort(newestFirst).map((e) => {
    const g = group.get(e.gid)!
    const payer = member(e.paidBy).name
    return {
      id: e.id,
      initial: g.name[0],
      tile: g.tile,
      line: e.settle
        ? `${payer} paid ${member(e.parts[0]).name}`
        : `${payer} added “${e.desc}”`,
      meta: `${g.name} · ${e.date}`,
      amt: fmt(e.amount, e.cur),
    }
  })
}
