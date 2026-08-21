package com.kkb.invitation

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.math.pow

@Service
@ConditionalOnProperty(prefix = "app.mail", name = ["enabled"], havingValue = "true")
class EmailOutboxDeliveryService(
    private val repository: EmailOutboxRepository,
    private val mailSender: InvitationMailSender,
    private val clock: Clock,
    @Value("\${app.mail.max-attempts:5}") private val maxAttempts: Int,
) {
    @Transactional
    fun deliver(outboxId: UUID) {
        val email = repository.findById(outboxId).orElse(null) ?: return
        if (email.status != EmailDeliveryStatus.QUEUED.name || email.nextAttemptAt.isAfter(Instant.now(clock))) return

        val now = Instant.now(clock)
        try {
            mailSender.send(email)
            email.status = EmailDeliveryStatus.SENT.name
            email.sentAt = now
            email.lastError = null
        } catch (exception: Exception) {
            email.attemptCount += 1
            email.lastError = (exception.message ?: exception.javaClass.simpleName).take(500)
            if (email.attemptCount >= maxAttempts) {
                email.status = EmailDeliveryStatus.FAILED.name
            } else {
                email.nextAttemptAt = now.plus(retryDelay(email.attemptCount))
            }
        }
        email.updatedAt = now
        repository.save(email)
    }

    private fun retryDelay(attempt: Int): Duration =
        Duration.ofMinutes(2.0.pow((attempt - 1).coerceAtLeast(0)).toLong())
}

@Component
@ConditionalOnProperty(prefix = "app.mail", name = ["enabled"], havingValue = "true")
class EmailOutboxScheduler(
    private val repository: EmailOutboxRepository,
    private val deliveryService: EmailOutboxDeliveryService,
    private val clock: Clock,
) {
    @Scheduled(fixedDelayString = "\${app.mail.poll-delay-ms:30000}")
    fun deliverQueuedEmails() {
        repository.findTop20ByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            EmailDeliveryStatus.QUEUED.name,
            Instant.now(clock),
        ).forEach { email -> deliveryService.deliver(email.id) }
    }
}
