package com.kkb.expense

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExpenseShareRepository : JpaRepository<ExpenseShareEntity, UUID> {
    fun findAllByExpenseIdIn(expenseIds: Collection<UUID>): List<ExpenseShareEntity>
}
