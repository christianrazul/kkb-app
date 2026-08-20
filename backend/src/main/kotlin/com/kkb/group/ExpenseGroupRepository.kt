package com.kkb.group

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExpenseGroupRepository : JpaRepository<ExpenseGroupEntity, UUID>
