package com.kkb.fx

import com.kkb.currency.SupportedCurrency
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.LocalDate

@Component
class FxRatePrefetchScheduler(
    private val fxRateService: FxRateService,
    private val clock: Clock,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Scheduled(cron = "\${app.fx.prefetch-cron}", zone = "\${app.time-zone}")
    fun prefetchPreviousDay() {
        val effectiveDate = LocalDate.now(clock).minusDays(1)

        SupportedCurrency.entries.forEach { currency ->
            runCatching { fxRateService.resolve(currency, effectiveDate) }
                .onFailure { error ->
                    logger.warn("Could not prefetch {} rate for {}", currency, effectiveDate, error)
                }
        }
    }
}
