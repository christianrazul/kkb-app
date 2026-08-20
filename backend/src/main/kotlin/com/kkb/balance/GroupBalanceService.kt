package com.kkb.balance

import com.kkb.expense.ExpenseEntity
import com.kkb.expense.ExpenseRepository
import com.kkb.expense.ExpenseShareEntity
import com.kkb.expense.ExpenseShareRepository
import com.kkb.group.GroupAccessService
import com.kkb.group.GroupMemberRepository
import com.kkb.settlement.SettlementRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class GroupBalanceService(
    private val groupAccessService: GroupAccessService,
    private val groupMemberRepository: GroupMemberRepository,
    private val expenseRepository: ExpenseRepository,
    private val expenseShareRepository: ExpenseShareRepository,
    private val settlementRepository: SettlementRepository,
) {
    @Transactional(readOnly = true)
    fun calculate(groupId: UUID, actorUserId: UUID): GroupBalanceRecord {
        groupAccessService.requireMembership(groupId, actorUserId)
        val memberIds = groupMemberRepository.findUserIdsByGroupId(groupId).sorted()
        val balances = memberIds.associateWith { 0L }.toMutableMap()
        val expenses = expenseRepository.findAllByGroupIdOrderByExpenseDateDescCreatedAtDesc(groupId)
        val shares = if (expenses.isEmpty()) {
            emptyList()
        } else {
            expenseShareRepository.findAllByExpenseIdIn(expenses.map(ExpenseEntity::id))
        }
        val sharesByExpense = shares.groupBy(ExpenseShareEntity::expenseId)

        expenses.forEach { expense ->
            balances.computeIfPresent(expense.paidByUserId) { _, current -> current + expense.phpAmountMinor }
            sharesByExpense[expense.id].orEmpty().forEach { share ->
                balances.computeIfPresent(share.userId) { _, current -> current - share.phpAmountMinor }
            }
        }

        settlementRepository.findAllByGroupIdOrderBySettledAtDescCreatedAtDesc(groupId).forEach { settlement ->
            balances.computeIfPresent(settlement.fromUserId) { _, current -> current + settlement.phpAmountMinor }
            balances.computeIfPresent(settlement.toUserId) { _, current -> current - settlement.phpAmountMinor }
        }

        return GroupBalanceRecord(
            balances = memberIds.map { userId -> MemberBalance(userId, requireNotNull(balances[userId])) },
            suggestions = simplify(balances),
        )
    }

    private fun simplify(balances: Map<UUID, Long>): List<SettlementSuggestion> {
        val debtors = balances.filterValues { it < 0 }.map { MutableBalance(it.key, it.value) }
            .sortedBy(MutableBalance::amount)
            .toMutableList()
        val creditors = balances.filterValues { it > 0 }.map { MutableBalance(it.key, it.value) }
            .sortedByDescending(MutableBalance::amount)
            .toMutableList()
        val suggestions = mutableListOf<SettlementSuggestion>()
        var debtorIndex = 0
        var creditorIndex = 0

        while (debtorIndex < debtors.size && creditorIndex < creditors.size) {
            val debtor = debtors[debtorIndex]
            val creditor = creditors[creditorIndex]
            val amount = minOf(-debtor.amount, creditor.amount)
            suggestions += SettlementSuggestion(debtor.userId, creditor.userId, amount)
            debtor.amount += amount
            creditor.amount -= amount
            if (debtor.amount == 0L) debtorIndex++
            if (creditor.amount == 0L) creditorIndex++
        }

        return suggestions
    }
}

data class GroupBalanceRecord(
    val balances: List<MemberBalance>,
    val suggestions: List<SettlementSuggestion>,
)

data class MemberBalance(
    val userId: UUID,
    val phpAmountMinor: Long,
)

data class SettlementSuggestion(
    val fromUserId: UUID,
    val toUserId: UUID,
    val phpAmountMinor: Long,
)

private data class MutableBalance(
    val userId: UUID,
    var amount: Long,
)
