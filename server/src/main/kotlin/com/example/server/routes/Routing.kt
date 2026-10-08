// server/src/main/kotlin/com/example/server/plugins/Routing.kt
package com.example.server.plugins

import com.example.server.hub.WebSocketHub
import com.example.server.routes.hubWebSocketRoutes
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.configureRouting(webSocketHub: WebSocketHub) {
    routing {
        // Đăng ký các WebSocket Hub Routes
        hubWebSocketRoutes(webSocketHub)
        
        // ... Các REST API routes khác (subtitle, render, admin, telegram webhook)
    }
}
