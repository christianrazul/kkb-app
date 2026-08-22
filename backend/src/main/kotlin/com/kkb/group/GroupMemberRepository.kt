package com.kkb.group

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface GroupMemberRepository : JpaRepository<GroupMemberEntity, UUID> {
    fun existsByGroupIdAndUserIdAndRemovedAtIsNull(groupId: UUID, userId: UUID): Boolean
    fun findByGroupIdAndUserId(groupId: UUID, userId: UUID): GroupMemberEntity?
    fun findByGroupIdAndUserIdAndRemovedAtIsNull(groupId: UUID, userId: UUID): GroupMemberEntity?
    fun findAllByGroupIdOrderByJoinedAt(groupId: UUID): List<GroupMemberEntity>
    fun findAllByUserIdAndRemovedAtIsNullOrderByJoinedAt(userId: UUID): List<GroupMemberEntity>

    @Query("select member.userId from GroupMemberEntity member where member.groupId = :groupId and member.removedAt is null")
    fun findActiveUserIdsByGroupId(@Param("groupId") groupId: UUID): List<UUID>
}
