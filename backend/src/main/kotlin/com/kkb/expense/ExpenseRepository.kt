package com.kkb.expense

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExpenseRepository : JpaRepository<ExpenseEntity, UUID> {
    fun findAllByGroupIdOrderByExpenseDateDescCreatedAtDesc(groupId: UUID): List<ExpenseEntity>
}
