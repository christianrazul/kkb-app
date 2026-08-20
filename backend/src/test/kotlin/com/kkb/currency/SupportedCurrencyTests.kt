package com.kkb.currency

import com.kkb.web.ApiException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class SupportedCurrencyTests {
    @Test
    fun `converts decimal strings to exact minor units`() {
        assertEquals(1_001, SupportedCurrency.USD.toMinorUnits("10.01"))
        assertEquals(500, SupportedCurrency.JPY.toMinorUnits("500"))
    }

    @Test
    fun `rejects fractional yen`() {
        val exception = assertThrows(ApiException::class.java) {
            SupportedCurrency.JPY.toMinorUnits("10.50")
        }

        assertEquals("invalid_amount_scale", exception.code)
    }
}
