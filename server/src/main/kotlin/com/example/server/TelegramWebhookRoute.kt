package com.example.server.routes

import com.example.server.telegram.AdminCommandRouter
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import io.ktor.server.routing.route

fun Route.telegramWebhookRoute(adminCommandRouter: AdminCommandRouter) {
    route("/api/telegram") {
        post("/webhook") {
            val rawJson = call.receiveText()
            runCatching {
                adminCommandRouter.handleUpdateJson(rawJson)
            }.onFailure { e ->
                call.application.environment.log.error("Lỗi xử lý Telegram Webhook", e)
            }
            call.respond(HttpStatusCode.OK)
        }
    }
}
