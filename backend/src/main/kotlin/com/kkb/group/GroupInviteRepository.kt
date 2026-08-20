package com.kkb.group

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface GroupInviteRepository : JpaRepository<GroupInviteEntity, UUID> {
    fun findByGroupIdAndEmail(groupId: UUID, email: String): GroupInviteEntity?
    fun findAllByGroupIdAndStatusOrderByCreatedAt(groupId: UUID, status: String): List<GroupInviteEntity>
    fun findAllByEmailAndStatus(email: String, status: String): List<GroupInviteEntity>
}
