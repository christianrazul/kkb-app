package com.kkb.web

import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApiException(exception: ApiException): ProblemDetail =
        ProblemDetail.forStatusAndDetail(exception.status, exception.message).apply {
            title = exception.status.reasonPhrase
            setProperty("code", exception.code)
        }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(exception: MethodArgumentNotValidException): ProblemDetail =
        ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed").apply {
            title = HttpStatus.BAD_REQUEST.reasonPhrase
            setProperty("code", "validation_failed")
            setProperty(
                "fields",
                exception.bindingResult.fieldErrors.associate { error ->
                    error.field to (error.defaultMessage ?: "Invalid value")
                },
            )
        }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(exception: ResponseStatusException): ProblemDetail =
        ProblemDetail.forStatusAndDetail(exception.statusCode, exception.reason ?: "Request failed")
}
