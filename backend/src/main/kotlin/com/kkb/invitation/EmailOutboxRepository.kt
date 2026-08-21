package com.kkb.invitation

import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.UUID

interface EmailOutboxRepository : JpaRepository<EmailOutboxEntity, UUID> {
    fun findFirstByGroupInviteIdOrderByCreatedAtDesc(groupInviteId: UUID): EmailOutboxEntity?
    fun findFirstByRecipientEmailOrderByCreatedAtDesc(recipientEmail: String): EmailOutboxEntity?
    fun findAllByGroupInviteIdAndStatus(groupInviteId: UUID, status: String): List<EmailOutboxEntity>

    fun findTop20ByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
        status: String,
        nextAttemptAt: Instant,
    ): List<EmailOutboxEntity>

    fun existsByRecipientEmailAndCreatedAtGreaterThanEqual(recipientEmail: String, createdAt: Instant): Boolean

    fun countByRequestedByUserIdAndCreatedAtGreaterThanEqual(requestedByUserId: UUID, createdAt: Instant): Long
}
