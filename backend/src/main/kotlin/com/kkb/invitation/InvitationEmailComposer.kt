package com.kkb.invitation

import org.springframework.stereotype.Component

@Component
class InvitationEmailComposer {
    fun groupInvitation(
        inviterName: String,
        groupName: String,
        invitationUrl: String,
        invitedEmail: String,
    ): InvitationEmailContent {
        val subject = "$inviterName invited you to $groupName on KKB"
        val text = """
            $inviterName invited you to join “$groupName” on KKB.

            Review the invitation: $invitationUrl

            Sign in with $invitedEmail. The invitation cannot be accepted by a different Google account.
        """.trimIndent()
        val html = emailLayout(
            heading = "You’re invited to a group",
            message = "${escape(inviterName)} invited you to join <strong>${escape(groupName)}</strong> on KKB.",
            actionLabel = "Review invitation",
            actionUrl = invitationUrl,
            note = "Sign in with ${escape(invitedEmail)}. A different Google account cannot accept this invitation.",
        )
        return InvitationEmailContent(subject, text, html)
    }

    fun kkbInvitation(
        inviterName: String,
        invitationUrl: String,
    ): InvitationEmailContent {
        val subject = "$inviterName invited you to KKB"
        val text = """
            $inviterName invited you to KKB, a simple way to track shared expenses in their original currency.

            Join KKB: $invitationUrl

            This invitation creates a KKB account only. It does not add you to a group.
        """.trimIndent()
        val html = emailLayout(
            heading = "You’re invited to KKB",
            message = "${escape(inviterName)} invited you to track shared expenses with KKB.",
            actionLabel = "Join KKB",
            actionUrl = invitationUrl,
            note = "This invitation creates a KKB account only. It does not add you to a group.",
        )
        return InvitationEmailContent(subject, text, html)
    }

    private fun emailLayout(
        heading: String,
        message: String,
        actionLabel: String,
        actionUrl: String,
        note: String,
    ): String = """
        <!doctype html>
        <html lang="en">
          <body style="margin:0;background:#f5efe6;color:#3a3128;font-family:Arial,sans-serif">
            <div style="max-width:560px;margin:0 auto;padding:36px 20px">
              <div style="font-size:28px;font-weight:800;margin-bottom:28px">KKB<span style="color:#c25e3a">.</span></div>
              <div style="background:#fffaf3;border:1px solid rgba(58,49,40,.12);border-radius:18px;padding:28px">
                <h1 style="font-size:24px;line-height:1.2;margin:0 0 12px">${escape(heading)}</h1>
                <p style="font-size:15px;line-height:1.6;margin:0 0 24px">$message</p>
                <a href="${escape(actionUrl)}" style="display:inline-block;background:#c25e3a;color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 20px">${escape(actionLabel)}</a>
                <p style="font-size:12px;line-height:1.5;color:#75685d;margin:24px 0 0">$note</p>
              </div>
            </div>
          </body>
        </html>
    """.trimIndent()

    private fun escape(value: String): String = value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;")
}

data class InvitationEmailContent(
    val subject: String,
    val textBody: String,
    val htmlBody: String,
)
