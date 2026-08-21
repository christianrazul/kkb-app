package com.kkb.invitation

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class InvitationEmailComposerTests {
    private val composer = InvitationEmailComposer()

    @Test
    fun `escapes user-controlled values in group invitation html`() {
        val email = composer.groupInvitation(
            inviterName = "Chan <script>",
            groupName = "Trip & Food",
            invitationUrl = "https://kkb-app.space/invitations/groups/example",
            invitedEmail = "friend@example.com",
        )

        assertTrue(email.htmlBody.contains("Chan &lt;script&gt;"))
        assertTrue(email.htmlBody.contains("Trip &amp; Food"))
        assertFalse(email.htmlBody.contains("Chan <script>"))
    }

    @Test
    fun `kkb invitation states that it grants no group access`() {
        val email = composer.kkbInvitation("Chan", "https://kkb-app.space/invite/kkb")

        assertTrue(email.textBody.contains("does not add you to a group"))
    }
}
