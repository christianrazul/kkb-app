package com.kkb.fx

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface FxRateSnapshotRepository : JpaRepository<FxRateSnapshotEntity, UUID> {
    fun findByBaseCurrencyAndQuoteCurrencyAndEffectiveDateAndProvider(
        baseCurrency: String,
        quoteCurrency: String,
        effectiveDate: LocalDate,
        provider: String,
    ): FxRateSnapshotEntity?
}
