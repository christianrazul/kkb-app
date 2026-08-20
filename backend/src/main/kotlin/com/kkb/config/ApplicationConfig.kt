package com.kkb.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import java.time.Clock
import java.time.ZoneId

@Configuration
@EnableScheduling
class ApplicationConfig {
    @Bean
    fun applicationClock(@Value("\${app.time-zone}") timeZone: String): Clock =
        Clock.system(ZoneId.of(timeZone))
}
