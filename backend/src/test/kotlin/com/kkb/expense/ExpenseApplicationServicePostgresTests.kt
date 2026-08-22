package com.kkb.expense

import com.kkb.auth.UserEntity
import com.kkb.auth.UserRepository
import com.kkb.currency.SupportedCurrency
import com.kkb.fx.ExchangeRateClient
import com.kkb.fx.RemoteExchangeRate
import com.kkb.web.ApiException
import com.kkb.group.GroupApplicationService
import com.kkb.group.ExpenseGroupEntity
import com.kkb.group.ExpenseGroupRepository
import com.kkb.group.GroupMemberEntity
import com.kkb.group.GroupMemberRepository
import com.kkb.group.GroupRole
import com.kkb.balance.GroupBalanceService
import com.kkb.invitation.InvitationApplicationService
import com.kkb.invitation.EmailOutboxRepository
import com.kkb.settlement.CreateSettlementCommand
import com.kkb.settlement.SettlementApplicationService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.context.annotation.Primary
import org.springframework.http.HttpStatus
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID
import java.util.concurrent.atomic.AtomicInteger

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = ["app.fx.prefetch-cron=0 0 0 1 1 *"])
@Import(FakeExchangeRateConfiguration::class)
class ExpenseApplicationServicePostgresTests @Autowired constructor(
    private val expenseApplicationService: ExpenseApplicationService,
    private val userRepository: UserRepository,
    private val groupRepository: ExpenseGroupRepository,
    private val groupMemberRepository: GroupMemberRepository,
    private val exchangeRateClient: FakeExchangeRateClient,
    private val groupApplicationService: GroupApplicationService,
    private val invitationApplicationService: InvitationApplicationService,
    private val settlementApplicationService: SettlementApplicationService,
    private val groupBalanceService: GroupBalanceService,
    private val emailOutboxRepository: EmailOutboxRepository,
) {
    @Test
    fun `creates an expense with one locked rate and exact share totals`() {
        val fixture = createGroupFixture()
        val date = LocalDate.of(2025, 3, 9)
        exchangeRateClient.reset()

        val first = expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateExpenseCommand(
                description = "  Shuttlecocks  ",
                amount = "10.01",
                currency = SupportedCurrency.USD.name,
                paidByUserId = fixture.users[1],
                participantIds = fixture.users.reversed(),
                expenseDate = date,
            ),
        )

        val second = expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateExpenseCommand(
                description = "Water",
                amount = "1.00",
                currency = SupportedCurrency.USD.name,
                paidByUserId = fixture.users.first(),
                participantIds = fixture.users,
                expenseDate = date,
            ),
        )

        assertEquals("Shuttlecocks", first.expense.description)
        assertEquals(1_001, first.expense.originalAmountMinor)
        assertEquals(56_180, first.expense.phpAmountMinor)
        assertEquals(1_001, first.shares.sumOf(ExpenseShareEntity::originalAmountMinor))
        assertEquals(56_180, first.shares.sumOf(ExpenseShareEntity::phpAmountMinor))
        assertEquals(date, first.snapshot.effectiveDate)
        assertEquals(BigDecimal("56.1234000000"), first.snapshot.baseUnitsPerQuoteUnit)
        assertEquals(first.snapshot.id, second.snapshot.id)
        assertEquals(1, exchangeRateClient.calls.get())

        val listed = expenseApplicationService.list(fixture.groupId, fixture.users.first())
        assertEquals(2, listed.size)
    }

    @Test
    fun `uses the latest available rate for a missing expense date and locks it to that date`() {
        val fixture = createGroupFixture()
        val expenseDate = LocalDate.of(2025, 4, 6)
        exchangeRateClient.reset()
        exchangeRateClient.markUnavailable(expenseDate, expenseDate.minusDays(1))

        val first = expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateExpenseCommand(
                description = "Weekend lunch",
                amount = "10.00",
                currency = SupportedCurrency.USD.name,
                paidByUserId = fixture.users.first(),
                participantIds = fixture.users,
                expenseDate = expenseDate,
            ),
        )
        val second = expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateExpenseCommand(
                description = "Weekend dinner",
                amount = "20.00",
                currency = SupportedCurrency.USD.name,
                paidByUserId = fixture.users.first(),
                participantIds = fixture.users,
                expenseDate = expenseDate,
            ),
        )

        assertEquals(expenseDate, first.snapshot.effectiveDate)
        assertEquals(BigDecimal("56.1234000000"), first.snapshot.baseUnitsPerQuoteUnit)
        assertEquals(first.snapshot.id, second.snapshot.id)
        assertEquals(
            listOf(expenseDate, expenseDate.minusDays(1), expenseDate.minusDays(2)),
            exchangeRateClient.requestedDates,
        )
    }

    @Test
    fun `does not use an older rate when the provider is unavailable`() {
        val fixture = createGroupFixture()
        val expenseDate = LocalDate.of(2025, 4, 7)
        exchangeRateClient.reset()
        exchangeRateClient.failWithProviderUnavailable()

        val exception = assertThrows(ApiException::class.java) {
            expenseApplicationService.create(
                groupId = fixture.groupId,
                actorUserId = fixture.users.first(),
                command = CreateExpenseCommand(
                    description = "Dinner",
                    amount = "10.00",
                    currency = SupportedCurrency.USD.name,
                    paidByUserId = fixture.users.first(),
                    participantIds = fixture.users,
                    expenseDate = expenseDate,
                ),
            )
        }

        assertEquals("rate_provider_unavailable", exception.code)
        assertEquals(listOf(expenseDate), exchangeRateClient.requestedDates)
    }

    @Test
    fun `stops looking for an older rate after seven days`() {
        val fixture = createGroupFixture()
        val expenseDate = LocalDate.of(2025, 4, 20)
        val attemptedDates = (0L..7L).map(expenseDate::minusDays)
        exchangeRateClient.reset()
        exchangeRateClient.markUnavailable(*attemptedDates.toTypedArray())

        val exception = assertThrows(ApiException::class.java) {
            expenseApplicationService.create(
                groupId = fixture.groupId,
                actorUserId = fixture.users.first(),
                command = CreateExpenseCommand(
                    description = "Dinner",
                    amount = "10.00",
                    currency = SupportedCurrency.USD.name,
                    paidByUserId = fixture.users.first(),
                    participantIds = fixture.users,
                    expenseDate = expenseDate,
                ),
            )
        }

        assertEquals("rate_not_available", exception.code)
        assertEquals(attemptedDates, exchangeRateClient.requestedDates)
    }

    @Test
    fun `rejects payers who are not group members without persisting an expense`() {
        val fixture = createGroupFixture()
        val outsider = createUser()

        val exception = assertThrows(com.kkb.web.ApiException::class.java) {
            expenseApplicationService.create(
                groupId = fixture.groupId,
                actorUserId = fixture.users.first(),
                command = CreateExpenseCommand(
                    description = "Dinner",
                    amount = "100.00",
                    currency = SupportedCurrency.PHP.name,
                    paidByUserId = outsider,
                    participantIds = fixture.users,
                    expenseDate = LocalDate.of(2025, 3, 8),
                ),
            )
        }

        assertEquals("payer_not_in_group", exception.code)
    }

    @Test
    fun `adds an invited user only after explicit acceptance`() {
        val ownerId = createUser()
        val group = groupApplicationService.create(ownerId, "Invite Test", "#5b7ec9")
        val invitedEmail = "invited-${UUID.randomUUID()}@example.test"

        val invitedGroup = groupApplicationService.invite(group.group.id, ownerId, invitedEmail)
        assertEquals(1, invitedGroup.pendingInvites.size)
        val invitationToken = invitedGroup.pendingInvites.single().invite.token

        val invitedUser = userRepository.save(
            UserEntity(
                googleSubject = "subject-${UUID.randomUUID()}",
                email = invitedEmail,
                displayName = "Invited User",
            ),
        )
        val beforeAcceptance = groupApplicationService.list(ownerId).single { it.group.id == group.group.id }
        assertEquals(1, beforeAcceptance.members.size)

        invitationApplicationService.acceptGroupInvitation(invitationToken, invitedUser.id)

        val reloaded = groupApplicationService.list(ownerId).single { it.group.id == group.group.id }
        assertEquals(2, reloaded.members.size)
        assertEquals(0, reloaded.pendingInvites.size)
    }

    @Test
    fun `rejects group acceptance from a different email`() {
        val ownerId = createUser()
        val group = groupApplicationService.create(ownerId, "Private Group", "#5b7ec9")
        val invitedEmail = "invited-${UUID.randomUUID()}@example.test"
        val invitation = groupApplicationService.invite(group.group.id, ownerId, invitedEmail)
            .pendingInvites
            .single()
            .invite
        val wrongUserId = createUser()

        val exception = assertThrows(com.kkb.web.ApiException::class.java) {
            invitationApplicationService.acceptGroupInvitation(invitation.token, wrongUserId)
        }

        assertEquals("invitation_email_mismatch", exception.code)
        val reloaded = groupApplicationService.list(ownerId).single { it.group.id == group.group.id }
        assertEquals(1, reloaded.members.size)
    }

    @Test
    fun `kkb invitation queues email without a group invitation`() {
        val inviterId = createUser()
        val recipientEmail = "new-${UUID.randomUUID()}@example.test"

        val result = invitationApplicationService.inviteToKkb(inviterId, recipientEmail)
        val queuedEmail = emailOutboxRepository.findFirstByRecipientEmailOrderByCreatedAtDesc(recipientEmail)

        assertEquals("QUEUED", result.deliveryStatus.name)
        assertEquals(null, queuedEmail?.groupInvite)
        assertEquals(true, queuedEmail?.textBody?.contains("does not add you to a group"))
    }

    @Test
    fun `settlements reduce the exact server-calculated group balance`() {
        val fixture = createGroupFixture()
        val date = LocalDate.of(2025, 3, 7)
        expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateExpenseCommand(
                description = "Dinner",
                amount = "9.00",
                currency = SupportedCurrency.PHP.name,
                paidByUserId = fixture.users.first(),
                participantIds = fixture.users,
                expenseDate = date,
            ),
        )
        val before = groupBalanceService.calculate(fixture.groupId, fixture.users.first())
        val debtor = before.suggestions.first()

        settlementApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateSettlementCommand(
                fromUserId = debtor.fromUserId,
                toUserId = debtor.toUserId,
                amount = SupportedCurrency.PHP.formatMinorUnits(debtor.phpAmountMinor),
                currency = SupportedCurrency.PHP.name,
                settlementDate = date,
            ),
        )

        val after = groupBalanceService.calculate(fixture.groupId, fixture.users.first())
        assertEquals(1, after.suggestions.size)
        assertEquals(0L, after.balances.sumOf { it.phpAmountMinor })
    }

    @Test
    fun `group members can update and delete expenses`() {
        val fixture = createGroupFixture()
        exchangeRateClient.reset()
        val created = expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateExpenseCommand(
                description = "Dinner",
                amount = "9.00",
                currency = SupportedCurrency.PHP.name,
                paidByUserId = fixture.users.first(),
                participantIds = fixture.users,
                expenseDate = LocalDate.of(2025, 3, 7),
            ),
        )

        val updated = expenseApplicationService.update(
            groupId = fixture.groupId,
            expenseId = created.expense.id,
            actorUserId = fixture.users[1],
            command = CreateExpenseCommand(
                description = "Updated dinner",
                amount = "10.01",
                currency = SupportedCurrency.USD.name,
                paidByUserId = fixture.users[1],
                participantIds = fixture.users.take(2),
                expenseDate = LocalDate.of(2025, 3, 8),
            ),
        )

        assertEquals(created.expense.id, updated.expense.id)
        assertEquals("Updated dinner", updated.expense.description)
        assertEquals(2, updated.shares.size)
        assertEquals(1_001, updated.shares.sumOf(ExpenseShareEntity::originalAmountMinor))

        expenseApplicationService.delete(fixture.groupId, created.expense.id, fixture.users[2])

        assertEquals(emptyList<ExpenseRecord>(), expenseApplicationService.list(fixture.groupId, fixture.users.first()))
    }

    @Test
    fun `expense mutations are hidden from users outside the group`() {
        val fixture = createGroupFixture()
        val outsider = createUser()
        exchangeRateClient.reset()
        val created = expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = fixture.users.first(),
            command = CreateExpenseCommand(
                description = "Dinner",
                amount = "9.00",
                currency = SupportedCurrency.PHP.name,
                paidByUserId = fixture.users.first(),
                participantIds = fixture.users,
                expenseDate = LocalDate.of(2025, 3, 7),
            ),
        )

        val updateException = assertThrows(ApiException::class.java) {
            expenseApplicationService.update(
                groupId = fixture.groupId,
                expenseId = created.expense.id,
                actorUserId = outsider,
                command = CreateExpenseCommand(
                    description = "Changed",
                    amount = "9.00",
                    currency = SupportedCurrency.PHP.name,
                    paidByUserId = fixture.users.first(),
                    participantIds = fixture.users,
                    expenseDate = LocalDate.of(2025, 3, 7),
                ),
            )
        }
        val deleteException = assertThrows(ApiException::class.java) {
            expenseApplicationService.delete(fixture.groupId, created.expense.id, outsider)
        }

        assertEquals("group_not_found", updateException.code)
        assertEquals("group_not_found", deleteException.code)
    }

    @Test
    fun `removing a settled member retains history and reinviting reactivates membership`() {
        val fixture = createGroupFixture()
        exchangeRateClient.reset()
        val ownerId = fixture.users.first()
        val memberId = fixture.users[1]
        val memberEmail = userRepository.findById(memberId).orElseThrow().email
        val date = LocalDate.of(2025, 3, 7)
        expenseApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = ownerId,
            command = CreateExpenseCommand(
                description = "Dinner",
                amount = "9.00",
                currency = SupportedCurrency.PHP.name,
                paidByUserId = ownerId,
                participantIds = fixture.users,
                expenseDate = date,
            ),
        )

        val outstanding = assertThrows(ApiException::class.java) {
            groupApplicationService.removeMember(fixture.groupId, memberId, ownerId)
        }
        assertEquals("member_balance_outstanding", outstanding.code)

        settlementApplicationService.create(
            groupId = fixture.groupId,
            actorUserId = ownerId,
            command = CreateSettlementCommand(
                fromUserId = memberId,
                toUserId = ownerId,
                amount = "3.00",
                currency = SupportedCurrency.PHP.name,
                settlementDate = date,
            ),
        )
        val removed = groupApplicationService.removeMember(fixture.groupId, memberId, ownerId)
        assertEquals(false, removed.members.any { it.user.id == memberId })
        assertEquals(true, removed.formerMembers.any { it.user.id == memberId })

        val invitation = groupApplicationService.invite(fixture.groupId, ownerId, memberEmail)
            .pendingInvites
            .single { it.invite.email == memberEmail }
            .invite
        invitationApplicationService.acceptGroupInvitation(invitation.token, memberId)

        val reactivated = groupApplicationService.list(ownerId).single { it.group.id == fixture.groupId }
        assertEquals(true, reactivated.members.any { it.user.id == memberId })
        assertEquals(false, reactivated.formerMembers.any { it.user.id == memberId })
    }

    @Test
    fun `only the owner can update and delete a group`() {
        val fixture = createGroupFixture()
        val ownerId = fixture.users.first()
        val memberId = fixture.users[1]

        val forbidden = assertThrows(ApiException::class.java) {
            groupApplicationService.update(fixture.groupId, memberId, "Changed", "#c25e3a")
        }
        assertEquals("group_not_found", forbidden.code)

        val updated = groupApplicationService.update(fixture.groupId, ownerId, "  Renamed group  ", "#c25e3a")
        assertEquals("Renamed group", updated.group.name)
        assertEquals("#c25e3a", updated.group.tileColor)

        groupApplicationService.delete(fixture.groupId, ownerId)
        assertEquals(false, groupRepository.existsById(fixture.groupId))
        assertEquals(false, groupApplicationService.list(ownerId).any { it.group.id == fixture.groupId })
    }

    private fun createGroupFixture(): GroupFixture {
        val users = List(3) { createUser() }.sorted()
        val groupId = groupRepository.save(
            ExpenseGroupEntity(
                name = "Backend Test Group",
                tileColor = "#5b7ec9",
                createdByUserId = users.first(),
            ),
        ).id
        groupMemberRepository.saveAll(users.mapIndexed { index, userId ->
            GroupMemberEntity(
                groupId = groupId,
                userId = userId,
                role = if (index == 0) GroupRole.OWNER.name else GroupRole.MEMBER.name,
            )
        })
        return GroupFixture(groupId, users)
    }

    private fun createUser(): UUID {
        val marker = UUID.randomUUID().toString()
        return userRepository.save(
            UserEntity(
                googleSubject = "subject-$marker",
                email = "$marker@example.test",
                displayName = "Test User",
            ),
        ).id
    }

    companion object {
        @Container
        @JvmField
        val postgres = PostgreSQLContainer(DockerImageName.parse("postgres:17-alpine"))

        @DynamicPropertySource
        @JvmStatic
        fun databaseProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }
}

private data class GroupFixture(
    val groupId: UUID,
    val users: List<UUID>,
)

@TestConfiguration(proxyBeanMethods = false)
class FakeExchangeRateConfiguration {
    @Bean
    @Primary
    fun fakeExchangeRateClient() = FakeExchangeRateClient()
}

class FakeExchangeRateClient : ExchangeRateClient {
    val calls = AtomicInteger()
    val requestedDates = mutableListOf<LocalDate>()
    private val unavailableDates = mutableSetOf<LocalDate>()
    private var providerUnavailable = false

    override fun phpPerUnit(currency: SupportedCurrency, date: LocalDate): RemoteExchangeRate {
        calls.incrementAndGet()
        requestedDates.add(date)
        if (providerUnavailable) {
            throw ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "rate_provider_unavailable",
                "The exchange-rate provider is temporarily unavailable",
            )
        }
        if (date in unavailableDates) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "rate_not_available",
                "No exact PHP rate is available for ${currency.name} on $date",
            )
        }
        val rate = if (currency == SupportedCurrency.PHP) BigDecimal.ONE else BigDecimal("56.1234")
        return RemoteExchangeRate(date, rate)
    }

    fun markUnavailable(vararg dates: LocalDate) {
        unavailableDates.addAll(dates)
    }

    fun failWithProviderUnavailable() {
        providerUnavailable = true
    }

    fun reset() {
        calls.set(0)
        requestedDates.clear()
        unavailableDates.clear()
        providerUnavailable = false
    }
}
