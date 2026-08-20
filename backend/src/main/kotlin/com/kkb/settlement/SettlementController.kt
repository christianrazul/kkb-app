package com.kkb.settlement

import com.kkb.auth.AuthenticatedUserResolver
import com.kkb.currency.SupportedCurrency
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.PastOrPresent
import jakarta.validation.constraints.Pattern
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/groups/{groupId}/settlements")
class SettlementController(
    private val authenticatedUserResolver: AuthenticatedUserResolver,
    private val settlementApplicationService: SettlementApplicationService,
) {
    @GetMapping
    fun list(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
    ): List<SettlementResponse> {
        val actor = authenticatedUserResolver.resolve(authentication)
        return settlementApplicationService.list(groupId, actor.id).map(SettlementRecord::toResponse)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
        @Valid @RequestBody request: CreateSettlementRequest,
    ): SettlementResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return settlementApplicationService.create(groupId, actor.id, request.toCommand()).toResponse()
    }
}

data class CreateSettlementRequest(
    val fromUserId: UUID,
    val toUserId: UUID,

    @field:NotBlank
    @field:Pattern(regexp = "^(?:0|[1-9]\\d{0,14})(?:\\.\\d{1,2})?$")
    val amount: String,

    @field:Pattern(regexp = "^[A-Z]{3}$")
    val currency: String,

    @field:PastOrPresent
    val settlementDate: LocalDate,
) {
    fun toCommand() = CreateSettlementCommand(
        fromUserId = fromUserId,
        toUserId = toUserId,
        amount = amount,
        currency = currency,
        settlementDate = settlementDate,
    )
}

data class SettlementResponse(
    val id: UUID,
    val groupId: UUID,
    val fromUserId: UUID,
    val toUserId: UUID,
    val originalAmount: String,
    val originalCurrency: String,
    val phpAmount: String,
    val settlementDate: LocalDate,
    val createdAt: Instant,
    val lockedRate: SettlementLockedRateResponse,
)

data class SettlementLockedRateResponse(
    val phpPerUnit: String,
    val effectiveDate: LocalDate,
    val provider: String,
)

private fun SettlementRecord.toResponse(): SettlementResponse {
    val currency = SupportedCurrency.parse(settlement.originalCurrency)
    return SettlementResponse(
        id = settlement.id,
        groupId = settlement.groupId,
        fromUserId = settlement.fromUserId,
        toUserId = settlement.toUserId,
        originalAmount = currency.formatMinorUnits(settlement.originalAmountMinor),
        originalCurrency = currency.name,
        phpAmount = SupportedCurrency.PHP.formatMinorUnits(settlement.phpAmountMinor),
        settlementDate = snapshot.effectiveDate,
        createdAt = settlement.createdAt,
        lockedRate = SettlementLockedRateResponse(
            phpPerUnit = snapshot.baseUnitsPerQuoteUnit.stripTrailingZeros().toPlainString(),
            effectiveDate = snapshot.effectiveDate,
            provider = snapshot.provider,
        ),
    )
}
