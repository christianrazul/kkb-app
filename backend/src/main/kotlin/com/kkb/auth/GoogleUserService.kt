package com.kkb.auth

import com.kkb.group.GroupInvitationAcceptanceService
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class GoogleUserService(
    private val userRepository: UserRepository,
    private val groupInvitationAcceptanceService: GroupInvitationAcceptanceService,
    private val userLoginHooks: List<UserLoginHook>,
) {
    @Transactional
    fun provision(principal: OidcUser): UserEntity {
        val googleSubject = requireNotNull(principal.subject) { "Google did not provide a subject identifier" }
        val email = requireNotNull(principal.email) { "Google did not provide an email address" }
        val displayName = principal.fullName?.takeIf(String::isNotBlank) ?: email.substringBefore('@')
        val now = Instant.now()
        val existingUser = userRepository.findByGoogleSubject(googleSubject)

        if (existingUser != null) {
            existingUser.email = email
            existingUser.displayName = displayName
            existingUser.avatarUrl = principal.picture
            existingUser.updatedAt = now
            val savedUser = userRepository.save(existingUser)
            groupInvitationAcceptanceService.acceptPendingInvitations(savedUser)
            userLoginHooks.forEach { hook -> hook.afterLogin(savedUser) }
            return savedUser
        }

        val savedUser = userRepository.save(
            UserEntity(
                googleSubject = googleSubject,
                email = email,
                displayName = displayName,
                avatarUrl = principal.picture,
                createdAt = now,
                updatedAt = now,
            ),
        )
        groupInvitationAcceptanceService.acceptPendingInvitations(savedUser)
        userLoginHooks.forEach { hook -> hook.afterLogin(savedUser) }
        return savedUser
    }
}

interface UserLoginHook {
    fun afterLogin(user: UserEntity)
}
