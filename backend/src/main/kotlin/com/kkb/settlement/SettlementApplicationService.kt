package com.kkb.settlement

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
class SettlementApplicationService(
    private val groupAccessService: GroupAccessService,
    private val fxRateService: FxRateService,
    private val transactionWriter: SettlementTransactionWriter,
    private val settlementRepository: SettlementRepository,
    private val fxRateSnapshotRepository: FxRateSnapshotRepository,
    private val clock: Clock,
) {
    fun create(groupId: UUID, actorUserId: UUID, command: CreateSettlementCommand): SettlementRecord {
        groupAccessService.requireMembership(groupId, actorUserId)
        if (command.fromUserId == command.toUserId) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "same_settlement_participant",
                "Settlement sender and recipient must be different users",
            )
        }
        groupAccessService.requireExpenseMembers(groupId, command.fromUserId, listOf(command.toUserId))
        if (command.settlementDate > LocalDate.now(clock)) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "future_settlement_date",
                "Settlement date cannot be in the future",
            )
        }

        val currency = SupportedCurrency.parse(command.currency)
        val originalAmountMinor = currency.toMinorUnits(command.amount)
        val snapshot = fxRateService.resolve(currency, command.settlementDate)
        val phpAmountMinor = try {
            fxRateService.phpAmountMinor(originalAmountMinor, currency, snapshot)
        } catch (_: ArithmeticException) {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "amount_too_large", "Converted amount is too large")
        }

        return transactionWriter.persist(
            groupId = groupId,
            actorUserId = actorUserId,
            fromUserId = command.fromUserId,
            toUserId = command.toUserId,
            originalAmountMinor = originalAmountMinor,
            currency = currency,
            phpAmountMinor = phpAmountMinor,
            snapshot = snapshot,
        )
    }

    @Transactional(readOnly = true)
    fun list(groupId: UUID, actorUserId: UUID): List<SettlementRecord> {
        groupAccessService.requireMembership(groupId, actorUserId)
        val settlements = settlementRepository.findAllByGroupIdOrderBySettledAtDescCreatedAtDesc(groupId)
        val snapshots = fxRateSnapshotRepository.findAllById(settlements.map(SettlementEntity::fxRateSnapshotId).toSet())
            .associateBy(FxRateSnapshotEntity::id)
        return settlements.map { settlement ->
            SettlementRecord(settlement, requireNotNull(snapshots[settlement.fxRateSnapshotId]))
        }
    }
}

data class CreateSettlementCommand(
    val fromUserId: UUID,
    val toUserId: UUID,
    val amount: String,
    val currency: String,
    val settlementDate: LocalDate,
)

data class SettlementRecord(
    val settlement: SettlementEntity,
    val snapshot: FxRateSnapshotEntity,
)

@Service
class SettlementTransactionWriter(
    private val groupAccessService: GroupAccessService,
    private val settlementRepository: SettlementRepository,
    private val clock: Clock,
) {
    @Transactional
    fun persist(
        groupId: UUID,
        actorUserId: UUID,
        fromUserId: UUID,
        toUserId: UUID,
        originalAmountMinor: Long,
        currency: SupportedCurrency,
        phpAmountMinor: Long,
        snapshot: FxRateSnapshotEntity,
    ): SettlementRecord {
        groupAccessService.requireMembership(groupId, actorUserId)
        groupAccessService.requireExpenseMembers(groupId, fromUserId, listOf(toUserId))
        val now = Instant.now(clock)
        val settlement = settlementRepository.save(
            SettlementEntity(
                groupId = groupId,
                fromUserId = fromUserId,
                toUserId = toUserId,
                originalAmountMinor = originalAmountMinor,
                originalCurrency = currency.name,
                fxRateSnapshotId = snapshot.id,
                phpAmountMinor = phpAmountMinor,
                settledAt = now,
                createdAt = now,
            ),
        )
        return SettlementRecord(settlement, snapshot)
    }
}
