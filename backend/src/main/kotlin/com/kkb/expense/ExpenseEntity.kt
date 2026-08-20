package com.kkb.expense

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "expense")
class ExpenseEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "group_id", nullable = false)
    var groupId: UUID,

    @Column(nullable = false, length = 255)
    var description: String,

    @Column(name = "original_amount_minor", nullable = false)
    var originalAmountMinor: Long,

    @Column(name = "original_currency", nullable = false, length = 3)
    var originalCurrency: String,

    @Column(name = "fx_rate_snapshot_id", nullable = false)
    var fxRateSnapshotId: UUID,

    @Column(name = "php_amount_minor", nullable = false)
    var phpAmountMinor: Long,

    @Column(name = "paid_by_user_id", nullable = false)
    var paidByUserId: UUID,

    @Column(name = "expense_date", nullable = false)
    var expenseDate: LocalDate,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),
)
