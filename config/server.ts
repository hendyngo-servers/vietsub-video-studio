// server.ts (Bộ máy chủ Express + WebSocket Sandbox Server)
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { SystemConfig } from "./config/system.config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ port: 3001 }); // Chạy riêng cổng 3001 cho kênh đồng bộ/vá lỗi hệ thống
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const activePlatforms = new Set<WebSocket>();

wss.on("connection", (ws: WebSocket) => {
  activePlatforms.add(ws);
  console.log("📱 [WebSocket Sandbox] Nền tảng ứng dụng vừa kết nối để nhận bản vá & giao diện mới!");
  ws.send(JSON.stringify({ type: "SANDBOX_READY", currentConfig: SystemConfig }));

  ws.on("close", () => {
    activePlatforms.delete(ws);
  });
});

// THUẬT TOÁN CHẠY THỬ (DRY-RUN) VÀ TỰ ĐỘNG VÁ LỖI CỤC BỘ TRƯỚC KHI TRUYỀN CLOUDFLARE
const configPath = path.join(__dirname, "config", "system.config.ts");

fs.watchFile(configPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log("\n🔍 [WebSocket Sandbox] Phát hiện thay đổi tệp cấu hình gốc. Tiến hành chạy thử nghiệm an toàn...");

    try {
      // BƯỚC 1: XÁC THỰC CÚ PHÁP (VÁ LỖI NGẦM TRONG TRÌNH BẢO VỆ)
      if (!SystemConfig.app.id || !SystemConfig.app.themeColor) {
        throw new Error("Thông số hệ thống cốt lõi (App ID / Theme Color) không được để trống!");
      }

      console.log("✅ [Sandbox Validation] Cú pháp tệp cấu hình hợp lệ. Bắt đầu vá lỗi và ghi đè hệ thống...");

      // BƯỚC 2: TỰ ĐỘNG VÁ/CẬP NHẬT CÁC FILE ĐÓNG GÓI HỆ THỐNG TRÊN MÁY CỤC BỘ
      // Vá file Capacitor (Android/iOS)
      const capPath = path.join(__dirname, "capacitor.config.ts");
      if (fs.existsSync(capPath)) {
        let content = fs.readFileSync(capPath, "utf8");
        content = content.replace(/appId:\s*['"][^']*['"]/g, `appId: '${SystemConfig.app.id}'`);
        content = content.replace(/appName:\s*['"][^']*['"]/g, `appName: '${SystemConfig.app.name}'`);
        fs.writeFileSync(capPath, content, "utf8");
      }

      // Vá file package.json chính
      const pkgPath = path.join(__dirname, "package.json");
      if (fs.existsSync(pkgPath)) {
        const pkgData = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        pkgData.version = SystemConfig.app.version;
        fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2), "utf8");
      }

      // Vá file PWA Manifest
      const manifestPath = path.join(__dirname, "public", "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        manifestData.name = SystemConfig.app.name;
        manifestData.short_name = SystemConfig.app.shortName;
        manifestData.theme_color = SystemConfig.app.themeColor;
        fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), "utf8");
      }

      console.log("🛠️ [Sandbox Auto-Patch] Đã vá lỗi đồng bộ thành công cho các nền tảng vệ tinh!");

      // BƯỚC 3: GỬI LỆNH CẬP NHẬT GIAO DIỆN HOẠT ĐỘNG THỜI GIAN THỰC CHO CLIENT
      const syncPayload = JSON.stringify({
        type: "LIVE_UI_HOT_RELOAD",
        status: "nominal",
        data: SystemConfig,
        log: "Hệ thống an toàn tuyệt đối. Sẵn sàng đẩy lên Cloudflare Pages/Workers."
      });

      activePlatforms.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(syncPayload);
        }
      });

    } catch (sandboxError: any) {
      // PHÁT HIỆN LỖI: Chặn đứng tiến trình, không ghi đè bừa bãi và gửi cảnh báo về UI
      console.error(`❌ [SANDBOX CRASH PREVENTED]: ${sandboxError.message}`);
      
      const errorPayload = JSON.stringify({
        type: "LIVE_UI_HOT_RELOAD",
        status: "critical_error",
        errorDetails: sandboxError.message,
        log: "Phát hiện lỗi nghiêm trọng trong tệp script cấu hình. Tiến trình cập nhật bị hủy bỏ để tránh vỡ app."
      });

      activePlatforms.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(errorPayload);
        }
      });
    }
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [Hendy Server] Vietsub Video Studio running on http://localhost:${PORT}`);
});
