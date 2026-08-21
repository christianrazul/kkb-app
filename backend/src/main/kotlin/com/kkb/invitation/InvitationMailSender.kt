package com.kkb.invitation

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpHeaders
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException
import java.time.Duration

interface InvitationMailSender {
    fun send(email: EmailOutboxEntity)
}

@Component
@ConditionalOnProperty(prefix = "app.mail", name = ["enabled"], havingValue = "true")
class ResendInvitationMailSender(
    @Value("\${app.mail.api-base-url}") apiBaseUrl: String,
    @Value("\${app.mail.api-key}") private val apiKey: String,
    @Value("\${app.mail.from}") private val from: String,
    @Value("\${app.mail.timeout}") timeout: Duration,
) : InvitationMailSender {
    private val restClient = RestClient.builder()
        .baseUrl(apiBaseUrl)
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(timeout)
                setReadTimeout(timeout)
            },
        )
        .build()

    override fun send(email: EmailOutboxEntity) {
        try {
            restClient.post()
                .uri("/emails")
                .header(HttpHeaders.AUTHORIZATION, "Bearer $apiKey")
                .header("Idempotency-Key", email.id.toString())
                .body(
                    ResendEmailRequest(
                        from = from,
                        to = listOf(email.recipientEmail),
                        subject = email.subject,
                        html = email.htmlBody,
                        text = email.textBody,
                    ),
                )
                .retrieve()
                .toBodilessEntity()
        } catch (exception: RestClientException) {
            throw IllegalStateException("Resend email delivery failed", exception)
        }
    }
}

private data class ResendEmailRequest(
    val from: String,
    val to: List<String>,
    val subject: String,
    val html: String,
    val text: String,
)
