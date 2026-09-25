// src/App.tsx (Tích hợp WebSocket Client nhận tín hiệu vá lỗi tự động)
import React, { useEffect, useState } from "react";

export const App: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<{ status: string; log: string }>({
    status: " nominal",
    log: "Hệ thống đang hoạt động ổn định."
  });

  useEffect(() => {
    // Kết nối trực tiếp vào trạm kiểm định Sandbox ngầm của Server cổng 3001
    const socket = new WebSocket("ws://localhost:3001");

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      if (payload.type === "LIVE_UI_HOT_RELOAD" || payload.type === "SANDBOX_READY") {
        const configData = payload.data || payload.currentConfig;
        if (configData) {
          setConfig(configData);
          // Đồng bộ giao diện runtime ngay lập tức bằng việc nạp CSS Variables
          document.documentElement.style.setProperty('--theme-color', configData.app.themeColor);
          document.documentElement.style.setProperty('--accent-color', configData.app.accentColor);
          document.title = configData.app.name;
        }

        if (payload.status) {
          setSystemStatus({
            status: payload.status,
            log: payload.status === "critical_error" ? `⚠️ Lỗi cấu hình: ${payload.errorDetails}` : payload.log
          });
        }
      }
    };

    socket.onclose = () => {
      console.log("🔌 [WebSocket Client] Mất kết nối tới máy chủ kiểm định Sandbox.");
    };

    return () => socket.close();
  }, []);

  return (
    <div style={{ backgroundColor: config?.app?.themeColor || "#0b0f19", minHeight: "100vh", color: "#fff" }}>
      {/* Khung hiển thị Trạng thái Rà soát Hệ thống Hoạt động thời gian thực */}
      <div style={{ background: systemStatus.status === "critical_error" ? "#7f1d1d" : "#1e1b4b", padding: "8px", textCenter: "center", fontSize: "12px" }}>
        <span>📊 <strong>Trạng thái Sandbox:</strong> {systemStatus.log}</span>
      </div>
      
      {/* Phần Giao diện ứng dụng làm Vietsub Video Studio Pro AI của bạn bên dưới... */}
      <h1 style={{ color: config?.app?.accentColor || "#a855f7" }}>{config?.app?.name || "Hendy Vietsub Studio"}</h1>
    </div>
  );
};
export default App;
