package com.kkb.group

import com.kkb.auth.UserEntity
import com.kkb.auth.UserRepository
import com.kkb.invitation.EmailDeliveryStatus
import com.kkb.invitation.EmailOutboxService
import com.kkb.invitation.InvitationEmailComposer
import com.kkb.invitation.InvitationTokenGenerator
import com.kkb.web.ApiException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.util.UUID

@Service
class GroupApplicationService(
    private val groupRepository: ExpenseGroupRepository,
    private val groupMemberRepository: GroupMemberRepository,
    private val groupInviteRepository: GroupInviteRepository,
    private val userRepository: UserRepository,
    private val tokenGenerator: InvitationTokenGenerator,
    private val emailComposer: InvitationEmailComposer,
    private val emailOutboxService: EmailOutboxService,
    private val clock: Clock,
    @Value("\${app.frontend-url}") frontendUrl: String,
) {
    private val frontendUrl = frontendUrl.trimEnd('/')

    @Transactional(readOnly = true)
    fun list(actorUserId: UUID): List<GroupRecord> =
        groupMemberRepository.findAllByUserIdOrderByJoinedAt(actorUserId)
            .mapNotNull { membership -> groupRepository.findById(membership.groupId).orElse(null) }
            .map { group -> assemble(group, actorUserId) }

    @Transactional
    fun create(actorUserId: UUID, name: String, tileColor: String): GroupRecord {
        val now = Instant.now(clock)
        val group = groupRepository.save(
            ExpenseGroupEntity(
                name = normalizeName(name),
                tileColor = tileColor,
                createdByUserId = actorUserId,
                createdAt = now,
                updatedAt = now,
            ),
        )
        groupMemberRepository.save(
            GroupMemberEntity(
                groupId = group.id,
                userId = actorUserId,
                role = GroupRole.OWNER.name,
                joinedAt = now,
            ),
        )
        return assemble(group, actorUserId)
    }

    @Transactional
    fun update(groupId: UUID, actorUserId: UUID, name: String, tileColor: String): GroupRecord {
        requireOwner(groupId, actorUserId)
        val group = requireGroup(groupId)
        group.name = normalizeName(name)
        group.tileColor = tileColor
        group.updatedAt = Instant.now(clock)
        return assemble(groupRepository.save(group), actorUserId)
    }

    @Transactional
    fun delete(groupId: UUID, actorUserId: UUID) {
        requireOwner(groupId, actorUserId)
        groupRepository.delete(requireGroup(groupId))
    }

    @Transactional
    fun invite(groupId: UUID, actorUserId: UUID, rawEmail: String): GroupRecord {
        requireOwner(groupId, actorUserId)
        val email = rawEmail.trim().lowercase()
        val now = Instant.now(clock)
        val existingUser = userRepository.findByEmailIgnoreCase(email)
        val invitationToken = tokenGenerator.generate()

        if (existingUser != null && groupMemberRepository.existsByGroupIdAndUserId(groupId, existingUser.id)) {
            throw ApiException(HttpStatus.CONFLICT, "already_group_member", "This user is already a group member")
        }

        val invite = groupInviteRepository.findByGroupIdAndEmail(groupId, email)
            ?: GroupInviteEntity(
                groupId = groupId,
                email = email,
                token = invitationToken,
                invitedByUserId = actorUserId,
                createdAt = now,
                updatedAt = now,
            )

        invite.invitedByUserId = actorUserId
        invite.token = invitationToken
        invite.updatedAt = now
        invite.status = GroupInviteStatus.PENDING.name
        invite.acceptedByUserId = null
        invite.acceptedAt = null

        val savedInvite = groupInviteRepository.save(invite)
        val group = requireGroup(groupId)
        val inviter = userRepository.findById(actorUserId).orElseThrow()
        val invitationUrl = groupInvitationUrl(savedInvite.token)
        emailOutboxService.queue(
            requestedByUserId = actorUserId,
            recipientEmail = email,
            groupInvite = savedInvite,
            content = emailComposer.groupInvitation(
                inviterName = inviter.displayName,
                groupName = group.name,
                invitationUrl = invitationUrl,
                invitedEmail = email,
            ),
        )
        return assemble(group, actorUserId)
    }

    @Transactional
    fun revokeInvite(groupId: UUID, inviteId: UUID, actorUserId: UUID): GroupRecord {
        requireOwner(groupId, actorUserId)
        val invite = groupInviteRepository.findById(inviteId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, "invite_not_found", "Invitation was not found")
        }
        if (invite.groupId != groupId || invite.status != GroupInviteStatus.PENDING.name) {
            throw ApiException(HttpStatus.NOT_FOUND, "invite_not_found", "Invitation was not found")
        }
        invite.status = GroupInviteStatus.REVOKED.name
        invite.updatedAt = Instant.now(clock)
        groupInviteRepository.save(invite)
        emailOutboxService.cancelQueued(invite.id)
        return assemble(requireGroup(groupId), actorUserId)
    }

    @Transactional
    fun removeMember(groupId: UUID, memberUserId: UUID, actorUserId: UUID): GroupRecord {
        requireOwner(groupId, actorUserId)
        val membership = groupMemberRepository.findByGroupIdAndUserId(groupId, memberUserId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "member_not_found", "Group member was not found")
        if (membership.role == GroupRole.OWNER.name) {
            throw ApiException(HttpStatus.CONFLICT, "owner_cannot_be_removed", "The group owner cannot be removed")
        }
        groupMemberRepository.delete(membership)
        return assemble(requireGroup(groupId), actorUserId)
    }

    private fun requireOwner(groupId: UUID, actorUserId: UUID) {
        val membership = groupMemberRepository.findByGroupIdAndUserId(groupId, actorUserId)
        if (membership?.role != GroupRole.OWNER.name) {
            throw ApiException(HttpStatus.NOT_FOUND, "group_not_found", "Group was not found")
        }
    }

    private fun requireGroup(groupId: UUID): ExpenseGroupEntity =
        groupRepository.findById(groupId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, "group_not_found", "Group was not found")
        }

    private fun normalizeName(name: String): String = name.trim().takeIf { it.isNotEmpty() }
        ?: throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "invalid_group_name", "Group name is required")

    private fun assemble(group: ExpenseGroupEntity, actorUserId: UUID): GroupRecord {
        val memberships = groupMemberRepository.findAllByGroupIdOrderByJoinedAt(group.id)
        val usersById = userRepository.findAllById(memberships.map(GroupMemberEntity::userId))
            .associateBy(UserEntity::id)
        val actorIsOwner = memberships.any { it.userId == actorUserId && it.role == GroupRole.OWNER.name }
        val pendingInvites = if (actorIsOwner) {
            groupInviteRepository.findAllByGroupIdAndStatusOrderByCreatedAt(group.id, GroupInviteStatus.PENDING.name)
        } else {
            emptyList()
        }

        return GroupRecord(
            group = group,
            members = memberships.map { membership ->
                GroupMemberRecord(membership, requireNotNull(usersById[membership.userId]))
            },
            pendingInvites = pendingInvites.map { invite ->
                GroupInviteRecord(
                    invite = invite,
                    inviteUrl = groupInvitationUrl(invite.token),
                    deliveryStatus = emailOutboxService.latestStatus(invite.id) ?: EmailDeliveryStatus.QUEUED,
                )
            },
            actorIsOwner = actorIsOwner,
        )
    }

    private fun groupInvitationUrl(token: String): String = "$frontendUrl/invitations/groups/$token"
}

data class GroupRecord(
    val group: ExpenseGroupEntity,
    val members: List<GroupMemberRecord>,
    val pendingInvites: List<GroupInviteRecord>,
    val actorIsOwner: Boolean,
)

data class GroupInviteRecord(
    val invite: GroupInviteEntity,
    val inviteUrl: String,
    val deliveryStatus: EmailDeliveryStatus,
)

data class GroupMemberRecord(
    val membership: GroupMemberEntity,
    val user: UserEntity,
)
