package com.kkb.fx

import com.kkb.auth.AuthenticatedUserResolver
import com.kkb.currency.SupportedCurrency
import com.kkb.web.ApiException
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Clock
import java.time.LocalDate

@RestController
@RequestMapping("/api/fx/rates")
class FxRateController(
    private val authenticatedUserResolver: AuthenticatedUserResolver,
    private val fxRateService: FxRateService,
    private val clock: Clock,
) {
    @GetMapping
    fun list(
        authentication: Authentication?,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        date: LocalDate?,
    ): FxRatesResponse {
        authenticatedUserResolver.resolve(authentication)
        val effectiveDate = date ?: LocalDate.now(clock)
        if (effectiveDate > LocalDate.now(clock)) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "future_rate_date",
                "Exchange rates cannot be requested for a future date",
            )
        }

        return FxRatesResponse(
            effectiveDate = effectiveDate,
            rates = SupportedCurrency.entries.map { currency ->
                val snapshot = fxRateService.resolve(currency, effectiveDate)
                FxRateResponse(
                    currency = currency.name,
                    phpPerUnit = snapshot.baseUnitsPerQuoteUnit.stripTrailingZeros().toPlainString(),
                    provider = snapshot.provider,
                )
            },
        )
    }
}

data class FxRatesResponse(
    val effectiveDate: LocalDate,
    val rates: List<FxRateResponse>,
)

data class FxRateResponse(
    val currency: String,
    val phpPerUnit: String,
    val provider: String,
)
