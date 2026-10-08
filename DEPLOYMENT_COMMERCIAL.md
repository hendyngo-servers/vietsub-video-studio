# HƯỚNG DẪN TRIỂN KHAI THƯƠNG MẠI (COMMERCIAL PRODUCTION DEPLOYMENT)
## Vietsub Video Studio Pro - Enterprise Edition v2.4.0

Hệ thống dịch thuật & gắn phụ đề video tự động đa nền tảng với tích hợp AI Gemini, Whisper, Telegram Mini App (TMA), và Compose Multiplatform.

---

### 1. Yêu Cầu Môi Trường (System Prerequisites)
- **Node.js**: Phiên bản 20.x trở lên
- **NPM**: Phiên bản 10.x trở lên
- **Docker & Docker Compose**: (Tùy chọn, cho triển khai container hóa)
- **Biến môi trường**:
  - `GEMINI_API_KEY`: Khóa API Google Gemini
  - `NODE_ENV`: `production`
  - `PORT`: `3000`

---

### 2. Quy Trình Build Mã Nguồn Thương Mại (Build Production Bundle)

#### Bước 2.1: Cài đặt dependencies chuẩn xác
```bash
npm ci
```

#### Bước 2.2: Kiểm tra kiểm thử kiểu dữ liệu TypeScript (Zero-Error Check)
```bash
npm run lint
```

#### Bước 2.3: Build gói thương mại tối ưu hóa (Vite Production Build)
```bash
npm run build
```
*Kết quả đầu ra sẽ được lưu vào thư mục `dist/` với service worker PWA, precache assets và các gói vendor tách riêng tối ưu tải trang.*

---

### 3. Phương Thức Triển Khai (Deployment Targets)

#### Cách A: Triển khai Full-Stack với Node.js / VPS
```bash
# Đặt biến môi trường và chạy trực tiếp
export NODE_ENV=production
export PORT=3000
export GEMINI_API_KEY=your_gemini_api_key_here

npm start
```
*Server Express sẽ phục vụ toàn bộ API (`/api/*`), WebSockets và toàn bộ tệp tĩnh từ thư mục `dist/`.*

#### Cách B: Triển khai Container hóa với Docker
```bash
# Build image
docker build -t vietsub-video-studio:v2.4.0 .

# Khởi chạy container với Docker Compose
docker compose up -d
```

#### Cách C: Triển khai Frontend lên Cloudflare Pages
1. Thư mục Build Output: `dist`
2. Lệnh Build: `npm run build`
3. Node Version: `>= 20.0.0`
4. Cấu hình Telegram Webhook URL trỏ về Backend Gateway: `/api/telegram/webhook`

---

### 4. API Endpoints Thương Mại Chính
- `GET /api/health`: Health-check kiểm tra trạng thái máy chủ và kết nối Gemini.
- `GET /api/releases/latest`: Cung cấp danh sách phiên bản tải xuống cho Android (.apk), Windows (.exe), macOS (.dmg) và Linux.
- `POST /api/vietsub/generate`: Nhận diện giọng nói và sinh phụ đề tiếng Việt tự động.
- `POST /api/vietsub/refine`: Hiệu đính, phục hồi dấu tiếng Việt và văn phong điện ảnh bằng AI.
- `POST /api/vietsub/smart-split`: Tách nhịp câu dài thông minh theo nhịp thở.
- `POST /api/vietsub/detect-speakers`: Tự động phân vai giọng nói Nam/Nữ/Già/Trẻ.
- `POST /api/vietsub/tts`: Tạo âm thanh thuyết minh AI với Edge Speech Engine.
- `POST /api/telegram/webhook`: Tiếp nhận webhook tương tác từ Telegram Bot và Telegram Mini App (TMA).
