/**
 * =======================================================================
 * STUDIO SINGLE SOURCE OF TRUTH (SSOT) CONFIGURATION
 * =======================================================================
 * NGUYÊN LÝ THIẾT KẾ: BIẾN DÙNG CHUNG (SHARED VARIABLES)
 * 
 * Chỉ cần chỉnh sửa DUY NHẤT file này:
 * 1. CSS Custom Properties (:root variables & Grid Layout) tự động cập nhật
 * 2. TypeScript Constants & Types trong toàn bộ các module tự động đồng bộ
 * 3. Kích thước giao diện (Sidebar, Right Panel, Timeline) tự động co giãn
 * 4. Hệ màu các Track hệ thống (Video, Audio, Subtitle) tự động đổi màu
 * 5. Cấu hình định danh đa nền tảng (Capacitor Android/iOS, Web PWA)
 * =======================================================================
 */

export const STUDIO_CONFIG = {
  // 1. KÍCH THƯỚC BỐ CỤC KHUNG CHÍNH (Layout Dimensions)
  layout: {
    sidebarWidth: "60px",
    sidebarWidthPx: 60,
    rightPanelWidth: "320px",
    rightPanelWidthPx: 320,
    timelineHeight: "250px",
    timelineHeightPx: 250,
  },

  // 2. BẢNG MÀU CHUYÊN NGHIỆP & TRACK HỆ THỐNG (Theme & Track System Colors)
  theme: {
    appBg: "#0b0f19",             // Màu nền tối chuyên nghiệp
    appText: "#f3f4f6",           // Màu chữ sáng tương phản
    trackVideo: "#1e293b",        // Màu sắc riêng Track Video
    trackAudio: "#131224",        // Màu sắc riêng Track Audio
    trackSubtitle: "#1e1b4b",     // Màu sắc riêng Track Subtitle
    brandPrimary: "#e11d48",      // Màu thương hiệu (Rose-600)
    brandSecondary: "#6366f1",    // Màu phụ trợ (Indigo-500)
    headerBg: "#090d17",          // Màu nền thanh Header
    sidebarBg: "#080d1a",         // Màu nền Sidebar bên trái
    rightPanelBg: "#080d19",      // Màu nền Cột AI bên phải
  },

  // 3. ĐỊNH DANH ỨNG DỤNG & ĐA NỀN TẢNG (App Identity & Multi-platform)
  app: {
    id: "com.hendy.vietsubpro",
    name: "Hendy Vietsub Pro - AI Studio",
    shortName: "Vietsub Studio",
    version: "1.0.0",
    description: "AI Studio Pro - Nền tảng biên tập video & tạo phụ đề thông minh đa nền tảng",
    themeColor: "#0b0f19",
    splashBackgroundColor: "#0b0f19",
  },

  // 4. CẤU HÌNH ENGINE AI & MẶC ĐỊNH (AI Engine & Playback Defaults)
  ai: {
    defaultModel: "gemini-3.8-flash",
    targetLanguage: "vi",
    sourceLanguage: "auto",
  },
} as const;

export type StudioConfigType = typeof STUDIO_CONFIG;

/**
 * Tự động đồng bộ các biến CSS :root theo cấu hình STUDIO_CONFIG
 * Đảm bảo mọi thay đổi trong file này lập tức cập nhật CSS và giao diện
 */
export function applyStudioTheme(config: StudioConfigType = STUDIO_CONFIG): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // 1. Kích thước layout CSS Variables
  root.style.setProperty("--sidebar-width", config.layout.sidebarWidth);
  root.style.setProperty("--right-panel-width", config.layout.rightPanelWidth);
  root.style.setProperty("--timeline-height", config.layout.timelineHeight);

  // 2. Màu sắc cơ bản CSS Variables
  root.style.setProperty("--app-bg", config.theme.appBg);
  root.style.setProperty("--app-text", config.theme.appText);
  root.style.setProperty("--header-bg", config.theme.headerBg);
  root.style.setProperty("--sidebar-bg", config.theme.sidebarBg);
  root.style.setProperty("--right-panel-bg", config.theme.rightPanelBg);

  // 3. Biến màu sắc riêng cho từng loại Track hệ thống
  root.style.setProperty("--color-track-video", config.theme.trackVideo);
  root.style.setProperty("--color-track-audio", config.theme.trackAudio);
  root.style.setProperty("--color-track-subtitle", config.theme.trackSubtitle);
}
