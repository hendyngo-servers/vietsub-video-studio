package com.example.core.util

import com.soywiz.krypto.HMAC

object TelegramAuthValidator {
    fun validateInitData(initData: String, botToken: String): Boolean {
        if (initData.isBlank()) return false
        
        val parsedParams = initData.split("&")
            .mapNotNull {
                val parts = it.split("=", limit = 2)
                if (parts.size == 2) parts[0] to parts[1] else null
            }
            .toMap()

        val hash = parsedParams["hash"] ?: return false
        
        val dataCheckString = parsedParams.filterKeys { it != "hash" }
            .toList()
            .sortedBy { it.first }
            .joinToString("\n") { "${it.first}=${it.second}" }

        val secretKey = HMAC.hmacSHA256("WebAppData".encodeToByteArray(), botToken.encodeToByteArray()).bytes
        val calculatedHash = HMAC.hmacSHA256(secretKey, dataCheckString.encodeToByteArray()).hex.lowercase()

        return calculatedHash == hash.lowercase()
    }
}
