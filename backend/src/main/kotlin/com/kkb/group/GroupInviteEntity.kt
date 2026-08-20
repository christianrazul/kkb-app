package com.kkb.group

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "group_invite",
    uniqueConstraints = [UniqueConstraint(name = "uq_group_invite_email", columnNames = ["group_id", "email"])],
)
class GroupInviteEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "group_id", nullable = false)
    var groupId: UUID,

    @Column(nullable = false, length = 320)
    var email: String,

    @Column(name = "invited_by_user_id", nullable = false)
    var invitedByUserId: UUID,

    @Column(nullable = false, length = 16)
    var status: String = GroupInviteStatus.PENDING.name,

    @Column(name = "accepted_by_user_id")
    var acceptedByUserId: UUID? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Column(name = "accepted_at")
    var acceptedAt: Instant? = null,
)

enum class GroupInviteStatus {
    PENDING,
    ACCEPTED,
    REVOKED,
}
