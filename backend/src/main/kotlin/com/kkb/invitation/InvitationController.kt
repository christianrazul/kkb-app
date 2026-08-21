package com.kkb.invitation

import com.kkb.auth.AuthenticatedUserResolver
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/invitations")
class InvitationController(
    private val authenticatedUserResolver: AuthenticatedUserResolver,
    private val invitationApplicationService: InvitationApplicationService,
) {
    @GetMapping("/groups/{token}")
    fun groupInvitation(@PathVariable token: String): GroupInvitationResponse =
        invitationApplicationService.groupInvitation(token).toResponse()

    @PostMapping("/groups/{token}/accept")
    fun acceptGroupInvitation(
        @PathVariable token: String,
        authentication: Authentication?,
    ): GroupInvitationDecisionResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return invitationApplicationService.acceptGroupInvitation(token, actor.id).toResponse()
    }

    @PostMapping("/groups/{token}/decline")
    fun declineGroupInvitation(
        @PathVariable token: String,
        authentication: Authentication?,
    ): GroupInvitationDecisionResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return invitationApplicationService.declineGroupInvitation(token, actor.id).toResponse()
    }

    @PostMapping("/kkb")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun inviteToKkb(
        authentication: Authentication?,
        @Valid @RequestBody request: InviteToKkbRequest,
    ): KkbInvitationResponse {
        val actor = authenticatedUserResolver.resolve(authentication)
        return invitationApplicationService.inviteToKkb(actor.id, request.email).toResponse()
    }
}

data class InviteToKkbRequest(
    @field:NotBlank
    @field:Email
    @field:Size(max = 320)
    val email: String,
)

data class GroupInvitationResponse(
    val groupId: String,
    val groupName: String,
    val inviterName: String,
    val invitedEmail: String,
    val status: String,
)

data class GroupInvitationDecisionResponse(
    val groupId: String,
    val status: String,
)

data class KkbInvitationResponse(
    val inviteUrl: String,
    val deliveryStatus: String,
)

private fun GroupInvitationRecord.toResponse() = GroupInvitationResponse(
    groupId = groupId.toString(),
    groupName = groupName,
    inviterName = inviterName,
    invitedEmail = invitedEmail,
    status = status,
)

private fun GroupInvitationDecision.toResponse() = GroupInvitationDecisionResponse(
    groupId = groupId.toString(),
    status = status,
)

private fun KkbInvitationRecord.toResponse() = KkbInvitationResponse(
    inviteUrl = inviteUrl,
    deliveryStatus = deliveryStatus.name,
)
