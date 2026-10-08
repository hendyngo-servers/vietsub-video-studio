package com.example.server.routes

import com.example.server.hub.WebSocketHub
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*

fun Route.hubWebSocketRoutes(hub: WebSocketHub) {
    
    // --- KÊNH 1: Tiến độ xử lý Video theo từng JobID (Dành cho Trang chủ / Homepage) ---
    webSocket("/ws/jobs/{jobId}") {
        val jobId = call.parameters["jobId"]
        if (jobId.isNullOrBlank()) {
            close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Missing jobId parameter"))
            return@webSocket
        }

        val topic = "job_$jobId"
        hub.register(topic, this)

        try {
            // Duy trì kết nối và lắng nghe tín hiệu từ client (nếu có yêu cầu ping/pong)
            for (frame in incoming) {
                // Kênh này chủ yếu là Server -> Client (Push-only). 
                // Nếu client gửi tin nhắn lên, có thể xử lý ở đây nếu cần.
            }
        } catch (e: Exception) {
            // Xử lý ngắt kết nối bất thường
        } finally {
            // Cực kỳ quan trọng: Luôn gọi unregister khi client ngắt kết nối để tránh rò rỉ bộ nhớ
            hub.unregister(topic, this)
        }
    }

    // --- KÊNH 2: Giám sát thông số hệ thống (Dành riêng cho Admin Dashboard) ---
    webSocket("/ws/admin/monitor") {
        // TODO: Có thể bổ sung lớp xác thực Token/Session Admin tại đây để bảo mật kênh này
        
        val topic = "admin_monitor"
        hub.register(topic, this)

        try {
            for (frame in incoming) {
                // Lắng nghe lệnh điều khiển từ trang admin nếu có
            }
        } catch (e: Exception) {
            // Xử lý ngắt kết nối
        } finally {
            hub.unregister(topic, this)
        }
    }
}
