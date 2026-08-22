package com.kkb.expense

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ExpenseRepository : JpaRepository<ExpenseEntity, UUID> {
    @Query(
        """
        SELECT expense FROM ExpenseEntity expense
        WHERE expense.groupId = :groupId
        ORDER BY expense.expenseDate DESC,
            CASE WHEN expense.expenseTime IS NULL THEN 1 ELSE 0 END,
            expense.expenseTime DESC,
            expense.createdAt DESC
        """,
    )
    fun findAllByGroupIdOrderByExpenseDateDescCreatedAtDesc(@Param("groupId") groupId: UUID): List<ExpenseEntity>
}
