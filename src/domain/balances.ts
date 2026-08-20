import { conv, eps } from './currency'
import type { CurrencyCode, Expense, Group, Settlement } from './types'

/**
 * Net position of one member across a set of expenses, in the display currency.
 * Positive = they are owed money; negative = they owe.
 */
export function netOf(memberId: string, exps: Expense[], cur: CurrencyCode): number {
  let net = 0
  for (const e of exps) {
    const total = conv(e.amount, e.cur, cur)
    const share = total / e.parts.length
    if (e.paidBy === memberId) {
      net += total - (e.parts.includes(memberId) ? share : 0)
    } else if (e.parts.includes(memberId)) {
      net -= share
    }
  }
  return net
}

/**
 * Net between the current user and one other member across all their shared
 * expenses. Positive = the other member owes the current user.
 */
export function pairNet(
  meId: string,
  otherId: string,
  exps: Expense[],
  cur: CurrencyCode,
): number {
  let net = 0
  for (const e of exps) {
    const share = conv(e.amount, e.cur, cur) / e.parts.length
    if (e.paidBy === meId && e.parts.includes(otherId)) net += share
    if (e.paidBy === otherId && e.parts.includes(meId)) net -= share
  }
  return net
}

/**
 * Greedy debt simplification: match the largest debtor against the largest
 * creditor until everyone nets to (near) zero, minimizing the payment count.
 */
export function settleSuggestions(
  group: Group,
  allExpenses: Expense[],
  cur: CurrencyCode,
): Settlement[] {
  const exps = allExpenses.filter((e) => e.gid === group.id)
  const e = eps(cur)
  const nets = group.members.map((id) => ({ id, net: netOf(id, exps, cur) }))
  const debtors = nets.filter((x) => x.net < -e).sort((a, b) => a.net - b.net)
  const creditors = nets.filter((x) => x.net > e).sort((a, b) => b.net - a.net)

  const out: Settlement[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(-debtors[i].net, creditors[j].net)
    out.push({ from: debtors[i].id, to: creditors[j].id, amt })
    debtors[i].net += amt
    creditors[j].net -= amt
    if (debtors[i].net > -e) i++
    if (creditors[j].net < e) j++
  }
  return out
}
