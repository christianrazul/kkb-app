package com.kkb.fx

import com.kkb.currency.SupportedCurrency
import java.math.BigDecimal
import java.time.LocalDate

interface ExchangeRateClient {
    fun phpPerUnit(currency: SupportedCurrency, date: LocalDate): RemoteExchangeRate
}

data class RemoteExchangeRate(
    val date: LocalDate,
    val rate: BigDecimal,
)
