package com.kkb.group

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "expense_group")
class ExpenseGroupEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(nullable = false, length = 120)
    var name: String,

    @Column(name = "tile_color", nullable = false, length = 32)
    var tileColor: String,

    @Column(name = "created_by_user_id", nullable = false)
    var createdByUserId: UUID,

    @Column(name = "time_format", nullable = false, length = 24)
    var timeFormat: String = GroupTimeFormat.TWELVE_HOUR.name,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)

enum class GroupTimeFormat {
    TWELVE_HOUR,
    TWENTY_FOUR_HOUR;

    companion object {
        fun parse(value: String?): GroupTimeFormat = entries.firstOrNull { it.name == value }
            ?: TWELVE_HOUR
    }
}
