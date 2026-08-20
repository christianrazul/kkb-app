package com.kkb.fx

import com.kkb.currency.SupportedCurrency
import com.sun.net.httpserver.HttpServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets
import java.time.Duration
import java.time.LocalDate

class FrankfurterExchangeRateClientTests {
    private var server: HttpServer? = null

    @AfterEach
    fun stopServer() {
        server?.stop(0)
    }

    @Test
    fun `reads an exact historical PHP rate from the v2 response`() {
        val requestedDate = LocalDate.of(2025, 3, 9)
        server = HttpServer.create(InetSocketAddress(0), 0).apply {
            createContext("/v2/rate/USD/PHP") { exchange ->
                assertEquals("date=2025-03-09", exchange.requestURI.query)
                val body = """{"date":"2025-03-09","base":"USD","quote":"PHP","rate":57.249}"""
                    .toByteArray(StandardCharsets.UTF_8)
                exchange.responseHeaders.add("Content-Type", "application/json")
                exchange.sendResponseHeaders(200, body.size.toLong())
                exchange.responseBody.use { response -> response.write(body) }
            }
            start()
        }

        val client = FrankfurterExchangeRateClient(
            baseUrl = "http://127.0.0.1:${server!!.address.port}",
            timeout = Duration.ofSeconds(2),
        )

        val result = client.phpPerUnit(SupportedCurrency.USD, requestedDate)

        assertEquals(requestedDate, result.date)
        assertEquals(BigDecimal("57.249"), result.rate)
    }
}
