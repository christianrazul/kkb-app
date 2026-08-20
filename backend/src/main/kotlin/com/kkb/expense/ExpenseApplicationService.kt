package com.kkb.expense

import com.kkb.currency.SupportedCurrency
import com.kkb.fx.FxRateService
import com.kkb.fx.FxRateSnapshotEntity
import com.kkb.fx.FxRateSnapshotRepository
import com.kkb.group.GroupAccessService
import com.kkb.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
class ExpenseApplicationService(
    private val groupAccessService: GroupAccessService,
    private val fxRateService: FxRateService,
    private val transactionWriter: ExpenseTransactionWriter,
    private val expenseRepository: ExpenseRepository,
    private val expenseShareRepository: ExpenseShareRepository,
    private val fxRateSnapshotRepository: FxRateSnapshotRepository,
    private val clock: Clock,
) {
    fun create(groupId: UUID, actorUserId: UUID, command: CreateExpenseCommand): ExpenseRecord {
        groupAccessService.requireMembership(groupId, actorUserId)

        val description = command.description.trim()
        if (description.isEmpty() || description.length > 255) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "invalid_description",
                "Description must contain between 1 and 255 characters",
            )
        }

        if (command.expenseDate > LocalDate.now(clock)) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "future_expense_date",
                "Expense date cannot be in the future",
            )
        }

        if (command.participantIds.isEmpty()) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "participants_required",
                "At least one participant is required",
            )
        }

        if (command.participantIds.distinct().size != command.participantIds.size) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "duplicate_participants",
                "Participant IDs must be unique",
            )
        }

        groupAccessService.requireExpenseMembers(groupId, command.paidByUserId, command.participantIds)
        val currency = SupportedCurrency.parse(command.currency)
        val originalAmountMinor = currency.toMinorUnits(command.amount)
        val snapshot = fxRateService.resolve(currency, command.expenseDate)
        val phpAmountMinor = try {
            fxRateService.phpAmountMinor(originalAmountMinor, currency, snapshot)
        } catch (_: ArithmeticException) {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "amount_too_large", "Converted amount is too large")
        }

        return transactionWriter.persist(
            groupId = groupId,
            actorUserId = actorUserId,
            description = description,
            originalAmountMinor = originalAmountMinor,
            currency = currency,
            phpAmountMinor = phpAmountMinor,
            snapshot = snapshot,
            paidByUserId = command.paidByUserId,
            participantIds = command.participantIds,
            expenseDate = command.expenseDate,
        )
    }

    @Transactional(readOnly = true)
    fun list(groupId: UUID, actorUserId: UUID): List<ExpenseRecord> {
        groupAccessService.requireMembership(groupId, actorUserId)
        val expenses = expenseRepository.findAllByGroupIdOrderByExpenseDateDescCreatedAtDesc(groupId)
        if (expenses.isEmpty()) return emptyList()

        val expenseIds = expenses.map(ExpenseEntity::id)
        val sharesByExpense = expenseShareRepository.findAllByExpenseIdIn(expenseIds)
            .groupBy(ExpenseShareEntity::expenseId)
        val snapshotsById = fxRateSnapshotRepository.findAllById(expenses.map(ExpenseEntity::fxRateSnapshotId).toSet())
            .associateBy(FxRateSnapshotEntity::id)

        return expenses.map { expense ->
            ExpenseRecord(
                expense = expense,
                shares = sharesByExpense[expense.id].orEmpty().sortedBy(ExpenseShareEntity::userId),
                snapshot = requireNotNull(snapshotsById[expense.fxRateSnapshotId]),
            )
        }
    }
}

data class CreateExpenseCommand(
    val description: String,
    val amount: String,
    val currency: String,
    val paidByUserId: UUID,
    val participantIds: List<UUID>,
    val expenseDate: LocalDate,
)

data class ExpenseRecord(
    val expense: ExpenseEntity,
    val shares: List<ExpenseShareEntity>,
    val snapshot: FxRateSnapshotEntity,
)

@Service
class ExpenseTransactionWriter(
    private val groupAccessService: GroupAccessService,
    private val expenseRepository: ExpenseRepository,
    private val expenseShareRepository: ExpenseShareRepository,
    private val clock: Clock,
) {
    @Transactional
    fun persist(
        groupId: UUID,
        actorUserId: UUID,
        description: String,
        originalAmountMinor: Long,
        currency: SupportedCurrency,
        phpAmountMinor: Long,
        snapshot: FxRateSnapshotEntity,
        paidByUserId: UUID,
        participantIds: List<UUID>,
        expenseDate: LocalDate,
    ): ExpenseRecord {
        groupAccessService.requireMembership(groupId, actorUserId)
        groupAccessService.requireExpenseMembers(groupId, paidByUserId, participantIds)

        val expense = expenseRepository.save(
            ExpenseEntity(
                groupId = groupId,
                description = description,
                originalAmountMinor = originalAmountMinor,
                originalCurrency = currency.name,
                fxRateSnapshotId = snapshot.id,
                phpAmountMinor = phpAmountMinor,
                paidByUserId = paidByUserId,
                expenseDate = expenseDate,
                createdAt = Instant.now(clock),
            ),
        )

        val originalShares = splitEvenly(originalAmountMinor, participantIds)
        val phpShares = splitEvenly(phpAmountMinor, participantIds)
        val shares = participantIds.sorted().map { participantId ->
            ExpenseShareEntity(
                expenseId = expense.id,
                userId = participantId,
                originalAmountMinor = requireNotNull(originalShares[participantId]),
                phpAmountMinor = requireNotNull(phpShares[participantId]),
            )
        }

        return ExpenseRecord(
            expense = expense,
            shares = expenseShareRepository.saveAll(shares),
            snapshot = snapshot,
        )
    }

    private fun splitEvenly(totalMinor: Long, participantIds: List<UUID>): Map<UUID, Long> {
        val sortedIds = participantIds.sorted()
        val quotient = totalMinor / sortedIds.size
        val remainder = totalMinor % sortedIds.size

        return sortedIds.mapIndexed { index, userId ->
            userId to quotient + if (index.toLong() < remainder) 1 else 0
        }.toMap()
    }
}
