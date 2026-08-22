package com.kkb.expense

import com.kkb.auth.AuthenticatedUserResolver
import com.kkb.currency.SupportedCurrency
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.PastOrPresent
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
class ExpenseController(
    private val authenticatedUserResolver: AuthenticatedUserResolver,
    private val expenseApplicationService: ExpenseApplicationService,
) {
    @GetMapping
    fun list(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
    ): List<ExpenseResponse> {
        val actor = authenticatedUserResolver.resolve(authentication)
        return expenseApplicationService.list(groupId, actor.id).map(ExpenseRecord::toResponse)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
        @Valid @RequestBody request: CreateExpenseRequest,
    ): ExpenseResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return expenseApplicationService.create(groupId, actor.id, request.toCommand()).toResponse()
    }

    @PutMapping("/{expenseId}")
    fun update(
        @PathVariable groupId: UUID,
        @PathVariable expenseId: UUID,
        authentication: Authentication?,
        @Valid @RequestBody request: CreateExpenseRequest,
    ): ExpenseResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return expenseApplicationService.update(groupId, expenseId, actor.id, request.toCommand()).toResponse()
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable groupId: UUID,
        @PathVariable expenseId: UUID,
        authentication: Authentication?,
    ) {
        val actor = authenticatedUserResolver.resolve(authentication)
        expenseApplicationService.delete(groupId, expenseId, actor.id)
    }
}

data class CreateExpenseRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val description: String,

    @field:NotBlank
    @field:Pattern(
        regexp = "^(?:0|[1-9]\\d{0,14})(?:\\.\\d{1,2})?$",
        message = "must be a positive decimal with no more than two decimal places",
    )
    val amount: String,

    @field:Pattern(regexp = "^[A-Z]{3}$")
    val currency: String,

    val paidByUserId: UUID,

    @field:Size(min = 1)
    val participantIds: List<UUID>,

    @field:PastOrPresent
    val expenseDate: LocalDate,
) {
    fun toCommand() = CreateExpenseCommand(
        description = description,
        amount = amount,
        currency = currency,
        paidByUserId = paidByUserId,
        participantIds = participantIds,
        expenseDate = expenseDate,
    )
}

data class ExpenseResponse(
    val id: UUID,
    val groupId: UUID,
    val description: String,
    val originalAmount: String,
    val originalCurrency: String,
    val phpAmount: String,
    val paidByUserId: UUID,
    val expenseDate: LocalDate,
    val createdAt: Instant,
    val shares: List<ExpenseShareResponse>,
    val lockedRate: LockedRateResponse,
)

data class ExpenseShareResponse(
    val userId: UUID,
    val originalAmount: String,
    val phpAmount: String,
)

data class LockedRateResponse(
    val phpPerUnit: String,
    val effectiveDate: LocalDate,
    val provider: String,
)

private fun ExpenseRecord.toResponse(): ExpenseResponse {
    val currency = SupportedCurrency.parse(expense.originalCurrency)
    return ExpenseResponse(
        id = expense.id,
        groupId = expense.groupId,
        description = expense.description,
        originalAmount = currency.formatMinorUnits(expense.originalAmountMinor),
        originalCurrency = currency.name,
        phpAmount = SupportedCurrency.PHP.formatMinorUnits(expense.phpAmountMinor),
        paidByUserId = expense.paidByUserId,
        expenseDate = expense.expenseDate,
        createdAt = expense.createdAt,
        shares = shares.map { share ->
            ExpenseShareResponse(
                userId = share.userId,
                originalAmount = currency.formatMinorUnits(share.originalAmountMinor),
                phpAmount = SupportedCurrency.PHP.formatMinorUnits(share.phpAmountMinor),
            )
        },
        lockedRate = LockedRateResponse(
            phpPerUnit = snapshot.baseUnitsPerQuoteUnit.stripTrailingZeros().toPlainString(),
            effectiveDate = snapshot.effectiveDate,
            provider = snapshot.provider,
        ),
    )
}
