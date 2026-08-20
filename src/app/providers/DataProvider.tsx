import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { expenseRepository } from '@/data'
import type { NewExpenseInput, SettlementInput } from '@/data/types'
import type { Expense, Group, Member } from '@/domain/types'

interface DataState {
  members: Member[]
  groups: Group[]
  expenses: Expense[]
  loaded: boolean
}

type DataAction =
  | { type: 'loaded'; payload: { members: Member[]; groups: Group[]; expenses: Expense[] } }
  | { type: 'expenseAdded'; payload: Expense }

function reducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'loaded':
      return { ...action.payload, loaded: true }
    case 'expenseAdded':
      return { ...state, expenses: [...state.expenses, action.payload] }
  }
}

interface DataContextValue extends DataState {
  memberById: (id: string) => Member | undefined
  groupById: (id: string) => Group | undefined
  addExpense: (input: NewExpenseInput) => Promise<void>
  recordSettlement: (input: SettlementInput) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

const initialState: DataState = { members: [], groups: [], expenses: [], loaded: false }

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let active = true
    Promise.all([
      expenseRepository.listMembers(),
      expenseRepository.listGroups(),
      expenseRepository.listExpenses(),
    ]).then(([members, groups, expenses]) => {
      if (active) dispatch({ type: 'loaded', payload: { members, groups, expenses } })
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<DataContextValue>(
    () => ({
      ...state,
      memberById: (id) => state.members.find((m) => m.id === id),
      groupById: (id) => state.groups.find((g) => g.id === id),
      addExpense: async (input) => {
        const rec = await expenseRepository.addExpense(input)
        dispatch({ type: 'expenseAdded', payload: rec })
      },
      recordSettlement: async (input) => {
        const rec = await expenseRepository.recordSettlement(input)
        dispatch({ type: 'expenseAdded', payload: rec })
      },
    }),
    [state],
  )

  return <DataContext value={value}>{children}</DataContext>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
