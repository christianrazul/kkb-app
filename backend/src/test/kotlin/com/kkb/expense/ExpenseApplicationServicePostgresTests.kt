package com.kkb.expense

import com.kkb.auth.UserEntity
import com.kkb.auth.UserRepository
import com.kkb.currency.SupportedCurrency
import com.kkb.fx.ExchangeRateClient
import com.kkb.fx.RemoteExchangeRate
import com.kkb.group.GroupApplicationService
import com.kkb.group.GroupInvitationAcceptanceService
import com.kkb.group.ExpenseGroupEntity
import com.kkb.group.ExpenseGroupRepository
import com.kkb.group.GroupMemberEntity
import com.kkb.group.GroupMemberRepository
import com.kkb.group.GroupRole
import com.kkb.balance.GroupBalanceService
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
    private val invitationAcceptanceService: GroupInvitationAcceptanceService,
    private val settlementApplicationService: SettlementApplicationService,
    private val groupBalanceService: GroupBalanceService,
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
    fun `accepts a pending email invitation when the matching user is provisioned`() {
        val ownerId = createUser()
        val group = groupApplicationService.create(ownerId, "Invite Test", "#5b7ec9")
        val invitedEmail = "invited-${UUID.randomUUID()}@example.test"

        val invitedGroup = groupApplicationService.invite(group.group.id, ownerId, invitedEmail)
        assertEquals(1, invitedGroup.pendingInvites.size)

        val invitedUser = userRepository.save(
            UserEntity(
                googleSubject = "subject-${UUID.randomUUID()}",
                email = invitedEmail,
                displayName = "Invited User",
            ),
        )
        invitationAcceptanceService.acceptPendingInvitations(invitedUser)

        val reloaded = groupApplicationService.list(ownerId).single { it.group.id == group.group.id }
        assertEquals(2, reloaded.members.size)
        assertEquals(0, reloaded.pendingInvites.size)
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

    override fun phpPerUnit(currency: SupportedCurrency, date: LocalDate): RemoteExchangeRate {
        calls.incrementAndGet()
        val rate = if (currency == SupportedCurrency.PHP) BigDecimal.ONE else BigDecimal("56.1234")
        return RemoteExchangeRate(date, rate)
    }

    fun reset() {
        calls.set(0)
    }
}
