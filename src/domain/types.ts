export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'JPY' | 'SGD'

export interface Member {
  id: string
  /** Short label used in dense UI, e.g. "You", "Miguel". */
  name: string
  /** Full display name, e.g. "Miguel Santos". */
  full: string
  /** Avatar background color. */
  color: string
}

export interface Group {
  id: string
  name: string
  /** Avatar/tile background color. */
  tile: string
  /** Member ids belonging to the group. */
  members: string[]
}

export interface Expense {
  id: string
  gid: string
  desc: string
  amount: number
  cur: CurrencyCode
  paidBy: string
  /** Member ids the cost is split across. */
  parts: string[]
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** True when this record is a settlement payment rather than a shared cost. */
  settle: boolean
}

/** A suggested payment that reduces the number of debts to settle a group. */
export interface Settlement {
  from: string
  to: string
  amt: number
}
