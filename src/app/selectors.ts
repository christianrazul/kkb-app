import { netOf, pairNet } from '@/domain/balances'
import { conv, fmt, fmtSigned } from '@/domain/currency'
import { dateBits, initials } from '@/domain/format'
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

/** Newest first, matching the mockup's date-then-id tiebreak. */
function newestFirst(a: Expense, b: Expense): number {
  return b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
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
  desc: string
  paidLine: string
  dirLabel: string
  shareFmt: string
  tone: Tone
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
): GroupVM {
  const member = byId(members)
  const gExps = expenses.filter((e) => e.gid === group.id).sort(newestFirst)

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

  const expenseRows: GroupExpenseVM[] = gExps.map((e) => {
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
      desc: e.settle ? `${payer.name} paid ${member(e.parts[0]).name}` : e.desc,
      paidLine: e.settle
        ? 'settlement'
        : `${payer.name} paid ${fmt(total, rowCur)}${curNote} · split ${e.parts.length} ways`,
      dirLabel,
      shareFmt,
      tone,
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
