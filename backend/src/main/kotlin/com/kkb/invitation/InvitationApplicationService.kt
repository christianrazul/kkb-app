package com.kkb.invitation

import com.kkb.auth.UserRepository
import com.kkb.group.ExpenseGroupRepository
import com.kkb.group.GroupInviteRepository
import com.kkb.group.GroupInviteStatus
import com.kkb.group.GroupMemberEntity
import com.kkb.group.GroupMemberRepository
import com.kkb.group.GroupRole
import com.kkb.web.ApiException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.util.UUID

@Service
class InvitationApplicationService(
    private val groupInviteRepository: GroupInviteRepository,
    private val groupRepository: ExpenseGroupRepository,
    private val groupMemberRepository: GroupMemberRepository,
    private val userRepository: UserRepository,
    private val emailComposer: InvitationEmailComposer,
    private val emailOutboxService: EmailOutboxService,
    private val clock: Clock,
    @Value("\${app.frontend-url}") frontendUrl: String,
) {
    private val frontendUrl = frontendUrl.trimEnd('/')

    @Transactional(readOnly = true)
    fun groupInvitation(token: String): GroupInvitationRecord {
        val invite = requireGroupInvitation(token)
        val group = groupRepository.findById(invite.groupId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, "invitation_not_found", "Invitation was not found")
        }
        val inviter = userRepository.findById(invite.invitedByUserId).orElseThrow()
        return GroupInvitationRecord(
            groupId = group.id,
            groupName = group.name,
            inviterName = inviter.displayName,
            invitedEmail = maskEmail(invite.email),
            status = invite.status,
        )
    }

    @Transactional
    fun acceptGroupInvitation(token: String, actorUserId: UUID): GroupInvitationDecision {
        val invite = requireGroupInvitation(token)
        val actor = userRepository.findById(actorUserId).orElseThrow()
        requireMatchingEmail(invite.email, actor.email)
        if (invite.status == GroupInviteStatus.ACCEPTED.name && invite.acceptedByUserId == actor.id) {
            return GroupInvitationDecision(invite.groupId, GroupInviteStatus.ACCEPTED.name)
        }
        if (invite.status != GroupInviteStatus.PENDING.name) {
            throw ApiException(HttpStatus.CONFLICT, "invitation_not_pending", "This invitation is no longer pending")
        }

        val now = Instant.now(clock)
        if (!groupMemberRepository.existsByGroupIdAndUserId(invite.groupId, actor.id)) {
            groupMemberRepository.save(
                GroupMemberEntity(
                    groupId = invite.groupId,
                    userId = actor.id,
                    role = GroupRole.MEMBER.name,
                    joinedAt = now,
                ),
            )
        }
        invite.status = GroupInviteStatus.ACCEPTED.name
        invite.acceptedByUserId = actor.id
        invite.acceptedAt = now
        invite.updatedAt = now
        groupInviteRepository.save(invite)
        emailOutboxService.cancelQueued(invite.id)
        return GroupInvitationDecision(invite.groupId, invite.status)
    }

    @Transactional
    fun declineGroupInvitation(token: String, actorUserId: UUID): GroupInvitationDecision {
        val invite = requireGroupInvitation(token)
        val actor = userRepository.findById(actorUserId).orElseThrow()
        requireMatchingEmail(invite.email, actor.email)
        if (invite.status != GroupInviteStatus.PENDING.name) {
            throw ApiException(HttpStatus.CONFLICT, "invitation_not_pending", "This invitation is no longer pending")
        }

        invite.status = GroupInviteStatus.DECLINED.name
        invite.updatedAt = Instant.now(clock)
        groupInviteRepository.save(invite)
        emailOutboxService.cancelQueued(invite.id)
        return GroupInvitationDecision(invite.groupId, invite.status)
    }

    @Transactional
    fun inviteToKkb(actorUserId: UUID, rawEmail: String): KkbInvitationRecord {
        val email = rawEmail.trim().lowercase()
        if (userRepository.findByEmailIgnoreCase(email) != null) {
            throw ApiException(HttpStatus.CONFLICT, "already_kkb_user", "This email already belongs to a KKB user")
        }
        val inviter = userRepository.findById(actorUserId).orElseThrow()
        val invitationUrl = "$frontendUrl/invite/kkb"
        val queued = emailOutboxService.queue(
            requestedByUserId = actorUserId,
            recipientEmail = email,
            content = emailComposer.kkbInvitation(inviter.displayName, invitationUrl),
        )
        return KkbInvitationRecord(invitationUrl, EmailDeliveryStatus.valueOf(queued.status))
    }

    private fun requireGroupInvitation(token: String) =
        groupInviteRepository.findByToken(token)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "invitation_not_found", "Invitation was not found")

    private fun requireMatchingEmail(invitedEmail: String, actorEmail: String) {
        if (!invitedEmail.equals(actorEmail.trim(), ignoreCase = true)) {
            throw ApiException(
                HttpStatus.FORBIDDEN,
                "invitation_email_mismatch",
                "Sign in with the Google account that received this invitation",
            )
        }
    }

    private fun maskEmail(email: String): String {
        val local = email.substringBefore('@')
        val domain = email.substringAfter('@', "")
        val visible = local.take(1)
        return "$visible${"*".repeat((local.length - 1).coerceIn(2, 8))}@$domain"
    }
}

data class GroupInvitationRecord(
    val groupId: UUID,
    val groupName: String,
    val inviterName: String,
    val invitedEmail: String,
    val status: String,
)

data class GroupInvitationDecision(
    val groupId: UUID,
    val status: String,
)

data class KkbInvitationRecord(
    val inviteUrl: String,
    val deliveryStatus: EmailDeliveryStatus,
)
