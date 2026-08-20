import { HttpAuthService } from './http/httpAuthService'
import { HttpExpenseRepository } from './http/httpExpenseRepository'
import type { AuthService, ExpenseRepository } from './types'

/**
 * Composition root. Swap these two lines for HTTP-backed implementations to
 * put the app on a real backend — nothing else in the app references the
 * concrete classes.
 */
export const authService: AuthService = new HttpAuthService()
export const expenseRepository: ExpenseRepository = new HttpExpenseRepository()
