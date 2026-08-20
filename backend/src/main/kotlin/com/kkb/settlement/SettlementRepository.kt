package com.kkb.settlement

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SettlementRepository : JpaRepository<SettlementEntity, UUID> {
    fun findAllByGroupIdOrderBySettledAtDescCreatedAtDesc(groupId: UUID): List<SettlementEntity>
}
