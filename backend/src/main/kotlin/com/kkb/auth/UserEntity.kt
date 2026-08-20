package com.kkb.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "app_user")
class UserEntity(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "google_subject", nullable = false, unique = true, length = 255)
    var googleSubject: String,

    @Column(nullable = false, unique = true, length = 320)
    var email: String,

    @Column(name = "display_name", nullable = false, length = 255)
    var displayName: String,

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    var avatarUrl: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
