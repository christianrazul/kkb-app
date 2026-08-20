package com.kkb.auth

import com.kkb.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.stereotype.Component

@Component
class AuthenticatedUserResolver(
    private val userRepository: UserRepository,
) {
    fun resolve(authentication: Authentication?): UserEntity {
        val principal = authentication?.principal as? OidcUser
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "authentication_required", "Authentication is required")
        val subject = principal.subject
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "invalid_session", "The authenticated session is invalid")

        return userRepository.findByGoogleSubject(subject)
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "user_not_provisioned", "The authenticated user is not provisioned")
    }
}
