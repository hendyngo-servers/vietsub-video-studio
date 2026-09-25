# Vietsub Video Studio

Hệ thống tạo phụ đề, dịch thuật và lồng tiếng AI sử dụng mô hình Gemini và Cloudflare Workers.

## Cấu trúc dự án
- `backend`: Node.js Express server (Xử lý Audio/Video, TTS tự tổng hợp). Cổng 3000.
- `worker`: Cloudflare Worker (Xử lý Text, tạo kịch bản, dịch thuật JSON).
- `frontend`: Giao diện ReactJS/Vite.

## Hướng dẫn cài đặt
1. Chạy lệnh `npm install` tại thư mục gốc để cài đặt toàn bộ gói cho monorepo.
2. Sao chép file `backend/.env.example` thành `backend/.env` và điền `GEMINI_API_KEY`.
3. Chạy `npm run dev:all` để khởi động toàn bộ hệ thống.
