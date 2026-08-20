package com.kkb.group

import com.kkb.auth.UserEntity
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.Instant

@Service
class GroupInvitationAcceptanceService(
    private val groupInviteRepository: GroupInviteRepository,
    private val groupMemberRepository: GroupMemberRepository,
    private val clock: Clock,
) {
    fun acceptPendingInvitations(user: UserEntity) {
        val normalizedEmail = user.email.trim().lowercase()
        val now = Instant.now(clock)
        groupInviteRepository.findAllByEmailAndStatus(normalizedEmail, GroupInviteStatus.PENDING.name)
            .forEach { invite ->
                if (!groupMemberRepository.existsByGroupIdAndUserId(invite.groupId, user.id)) {
                    groupMemberRepository.save(
                        GroupMemberEntity(
                            groupId = invite.groupId,
                            userId = user.id,
                            role = GroupRole.MEMBER.name,
                            joinedAt = now,
                        ),
                    )
                }
                invite.status = GroupInviteStatus.ACCEPTED.name
                invite.acceptedByUserId = user.id
                invite.acceptedAt = now
                invite.updatedAt = now
                groupInviteRepository.save(invite)
            }
    }
}
