package com.kkb.balance

import com.kkb.auth.AuthenticatedUserResolver
import com.kkb.currency.SupportedCurrency
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/groups/{groupId}/balances")
class GroupBalanceController(
    private val authenticatedUserResolver: AuthenticatedUserResolver,
    private val groupBalanceService: GroupBalanceService,
) {
    @GetMapping
    fun calculate(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
    ): GroupBalanceResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        val record = groupBalanceService.calculate(groupId, actor.id)
        return GroupBalanceResponse(
            currency = SupportedCurrency.PHP.name,
            balances = record.balances.map { balance ->
                MemberBalanceResponse(
                    userId = balance.userId,
                    amount = SupportedCurrency.PHP.formatMinorUnits(balance.phpAmountMinor),
                )
            },
            suggestions = record.suggestions.map { suggestion ->
                SettlementSuggestionResponse(
                    fromUserId = suggestion.fromUserId,
                    toUserId = suggestion.toUserId,
                    amount = SupportedCurrency.PHP.formatMinorUnits(suggestion.phpAmountMinor),
                )
            },
        )
    }
}

data class GroupBalanceResponse(
    val currency: String,
    val balances: List<MemberBalanceResponse>,
    val suggestions: List<SettlementSuggestionResponse>,
)

data class MemberBalanceResponse(
    val userId: UUID,
    val amount: String,
)

data class SettlementSuggestionResponse(
    val fromUserId: UUID,
    val toUserId: UUID,
    val amount: String,
)
