package com.kkb.fx

import com.kkb.currency.SupportedCurrency
import com.kkb.web.ApiException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestClientResponseException
import java.math.BigDecimal
import java.time.Duration
import java.time.LocalDate

@Component
class FrankfurterExchangeRateClient(
    @Value("\${app.fx.base-url}") baseUrl: String,
    @Value("\${app.fx.timeout}") timeout: Duration,
) : ExchangeRateClient {
    private val restClient = RestClient.builder()
        .baseUrl(baseUrl)
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(timeout)
                setReadTimeout(timeout)
            },
        )
        .build()

    override fun phpPerUnit(currency: SupportedCurrency, date: LocalDate): RemoteExchangeRate {
        if (currency == SupportedCurrency.PHP) {
            return RemoteExchangeRate(date, BigDecimal.ONE)
        }

        val response = try {
            restClient.get()
                .uri { builder ->
                    builder
                        .path("/v2/rate/{base}/PHP")
                        .queryParam("date", date)
                        .build(currency.name)
                }
                .retrieve()
                .body(FrankfurterRateResponse::class.java)
        } catch (exception: RestClientResponseException) {
            if (exception.statusCode.is4xxClientError) {
                throw ApiException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "rate_not_available",
                    "No exact PHP rate is available for ${currency.name} on $date",
                )
            }
            throw ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "rate_provider_unavailable",
                "The exchange-rate provider is temporarily unavailable",
            )
        } catch (_: RestClientException) {
            throw ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "rate_provider_unavailable",
                "The exchange-rate provider is temporarily unavailable",
            )
        } ?: throw ApiException(
            HttpStatus.SERVICE_UNAVAILABLE,
            "empty_rate_response",
            "The exchange-rate provider returned an empty response",
        )

        if (response.date != date || response.base != currency.name || response.quote != SupportedCurrency.PHP.name) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "rate_not_available",
                "No exact PHP rate is available for ${currency.name} on $date",
            )
        }

        if (response.rate <= BigDecimal.ZERO) {
            throw ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "invalid_rate_response",
                "The exchange-rate provider returned an invalid rate",
            )
        }

        return RemoteExchangeRate(response.date, response.rate)
    }
}

private data class FrankfurterRateResponse(
    val date: LocalDate,
    val base: String,
    val quote: String,
    val rate: BigDecimal,
)
