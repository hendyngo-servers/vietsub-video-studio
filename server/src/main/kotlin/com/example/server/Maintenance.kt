package com.example.server.plugins

import com.example.server.services.TelegramAdminService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.createRouteScopedPlugin
import io.ktor.server.response.respondText
import org.koin.ktor.ext.inject

val MaintenancePlugin = createRouteScopedPlugin(name = "MaintenancePlugin") {
    onCall { call ->
        val adminService by call.inject<TelegramAdminService>()
        val path = call.request.local.uri

        if (adminService.isMaintenanceMode() && !path.startsWith("/api/admin")) {
            call.respondText(
                text = """{"error": "SYSTEM_UNDER_MAINTENANCE", "message": "Hệ thống đang bảo trì. Vui lòng quay lại sau."}""",
                status = HttpStatusCode.ServiceUnavailable,
                contentType = io.ktor.http.ContentType.Application.Json
            )
        }
    }
}
