package com.kkb.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface UserRepository : JpaRepository<UserEntity, UUID> {
    fun findByGoogleSubject(googleSubject: String): UserEntity?
    fun findByEmailIgnoreCase(email: String): UserEntity?
}
