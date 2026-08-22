package com.kkb.config

import com.kkb.auth.UserEntity
import com.kkb.auth.UserLoginHook
import com.kkb.auth.UserRepository
import com.kkb.expense.ExpenseEntity
import com.kkb.expense.ExpenseRepository
import com.kkb.expense.ExpenseShareEntity
import com.kkb.expense.ExpenseShareRepository
import com.kkb.fx.FxRateService
import com.kkb.fx.FxRateSnapshotEntity
import com.kkb.fx.FxRateSnapshotRepository
import com.kkb.group.ExpenseGroupEntity
import com.kkb.group.ExpenseGroupRepository
import com.kkb.group.GroupMemberEntity
import com.kkb.group.GroupMemberRepository
import com.kkb.group.GroupRole
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.time.Clock
import java.time.Instant
import java.time.LocalDate

@Component
@Profile("seed")
class SeedDataLoginHook(
    private val userRepository: UserRepository,
    private val groupRepository: ExpenseGroupRepository,
    private val groupMemberRepository: GroupMemberRepository,
    private val fxRateSnapshotRepository: FxRateSnapshotRepository,
    private val expenseRepository: ExpenseRepository,
    private val expenseShareRepository: ExpenseShareRepository,
    private val clock: Clock,
) : UserLoginHook {
    override fun afterLogin(user: UserEntity) {
        if (groupMemberRepository.findAllByUserIdAndRemovedAtIsNullOrderByJoinedAt(user.id).isNotEmpty()) return

        val now = Instant.now(clock)
        val date = LocalDate.now(clock).minusDays(1)
        val friends = listOf(
            seedUser("seed:miguel", "miguel.seed@kkb.local", "Miguel Santos"),
            seedUser("seed:bea", "bea.seed@kkb.local", "Bea Lim"),
        )
        val group = groupRepository.save(
            ExpenseGroupEntity(
                name = "Welcome to KKB",
                tileColor = "#5b7ec9",
                createdByUserId = user.id,
                createdAt = now,
                updatedAt = now,
            ),
        )
        val memberIds = listOf(user.id) + friends.map(UserEntity::id)
        groupMemberRepository.saveAll(memberIds.mapIndexed { index, userId ->
            GroupMemberEntity(
                groupId = group.id,
                userId = userId,
                role = if (index == 0) GroupRole.OWNER.name else GroupRole.MEMBER.name,
                joinedAt = now,
            )
        })
        val snapshot = fxRateSnapshotRepository
            .findByBaseCurrencyAndQuoteCurrencyAndEffectiveDateAndProvider("PHP", "PHP", date, FxRateService.INTERNAL_PROVIDER)
            ?: fxRateSnapshotRepository.save(
                FxRateSnapshotEntity(
                    baseCurrency = "PHP",
                    quoteCurrency = "PHP",
                    baseUnitsPerQuoteUnit = BigDecimal("1.0000000000"),
                    effectiveDate = date,
                    provider = FxRateService.INTERNAL_PROVIDER,
                    fetchedAt = now,
                ),
            )
        val expense = expenseRepository.save(
            ExpenseEntity(
                groupId = group.id,
                description = "First barkada dinner",
                originalAmountMinor = 150_000,
                originalCurrency = "PHP",
                fxRateSnapshotId = snapshot.id,
                phpAmountMinor = 150_000,
                paidByUserId = user.id,
                expenseDate = date,
                createdAt = now,
            ),
        )
        expenseShareRepository.saveAll(memberIds.map { userId ->
            ExpenseShareEntity(
                expenseId = expense.id,
                userId = userId,
                originalAmountMinor = 50_000,
                phpAmountMinor = 50_000,
            )
        })
    }

    private fun seedUser(subject: String, email: String, displayName: String): UserEntity =
        userRepository.findByGoogleSubject(subject) ?: userRepository.save(
            UserEntity(
                googleSubject = subject,
                email = email,
                displayName = displayName,
            ),
        )
}
