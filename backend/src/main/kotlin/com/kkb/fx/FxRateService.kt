package com.kkb.fx

import com.kkb.currency.SupportedCurrency
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Clock
import java.time.Instant
import java.time.LocalDate

@Service
class FxRateService(
    private val exchangeRateClient: ExchangeRateClient,
    private val repository: FxRateSnapshotRepository,
    private val writer: FxRateSnapshotWriter,
    private val clock: Clock,
) {
    fun resolve(currency: SupportedCurrency, date: LocalDate): FxRateSnapshotEntity {
        val provider = providerFor(currency)
        repository.findSnapshot(currency, date, provider)?.let { return it }

        val remoteRate = exchangeRateClient.phpPerUnit(currency, date)
        val snapshot = FxRateSnapshotEntity(
            baseCurrency = SupportedCurrency.PHP.name,
            quoteCurrency = currency.name,
            baseUnitsPerQuoteUnit = remoteRate.rate.setScale(RATE_SCALE, RoundingMode.HALF_UP),
            effectiveDate = remoteRate.date,
            provider = provider,
            fetchedAt = Instant.now(clock),
        )

        return try {
            writer.insert(snapshot)
        } catch (_: DataIntegrityViolationException) {
            requireNotNull(repository.findSnapshot(currency, date, provider)) {
                "A concurrent rate insert failed without creating a snapshot"
            }
        }
    }

    fun phpAmountMinor(
        originalAmountMinor: Long,
        currency: SupportedCurrency,
        snapshot: FxRateSnapshotEntity,
    ): Long {
        val phpMajor = currency.majorUnits(originalAmountMinor)
            .multiply(snapshot.baseUnitsPerQuoteUnit)
            .setScale(SupportedCurrency.PHP.fractionDigits, RoundingMode.HALF_UP)

        return phpMajor.movePointRight(SupportedCurrency.PHP.fractionDigits).longValueExact()
    }

    private fun FxRateSnapshotRepository.findSnapshot(
        currency: SupportedCurrency,
        date: LocalDate,
        provider: String,
    ) = findByBaseCurrencyAndQuoteCurrencyAndEffectiveDateAndProvider(
        baseCurrency = SupportedCurrency.PHP.name,
        quoteCurrency = currency.name,
        effectiveDate = date,
        provider = provider,
    )

    private fun providerFor(currency: SupportedCurrency): String =
        if (currency == SupportedCurrency.PHP) INTERNAL_PROVIDER else FRANKFURTER_PROVIDER

    companion object {
        const val FRANKFURTER_PROVIDER = "FRANKFURTER_V2_BLENDED"
        const val INTERNAL_PROVIDER = "INTERNAL"
        private const val RATE_SCALE = 10
    }
}
