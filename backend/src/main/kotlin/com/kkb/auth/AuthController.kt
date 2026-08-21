package com.kkb.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.security.web.csrf.CsrfToken
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val userRepository: UserRepository,
) {
    @GetMapping("/google")
    fun googleLogin(
        @RequestParam(required = false) returnTo: String?,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ) {
        returnTo?.takeIf(::isAllowedReturnPath)?.let { path ->
            request.session.setAttribute(GoogleAuthenticationSuccessHandler.RETURN_TO_ATTRIBUTE, path)
        }
        response.sendRedirect("/oauth2/authorization/google")
    }

    @GetMapping("/session")
    fun session(authentication: Authentication?): AuthenticatedUserResponse {
        val principal = authentication?.principal as? OidcUser
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        val googleSubject = principal.subject ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        val user = userRepository.findByGoogleSubject(googleSubject)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)

        return AuthenticatedUserResponse(
            id = user.id,
            email = user.email,
            displayName = user.displayName,
            avatarUrl = user.avatarUrl,
        )
    }

    @GetMapping("/csrf")
    fun csrf(csrfToken: CsrfToken) = CsrfTokenResponse(
        headerName = csrfToken.headerName,
        parameterName = csrfToken.parameterName,
        token = csrfToken.token,
    )
}

private fun isAllowedReturnPath(path: String): Boolean =
    path == "/dashboard" ||
        path == "/invite/kkb" ||
        GROUP_INVITATION_PATH.matches(path)

private val GROUP_INVITATION_PATH = Regex("^/invitations/groups/[A-Za-z0-9_-]{20,64}$")

data class AuthenticatedUserResponse(
    val id: UUID,
    val email: String,
    val displayName: String,
    val avatarUrl: String?,
)

data class CsrfTokenResponse(
    val headerName: String,
    val parameterName: String,
    val token: String,
)
