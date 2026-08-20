package com.kkb

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class KkbBackendApplication

fun main(args: Array<String>) {
    runApplication<KkbBackendApplication>(*args)
}
