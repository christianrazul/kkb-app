package com.kkb.invitation

import jakarta.mail.internet.InternetAddress
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Component

interface InvitationMailSender {
    fun send(email: EmailOutboxEntity)
}

@Component
@ConditionalOnProperty(prefix = "app.mail", name = ["enabled"], havingValue = "true")
class SmtpInvitationMailSender(
    private val mailSender: JavaMailSender,
    @Value("\${app.mail.from}") private val from: String,
) : InvitationMailSender {
    override fun send(email: EmailOutboxEntity) {
        val message = mailSender.createMimeMessage()
        MimeMessageHelper(message, true, Charsets.UTF_8.name()).apply {
            setFrom(InternetAddress(from))
            setTo(email.recipientEmail)
            setSubject(email.subject)
            setText(email.textBody, email.htmlBody)
        }
        message.setHeader("Resend-Idempotency-Key", email.id.toString())
        mailSender.send(message)
    }
}
