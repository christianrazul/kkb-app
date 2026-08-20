import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { expenseRepository } from '@/data'
import type { NewExpenseInput, SettlementInput } from '@/data/types'
import type { Expense, Group, Member } from '@/domain/types'
import { useAuth } from './AuthProvider'

interface DataState {
  members: Member[]
  groups: Group[]
  expenses: Expense[]
  loaded: boolean
  error: string | null
}

type DataAction =
  | { type: 'loaded'; payload: { members: Member[]; groups: Group[]; expenses: Expense[] } }
  | { type: 'expenseAdded'; payload: Expense }
  | { type: 'reset' }
  | { type: 'failed'; payload: string }

function reducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'loaded':
      return { ...action.payload, loaded: true, error: null }
    case 'expenseAdded':
      return { ...state, expenses: [...state.expenses, action.payload] }
    case 'reset':
      return initialState
    case 'failed':
      return { ...state, loaded: true, error: action.payload }
  }
}

interface DataContextValue extends DataState {
  memberById: (id: string) => Member | undefined
  groupById: (id: string) => Group | undefined
  addExpense: (input: NewExpenseInput) => Promise<void>
  recordSettlement: (input: SettlementInput) => Promise<void>
  createGroup: (name: string, tileColor: string) => Promise<void>
  inviteMember: (groupId: string, email: string) => Promise<void>
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

const initialState: DataState = { members: [], groups: [], expenses: [], loaded: false, error: null }

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user } = useAuth()

  const load = useCallback(async () => {
    try {
      dispatch({ type: 'loaded', payload: await expenseRepository.load() })
    } catch (error) {
      dispatch({ type: 'failed', payload: error instanceof Error ? error.message : 'Could not load your data' })
    }
  }, [])

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'reset' })
      return
    }
    let active = true
    expenseRepository.load()
      .then((payload) => {
        if (active) dispatch({ type: 'loaded', payload })
      })
      .catch((error) => {
        if (active) dispatch({ type: 'failed', payload: error instanceof Error ? error.message : 'Could not load your data' })
      })
    return () => {
      active = false
    }
  }, [user, load])

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
      createGroup: async (name, tileColor) => {
        await expenseRepository.createGroup(name, tileColor)
        await load()
      },
      inviteMember: async (groupId, email) => {
        await expenseRepository.inviteMember(groupId, email)
        await load()
      },
      refresh: load,
    }),
    [state, load],
  )

  return <DataContext value={value}>{children}</DataContext>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
