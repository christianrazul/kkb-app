package com.kkb.currency

import com.kkb.web.ApiException
import org.springframework.http.HttpStatus
import java.math.BigDecimal
import java.math.RoundingMode

enum class SupportedCurrency(
    val fractionDigits: Int,
) {
    PHP(2),
    USD(2),
    EUR(2),
    JPY(0),
    SGD(2),
    ;

    fun toMinorUnits(amount: String): Long {
        val decimal = try {
            BigDecimal(amount)
        } catch (_: NumberFormatException) {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "invalid_amount", "Amount must be a decimal number")
        }

        if (decimal <= BigDecimal.ZERO) {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "invalid_amount", "Amount must be greater than zero")
        }

        val normalized = try {
            decimal.setScale(fractionDigits, RoundingMode.UNNECESSARY)
        } catch (_: ArithmeticException) {
            throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "invalid_amount_scale",
                "$name supports at most $fractionDigits decimal places",
            )
        }

        return try {
            normalized.movePointRight(fractionDigits).longValueExact()
        } catch (_: ArithmeticException) {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "amount_too_large", "Amount is too large")
        }
    }

    fun majorUnits(minorUnits: Long): BigDecimal =
        BigDecimal.valueOf(minorUnits, fractionDigits)

    fun formatMinorUnits(minorUnits: Long): String =
        majorUnits(minorUnits).setScale(fractionDigits).toPlainString()

    companion object {
        fun parse(code: String): SupportedCurrency = entries.firstOrNull { it.name == code }
            ?: throw ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "unsupported_currency",
                "Currency $code is not supported",
            )
    }
}
