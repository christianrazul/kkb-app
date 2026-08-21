package com.kkb.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component

@Component
class GoogleAuthenticationSuccessHandler(
    private val googleUserService: GoogleUserService,
    @Value("\${app.frontend-url}") frontendUrl: String,
) : AuthenticationSuccessHandler {
    private val frontendUrl = frontendUrl.trimEnd('/')

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication,
    ) {
        val principal = authentication.principal as? OidcUser
            ?: error("Google authentication did not return an OpenID Connect user")
        val user = googleUserService.provision(principal)

        request.session.setAttribute(AUTHENTICATED_USER_ID, user.id)
        val returnTo = request.session.getAttribute(RETURN_TO_ATTRIBUTE) as? String
        request.session.removeAttribute(RETURN_TO_ATTRIBUTE)
        response.sendRedirect("$frontendUrl${returnTo ?: "/dashboard"}")
    }

    companion object {
        const val AUTHENTICATED_USER_ID = "KKB_AUTHENTICATED_USER_ID"
        const val RETURN_TO_ATTRIBUTE = "KKB_AUTH_RETURN_TO"
    }
}
