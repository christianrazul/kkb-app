package com.kkb.expense

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.util.UUID

@Entity
@Table(
    name = "expense_share",
    uniqueConstraints = [UniqueConstraint(name = "uq_expense_share", columnNames = ["expense_id", "user_id"])],
)
class ExpenseShareEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "expense_id", nullable = false)
    var expenseId: UUID,

    @Column(name = "user_id", nullable = false)
    var userId: UUID,

    @Column(name = "original_amount_minor", nullable = false)
    var originalAmountMinor: Long,

    @Column(name = "php_amount_minor", nullable = false)
    var phpAmountMinor: Long,
)
