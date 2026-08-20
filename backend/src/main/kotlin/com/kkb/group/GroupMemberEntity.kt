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
    name = "group_member",
    uniqueConstraints = [UniqueConstraint(name = "uq_group_member", columnNames = ["group_id", "user_id"])],
)
class GroupMemberEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "group_id", nullable = false)
    var groupId: UUID,

    @Column(name = "user_id", nullable = false)
    var userId: UUID,

    @Column(name = "joined_at", nullable = false, updatable = false)
    var joinedAt: Instant = Instant.now(),
)
