package com.kkb.fx

import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Component
class FxRateSnapshotWriter(
    private val repository: FxRateSnapshotRepository,
) {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun insert(snapshot: FxRateSnapshotEntity): FxRateSnapshotEntity =
        repository.saveAndFlush(snapshot)
}
