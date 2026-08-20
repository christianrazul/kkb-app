package com.kkb.group

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface GroupMemberRepository : JpaRepository<GroupMemberEntity, UUID> {
    fun existsByGroupIdAndUserId(groupId: UUID, userId: UUID): Boolean
    fun findByGroupIdAndUserId(groupId: UUID, userId: UUID): GroupMemberEntity?
    fun findAllByGroupIdOrderByJoinedAt(groupId: UUID): List<GroupMemberEntity>
    fun findAllByUserIdOrderByJoinedAt(userId: UUID): List<GroupMemberEntity>

    @Query("select member.userId from GroupMemberEntity member where member.groupId = :groupId")
    fun findUserIdsByGroupId(@Param("groupId") groupId: UUID): List<UUID>
}
