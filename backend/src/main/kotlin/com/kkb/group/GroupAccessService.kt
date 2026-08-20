package com.kkb.group

import com.kkb.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class GroupAccessService(
    private val groupRepository: ExpenseGroupRepository,
    private val groupMemberRepository: GroupMemberRepository,
) {
    fun requireMembership(groupId: UUID, userId: UUID) {
        if (!groupRepository.existsById(groupId) || !groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw ApiException(HttpStatus.NOT_FOUND, "group_not_found", "Group was not found")
        }
    }

    fun memberIds(groupId: UUID): Set<UUID> =
        groupMemberRepository.findUserIdsByGroupId(groupId).toSet()

    fun requireExpenseMembers(groupId: UUID, paidByUserId: UUID, participantIds: List<UUID>) {
        val memberIds = memberIds(groupId)
        if (paidByUserId !in memberIds) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "payer_not_in_group",
                "The payer must be a member of the group",
            )
        }

        if (participantIds.any { it !in memberIds }) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "participant_not_in_group",
                "Every participant must be a member of the group",
            )
        }
    }
}
