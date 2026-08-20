package com.kkb.fx

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(
    name = "fx_rate_snapshot",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uq_fx_rate_snapshot",
            columnNames = ["base_currency", "quote_currency", "effective_date", "provider"],
        ),
    ],
)
class FxRateSnapshotEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "base_currency", nullable = false, length = 3)
    var baseCurrency: String,

    @Column(name = "quote_currency", nullable = false, length = 3)
    var quoteCurrency: String,

    @Column(name = "base_units_per_quote_unit", nullable = false, precision = 20, scale = 10)
    var baseUnitsPerQuoteUnit: BigDecimal,

    @Column(name = "effective_date", nullable = false)
    var effectiveDate: LocalDate,

    @Column(nullable = false, length = 80)
    var provider: String,

    @Column(name = "fetched_at", nullable = false, updatable = false)
    var fetchedAt: Instant = Instant.now(),
)
