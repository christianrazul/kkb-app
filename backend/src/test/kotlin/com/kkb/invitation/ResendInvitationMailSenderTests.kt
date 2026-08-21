package com.kkb.invitation

import com.sun.net.httpserver.HttpServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets
import java.time.Duration
import java.time.Instant
import java.util.UUID

class ResendInvitationMailSenderTests {
    private var server: HttpServer? = null

    @AfterEach
    fun stopServer() {
        server?.stop(0)
    }

    @Test
    fun `sends invitation through the Resend API with an idempotency key`() {
        val outboxId = UUID.randomUUID()
        server = HttpServer.create(InetSocketAddress(0), 0).apply {
            createContext("/emails") { exchange ->
                assertEquals("POST", exchange.requestMethod)
                assertEquals("Bearer test-api-key", exchange.requestHeaders.getFirst("Authorization"))
                assertEquals(outboxId.toString(), exchange.requestHeaders.getFirst("Idempotency-Key"))

                val requestBody = exchange.requestBody.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
                assertTrue(requestBody.contains("\"from\":\"KKB <invites@mail.kkb-app.space>\""))
                assertTrue(requestBody.contains("\"to\":[\"friend@example.com\"]"))
                assertTrue(requestBody.contains("\"subject\":\"Join our group\""))
                assertTrue(requestBody.contains("\"html\":\"<p>Invitation</p>\""))
                assertTrue(requestBody.contains("\"text\":\"Invitation\""))

                exchange.sendResponseHeaders(200, -1)
                exchange.close()
            }
            start()
        }

        val sender = ResendInvitationMailSender(
            apiBaseUrl = "http://127.0.0.1:${server!!.address.port}",
            apiKey = "test-api-key",
            from = "KKB <invites@mail.kkb-app.space>",
            timeout = Duration.ofSeconds(2),
        )

        sender.send(
            EmailOutboxEntity(
                id = outboxId,
                requestedByUserId = UUID.randomUUID(),
                recipientEmail = "friend@example.com",
                subject = "Join our group",
                htmlBody = "<p>Invitation</p>",
                textBody = "Invitation",
                status = EmailDeliveryStatus.QUEUED.name,
                attemptCount = 0,
                nextAttemptAt = Instant.parse("2026-08-21T00:00:00Z"),
                createdAt = Instant.parse("2026-08-21T00:00:00Z"),
                updatedAt = Instant.parse("2026-08-21T00:00:00Z"),
            ),
        )
    }
}
