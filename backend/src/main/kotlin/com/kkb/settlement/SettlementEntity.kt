package com.kkb.settlement

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "settlement")
class SettlementEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "group_id", nullable = false)
    var groupId: UUID,

    @Column(name = "from_user_id", nullable = false)
    var fromUserId: UUID,

    @Column(name = "to_user_id", nullable = false)
    var toUserId: UUID,

    @Column(name = "original_amount_minor", nullable = false)
    var originalAmountMinor: Long,

    @Column(name = "original_currency", nullable = false, length = 3)
    var originalCurrency: String,

    @Column(name = "fx_rate_snapshot_id", nullable = false)
    var fxRateSnapshotId: UUID,

    @Column(name = "php_amount_minor", nullable = false)
    var phpAmountMinor: Long,

    @Column(name = "settled_at", nullable = false)
    var settledAt: Instant,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),
)
