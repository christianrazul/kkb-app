package com.kkb.invitation

import com.kkb.group.GroupInviteEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "email_outbox")
class EmailOutboxEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_invite_id")
    var groupInvite: GroupInviteEntity? = null,

    @Column(name = "requested_by_user_id", nullable = false)
    var requestedByUserId: UUID,

    @Column(name = "recipient_email", nullable = false, length = 320)
    var recipientEmail: String,

    @Column(nullable = false, length = 255)
    var subject: String,

    @Column(name = "text_body", nullable = false, columnDefinition = "TEXT")
    var textBody: String,

    @Column(name = "html_body", nullable = false, columnDefinition = "TEXT")
    var htmlBody: String,

    @Column(nullable = false, length = 16)
    var status: String = EmailDeliveryStatus.QUEUED.name,

    @Column(name = "attempt_count", nullable = false)
    var attemptCount: Int = 0,

    @Column(name = "next_attempt_at", nullable = false)
    var nextAttemptAt: Instant,

    @Column(name = "last_error", length = 500)
    var lastError: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,

    @Column(name = "sent_at")
    var sentAt: Instant? = null,
)

enum class EmailDeliveryStatus {
    QUEUED,
    SENT,
    FAILED,
    CANCELLED,
}
