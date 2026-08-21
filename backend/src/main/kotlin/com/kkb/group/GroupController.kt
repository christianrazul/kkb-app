package com.kkb.group

import com.kkb.auth.AuthenticatedUserResolver
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/groups")
class GroupController(
    private val authenticatedUserResolver: AuthenticatedUserResolver,
    private val groupApplicationService: GroupApplicationService,
) {
    @GetMapping
    fun list(authentication: Authentication?): List<GroupResponse> {
        val actor = authenticatedUserResolver.resolve(authentication)
        return groupApplicationService.list(actor.id).map(GroupRecord::toResponse)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        authentication: Authentication?,
        @Valid @RequestBody request: SaveGroupRequest,
    ): GroupResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return groupApplicationService.create(actor.id, request.name, request.tileColor).toResponse()
    }

    @PatchMapping("/{groupId}")
    fun update(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
        @Valid @RequestBody request: SaveGroupRequest,
    ): GroupResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return groupApplicationService.update(groupId, actor.id, request.name, request.tileColor).toResponse()
    }

    @DeleteMapping("/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
    ) {
        val actor = authenticatedUserResolver.resolve(authentication)
        groupApplicationService.delete(groupId, actor.id)
    }

    @PostMapping("/{groupId}/invites")
    fun invite(
        @PathVariable groupId: UUID,
        authentication: Authentication?,
        @Valid @RequestBody request: InviteGroupMemberRequest,
    ): GroupResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return groupApplicationService.invite(groupId, actor.id, request.email).toResponse()
    }

    @DeleteMapping("/{groupId}/invites/{inviteId}")
    fun revokeInvite(
        @PathVariable groupId: UUID,
        @PathVariable inviteId: UUID,
        authentication: Authentication?,
    ): GroupResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return groupApplicationService.revokeInvite(groupId, inviteId, actor.id).toResponse()
    }

    @DeleteMapping("/{groupId}/members/{memberUserId}")
    fun removeMember(
        @PathVariable groupId: UUID,
        @PathVariable memberUserId: UUID,
        authentication: Authentication?,
    ): GroupResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return groupApplicationService.removeMember(groupId, memberUserId, actor.id).toResponse()
    }
}

data class SaveGroupRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val name: String,

    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
    val tileColor: String,
)

data class InviteGroupMemberRequest(
    @field:NotBlank
    @field:Email
    @field:Size(max = 320)
    val email: String,
)

data class GroupResponse(
    val id: UUID,
    val name: String,
    val tileColor: String,
    val owner: Boolean,
    val members: List<GroupMemberResponse>,
    val pendingInvites: List<GroupInviteResponse>,
)

data class GroupMemberResponse(
    val userId: UUID,
    val displayName: String,
    val email: String,
    val avatarUrl: String?,
    val role: String,
)

data class GroupInviteResponse(
    val id: UUID,
    val email: String,
    val createdAt: Instant,
    val inviteUrl: String,
    val deliveryStatus: String,
)

private fun GroupRecord.toResponse() = GroupResponse(
    id = group.id,
    name = group.name,
    tileColor = group.tileColor,
    owner = actorIsOwner,
    members = members.map { record ->
        GroupMemberResponse(
            userId = record.user.id,
            displayName = record.user.displayName,
            email = record.user.email,
            avatarUrl = record.user.avatarUrl,
            role = record.membership.role,
        )
    },
    pendingInvites = pendingInvites.map { invite ->
        GroupInviteResponse(
            id = invite.invite.id,
            email = invite.invite.email,
            createdAt = invite.invite.createdAt,
            inviteUrl = invite.inviteUrl,
            deliveryStatus = invite.deliveryStatus.name,
        )
    },
)
