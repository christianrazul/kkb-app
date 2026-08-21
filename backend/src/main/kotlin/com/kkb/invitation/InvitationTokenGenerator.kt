package com.kkb.invitation

import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.Base64

@Component
class InvitationTokenGenerator {
    private val secureRandom = SecureRandom()

    fun generate(): String {
        val bytes = ByteArray(32)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }
}
