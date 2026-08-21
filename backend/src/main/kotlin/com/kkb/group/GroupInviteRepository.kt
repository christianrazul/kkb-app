package com.kkb.group

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface GroupInviteRepository : JpaRepository<GroupInviteEntity, UUID> {
    fun findByGroupIdAndEmail(groupId: UUID, email: String): GroupInviteEntity?
    fun findByToken(token: String): GroupInviteEntity?
    fun findAllByGroupIdAndStatusOrderByCreatedAt(groupId: UUID, status: String): List<GroupInviteEntity>
}
