package com.kkb.invitation

import com.kkb.group.GroupInviteEntity
import com.kkb.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Service
class EmailOutboxService(
    private val repository: EmailOutboxRepository,
    private val clock: Clock,
) {
    fun queue(
        requestedByUserId: UUID,
        recipientEmail: String,
        content: InvitationEmailContent,
        groupInvite: GroupInviteEntity? = null,
    ): EmailOutboxEntity {
        val now = Instant.now(clock)
        if (repository.existsByRecipientEmailAndCreatedAtGreaterThanEqual(recipientEmail, now.minus(RECIPIENT_COOLDOWN))) {
            throw ApiException(
                HttpStatus.TOO_MANY_REQUESTS,
                "invitation_recently_sent",
                "An invitation was recently sent to this email. Try again in a few minutes.",
            )
        }
        if (repository.countByRequestedByUserIdAndCreatedAtGreaterThanEqual(requestedByUserId, now.minus(SENDER_WINDOW)) >= SENDER_DAILY_LIMIT) {
            throw ApiException(
                HttpStatus.TOO_MANY_REQUESTS,
                "invitation_daily_limit",
                "You have reached the daily invitation limit.",
            )
        }

        return repository.save(
            EmailOutboxEntity(
                groupInvite = groupInvite,
                requestedByUserId = requestedByUserId,
                recipientEmail = recipientEmail,
                subject = content.subject,
                textBody = content.textBody,
                htmlBody = content.htmlBody,
                nextAttemptAt = now,
                createdAt = now,
                updatedAt = now,
            ),
        )
    }

    fun latestStatus(groupInviteId: UUID): EmailDeliveryStatus? =
        repository.findFirstByGroupInviteIdOrderByCreatedAtDesc(groupInviteId)
            ?.status
            ?.let(EmailDeliveryStatus::valueOf)

    fun cancelQueued(groupInviteId: UUID) {
        val now = Instant.now(clock)
        repository.findAllByGroupInviteIdAndStatus(groupInviteId, EmailDeliveryStatus.QUEUED.name)
            .forEach { email ->
                email.status = EmailDeliveryStatus.CANCELLED.name
                email.updatedAt = now
                repository.save(email)
            }
    }

    private companion object {
        val RECIPIENT_COOLDOWN: Duration = Duration.ofMinutes(5)
        val SENDER_WINDOW: Duration = Duration.ofHours(24)
        const val SENDER_DAILY_LIMIT = 50L
    }
}
