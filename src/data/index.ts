import { MockAuthService } from './mock/mockAuthService'
import { MockExpenseRepository } from './mock/mockExpenseRepository'
import type { AuthService, ExpenseRepository } from './types'

/**
 * Composition root. Swap these two lines for HTTP-backed implementations to
 * put the app on a real backend — nothing else in the app references the
 * concrete classes.
 */
export const authService: AuthService = new MockAuthService()
export const expenseRepository: ExpenseRepository = new MockExpenseRepository()
