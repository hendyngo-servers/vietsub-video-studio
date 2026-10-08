import React, { useState, useEffect } from "react";
import {
  X,
  Network,
  Cpu,
  Server,
  Smartphone,
  Globe,
  Bot,
  Layers,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Terminal,
  Activity,
  GitBranch,
  ShieldCheck,
  Zap,
  ExternalLink,
  Laptop,
  Apple,
  Play,
  Share2,
} from "lucide-react";

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (message: string, type?: "info" | "success" | "error") => void;
}

const FULL_ARCHITECTURE_DIAGRAM = `┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              [ USER & CLIENT TIER ]                                    │
 ├──────────────────────────────┬─────────────────────────────┬───────────────────────────┤
 │ Telegram App User            │ Web / Wasm Client           │ Native Clients            │
 │ (Tương tác Mini App / TMA)   │ (Hosted on Cloudflare Pages)│ - AndroidApp (ExoPlayer)  │
 │                              │                             │ - iOSApp (AVKit AVPlayer) │
 │                              │                             │ - DesktopApp (JVM/Native) │
 └──────────────┬───────────────┴──────────────┬──────────────┴─────────────┬─────────────┘
                │                              │                            │
                │                              ▼                            ▼
                │               +───────────────────────────+    +────────────────────────+
                │               | COMPOSE UI MULTIPLATFORM  |    | CI/CD: GitHub Actions  |
                │               |        (:composeApp)      |    | - Build JS/Wasm        |
                │               +──────────────┬────────────+    | - Deploy Cloudflare    |
                │                              │                 | - Auto Telegram Webhook|
                │                              ▼                 +────────────────────────+
                │               +───────────────────────────+
                │               |    KMP CORE LAYER         |
                │               |         (:shared)         |
                │               +──────────────┬────────────+
                │                              │
                ▼                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      [ API GATEWAY / KTOR BACKEND (:server) ]                          │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ • Infrastructure Plugins: Netty Server, CORS, WebSockets, Auth/Security, JSON          │
 │ • Route Handlers: SubtitleRoutes, RenderRoutes, AdminRoutes, TelegramWebhookRoute      │
 │ • Telegram Bot Handlers: AdminCommandRouter, FeatureToggleHandler, MaintenanceHandler, ProcessHandler │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │                              INTERNAL MICRO-SERVICES                                   │
 │   ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────┐ │
 │   │      AI ENGINE          │  │    MEDIA PROCESSOR      │  │ SYSTEM & TELEGRAM OP   │ │
 │   │ - WhisperService        │  │ - FFmpegService         │  │ - SystemMonitorService │ │
 │   │   (OpenAI Speech-2-Text)│  │   (CLI Wrapper hardsub, │  │ - TelegramBotService & │ │
 │   │ - AiService             │  │    Kill Job process)    │  │   AdminService         │ │
 │   │   (Gemini Translation)  │  │                         │  │ - FeatureFlagService   │ │
 │   └───────────┬─────────────┘  └───────────┬─────────────┘  └───────────┬────────────┘ │
 └───────────────┼────────────────────────────┼────────────────────────────┼──────────────┘
                 │                            │                            │
                 ▼                            ▼                            ▼
 ┌───────────────────────────┬─────────────────────────────┬──────────────────────────────┐
 │    EXTERNAL AI APIs       │       LOCAL WORKERS         │   TELEGRAM INFRASTRUCTURE    │
 │ - OpenAI API (Audio->SRT) │ - FFmpeg / FFprobe          │ - Telegram Bot API Messaging │
 │ - Google Gemini API (NLP) │ - File System I/O (Storage) │ - Webhook Delivery System    │
 │                           │                             │ - TMA Auth System (HMAC)     │
 └───────────────────────────┴─────────────────────────────┴──────────────────────────────┘

LUỒNG CHUYỂN HƯỚNG VÀ TẢI ỨNG DỤNG (ROUTING & DOWNLOAD FLOWS)
[ WEB TRANG CHỦ (Landing Page) ]
   ├── (1) Tự động detect OS người dùng ──> Hiển thị nút Tải App tối ưu tương ứng (.apk / .exe / .dmg)
   ├── (2) Nút "Mở Telegram Bot" ────────> Chuyển hướng tới: t.me/VietsubBot?start=landing_page
   └── (3) Nút "Trải nghiệm trên Web" ────> Khởi chạy trực tiếp Web Application
             │
             ├─────────────────────────────────────────────────────┐
             v                                                     v
 [ TELEGRAM BOT (Chat Interface) ]                       [ KTOR BACKEND (Server API) ]
   ├── Nhận lệnh /start hoặc /app                          ├── GET /api/releases/latest (Cho Web)
   └── Phản hồi Inline Keyboard:                           └── POST /api/telegram/webhook (Xử lý Bot)
         ├── [🚀 Mở Mini App Dịch AI] ───┐
         └── [📥 Tải App Đa Nền Tảng] ──┼────────┐
         └──────────────────────────────┘        │
                                                 v
 [ TELEGRAM MINI APP (TMA - Wasm) ] <────────────┘
   └── Tải trực tiếp Video, Biên tập Subtitle, Render Hardsub ngay lập tức bên trong Telegram`;

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<"visual" | "routing-flow" | "breakdown" | "raw">("visual");
  const [copied, setCopied] = useState(false);
  const [detectedOs, setDetectedOs] = useState<{ name: string; ext: string; icon: string }>({
    name: "Web Browser",
    ext: "PWA / Web",
    icon: "globe",
  });
  const [simulatedChatBotMsg, setSimulatedChatBotMsg] = useState<string>(
    "👋 Chào mừng bạn đến với Vietsub Bot! Hãy chọn tính năng bên dưới để bắt đầu:"
  );

  useEffect(() => {
    // Detect Client OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes("android")) {
      setDetectedOs({ name: "Android", ext: ".apk (ExoPlayer)", icon: "smartphone" });
    } else if (userAgent.includes("win")) {
      setDetectedOs({ name: "Windows", ext: ".exe (Setup)", icon: "laptop" });
    } else if (userAgent.includes("mac") || userAgent.includes("iphone") || userAgent.includes("ipad")) {
      setDetectedOs({ name: "macOS / iOS", ext: ".dmg / App Store", icon: "apple" });
    } else if (userAgent.includes("linux")) {
      setDetectedOs({ name: "Linux", ext: ".AppImage", icon: "laptop" });
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(FULL_ARCHITECTURE_DIAGRAM);
    setCopied(true);
    onNotify?.("Đã sao chép toàn bộ sơ đồ kiến trúc & luồng điều hướng vào clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([FULL_ARCHITECTURE_DIAGRAM], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vietsub-bot-architecture-and-routing.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify?.("Đã tải xuống tệp sơ đồ kiến trúc (.txt)!", "success");
  };

  const handleOpenTelegramBot = () => {
    window.open("https://t.me/VietsubBot?start=landing_page", "_blank", "noopener,noreferrer");
    onNotify?.("Đang chuyển hướng tới t.me/VietsubBot?start=landing_page", "info");
  };

  const handleDownloadOptimizedApp = () => {
    onNotify?.(`Bắt đầu tải bản cài đặt tối ưu cho ${detectedOs.name} (${detectedOs.ext})`, "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col glass-panel rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Kiến Trúc Hệ Thống & Luồng Tải Vietsub Bot
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Compose Multiplatform + Ktor + Telegram TMA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sơ đồ phân tầng toàn diện: Client Tier, Backend API Gateway, External AI, CI/CD và Routing & Download Flow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRaw}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
              title="Sao chép sơ đồ"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Sao chép</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
              title="Tải xuống tệp văn bản"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải về</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="px-5 py-2.5 border-b border-white/[0.06] bg-black/30 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs shrink-0">
            <button
              onClick={() => setActiveTab("visual")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === "visual"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sơ Đồ Phân Tầng
            </button>
            <button
              onClick={() => setActiveTab("routing-flow")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "routing-flow"
                  ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              Luồng Tải & Chuyển Hướng (Routing)
            </button>
            <button
              onClick={() => setActiveTab("breakdown")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === "breakdown"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Phân Rã Chi Tiết
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                activeTab === "raw"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Sơ Đồ Gốc (Unicode)
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden lg:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hệ thống Vietsub Bot v2.4 sẵn sàng đa nền tảng</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: SƠ ĐỒ PHÂN TẦNG */}
          {activeTab === "visual" && (
            <div className="space-y-6">
              {/* TIER 1: USER / CLIENT TIER */}
              <div className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-blue-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                      USER & CLIENT TIER
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                    Telegram Mini App · Web Wasm · Native
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                      <Bot className="w-4 h-4" /> Telegram App User
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Tương tác Mini App / TMA trực tiếp ngay trong ứng dụng Telegram.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <Globe className="w-4 h-4" /> Web / Wasm Client
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Hosted trên Cloudflare Pages, hiển thị Canvas video & Timeline đa kênh.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                      <Laptop className="w-4 h-4" /> Native Clients
                    </div>
                    <p className="text-[11px] text-slate-300">
                      • AndroidApp (ExoPlayer)<br />
                      • iOSApp (AVKit AVPlayer)<br />
                      • DesktopApp (JVM/Native)
                    </p>
                  </div>
                </div>

                {/* Compose Multiplatform & CI/CD */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
                  <div className="lg:col-span-2 p-3.5 rounded-xl bg-slate-900/80 border border-blue-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                      <span>COMPOSE UI MULTIPLATFORM (:composeApp)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Koin DI · Shared UI</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                        <strong className="text-white">Player</strong>
                        <div className="text-[10px] text-slate-400">Video Playback & Sync</div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                        <strong className="text-white">Timeline Editor</strong>
                        <div className="text-[10px] text-slate-400">SmartMergeEngine AI</div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                        <strong className="text-white">Admin Dashboard</strong>
                        <div className="text-[10px] text-slate-400">Server Control</div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                        <strong className="text-white">Maintenance</strong>
                        <div className="text-[10px] text-slate-400">System Lockout</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                      <GitBranch className="w-4 h-4" /> CI/CD: GitHub Actions
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1">
                      <li>• Build JS/Wasm (:wasmJs)</li>
                      <li>• Deploy Cloudflare Pages</li>
                      <li>• Auto Set Telegram Webhook</li>
                    </ul>
                  </div>
                </div>

                {/* KMP Core Layer */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>KMP CORE LAYER (:shared)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Cross-platform Core</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                      <strong className="text-amber-200">Data Models:</strong>
                      <div className="text-slate-400">SubtitleItem, VideoMeta, ServerStatus</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                      <strong className="text-amber-200">Utils:</strong>
                      <div className="text-slate-400">SrtFormatter, TelegramAuthValidator (HMAC)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                      <strong className="text-amber-200">Clients & Repos:</strong>
                      <div className="text-slate-400">KtorEngine, SubtitleApiClient, Repositories</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER 2: API GATEWAY & KTOR BACKEND (:server) */}
              <div className="glass-card rounded-2xl p-5 border border-indigo-500/30 bg-indigo-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                      API GATEWAY / KTOR BACKEND (:server)
                    </h3>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                    Netty Server · WebSockets · Auth/Security · JSON
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                    <strong className="text-xs text-indigo-300 block">Route Handlers</strong>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• <strong>SubtitleRoutes:</strong> Bóc tách âm thanh, nhận diện lời thoại & dịch</li>
                      <li>• <strong>RenderRoutes:</strong> Burn Hardsub video thành phẩm</li>
                      <li>• <strong>AdminRoutes:</strong> Health check & Feature Flags</li>
                      <li>• <strong>TelegramWebhookRoute:</strong> Xử lý webhook bot</li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                    <strong className="text-xs text-indigo-300 block">Telegram Bot Handlers</strong>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• <strong>AdminCommandRouter:</strong> Điều phối lệnh /start, /admin</li>
                      <li>• <strong>FeatureToggleHandler:</strong> Bật/tắt tính năng động</li>
                      <li>• <strong>MaintenanceHandler:</strong> Chế độ bảo trì hệ thống</li>
                      <li>• <strong>ProcessHandler:</strong> Quản lý tiến trình render</li>
                    </ul>
                  </div>
                </div>

                {/* Internal Micro-Services */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    INTERNAL MICRO-SERVICES (Business Logic)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                        <Cpu className="w-4 h-4" /> AI ENGINE
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        • WhisperService (OpenAI Speech-2-Text)<br />
                        • AiService (Gemini Translation)
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                        <Activity className="w-4 h-4" /> MEDIA PROCESSOR
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        • FFmpegService (CLI Wrapper hardsub, kill job process)
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                        <ShieldCheck className="w-4 h-4" /> SYSTEM & TELEGRAM OP
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        • SystemMonitorService (RAM, CPU, Queue)<br />
                        • TelegramBotService & AdminService<br />
                        • FeatureFlagService (Dynamic Toggle)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER 3: EXTERNAL INFRASTRUCTURE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-4 border border-rose-500/20 bg-rose-950/10">
                  <div className="flex items-center gap-2 mb-2 text-rose-300 font-bold text-xs uppercase">
                    <Cpu className="w-4 h-4" /> EXTERNAL AI APIs
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• <strong>OpenAI API:</strong> Audio -&gt; SRT</li>
                    <li>• <strong>Google Gemini API:</strong> Contextual NLP</li>
                  </ul>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-emerald-950/10">
                  <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-xs uppercase">
                    <Server className="w-4 h-4" /> LOCAL WORKERS
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• <strong>FFmpeg / FFprobe:</strong> Audio/Video CLI</li>
                    <li>• <strong>File System I/O:</strong> Temp Storage & Render</li>
                  </ul>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-sky-500/20 bg-sky-950/10">
                  <div className="flex items-center gap-2 mb-2 text-sky-300 font-bold text-xs uppercase">
                    <Bot className="w-4 h-4" /> TELEGRAM INFRASTRUCTURE
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• <strong>Telegram Bot API:</strong> Messaging & Cmds</li>
                    <li>• <strong>Webhook Delivery System:</strong> Real-time Events</li>
                    <li>• <strong>TMA Auth System:</strong> HMAC Signature Verification</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LUỒNG CHUYỂN HƯỚNG VÀ TẢI ỨNG DỤNG (ROUTING & DOWNLOAD FLOWS) */}
          {activeTab === "routing-flow" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-sky-400" />
                    Luồng Chuyển Hướng & Tải Ứng Dụng (Routing & Download Flows)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Tối ưu hóa hành trình người dùng từ Landing Page, Telegram Bot Chat cho tới Telegram Mini App (TMA).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                    Phát hiện OS: {detectedOs.name}
                  </span>
                </div>
              </div>

              {/* FLOW DIAGRAM VISUAL CARDS */}
              <div className="space-y-4">
                {/* STEP 1: WEB TRANG CHỦ (LANDING PAGE) */}
                <div className="glass-card rounded-2xl p-5 border border-sky-500/30 bg-sky-950/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sky-300 font-bold text-sm">
                      <Globe className="w-4 h-4" /> [ 1. WEB TRANG CHỦ (Landing Page) ]
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Tự động nhận diện thiết bị</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {/* (1) Detect OS */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <span>(1) Tự động detect OS</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Hiển thị nút tải file cài đặt tối ưu tương ứng (.apk / .exe / .dmg / .deb).
                        </p>
                      </div>
                      <button
                        onClick={handleDownloadOptimizedApp}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải cho {detectedOs.name} ({detectedOs.ext})
                      </button>
                    </div>

                    {/* (2) Open Telegram Bot */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                          <span>(2) Nút "Mở Telegram Bot"</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Chuyển hướng trực tiếp tới Bot: <code className="text-sky-300 font-mono">t.me/VietsubBot?start=landing_page</code>
                        </p>
                      </div>
                      <button
                        onClick={handleOpenTelegramBot}
                        className="w-full py-2 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        Mở Telegram Bot
                      </button>
                    </div>

                    {/* (3) Web App */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>(3) Nút "Trải nghiệm trên Web"</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Khởi chạy trực tiếp Web Application đầy đủ chức năng với Cloudflare Pages.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Khởi chạy Web Studio
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-6 h-6 text-sky-400 animate-bounce" />
                </div>

                {/* STEP 2: TELEGRAM BOT & KTOR BACKEND */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Telegram Bot Chat Interface */}
                  <div className="glass-card rounded-2xl p-4 border border-purple-500/30 bg-purple-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Bot className="w-4 h-4" /> [ TELEGRAM BOT (Chat Interface) ]
                      </div>
                      <span className="text-[10px] text-purple-400 font-mono">Nhận lệnh /start hoặc /app</span>
                    </div>

                    {/* Simulated Telegram Chat Bubble */}
                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
                      <div className="text-xs text-slate-300 flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          BOT
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-white/5 text-[11px]">
                          {simulatedChatBotMsg}
                        </div>
                      </div>

                      {/* Inline Keyboard Simulation */}
                      <div className="pt-1 space-y-1.5">
                        <button
                          onClick={() => {
                            setSimulatedChatBotMsg("🚀 Đang khởi chạy Telegram Mini App (TMA - Wasm) ngay trong khung chat Telegram...");
                            onNotify?.("Khởi chạy Telegram Mini App (TMA)", "success");
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          🚀 [ Mở Mini App Dịch AI ]
                        </button>
                        <button
                          onClick={() => {
                            setSimulatedChatBotMsg("📥 Danh sách bản tải Native: Android (.apk), Windows (.exe), macOS (.dmg). Vui lòng chọn bản phù hợp với máy của bạn.");
                            onNotify?.("Mở bảng tải đa nền tảng Native", "info");
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          📥 [ Tải App Đa Nền Tảng ]
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ktor Backend Server APIs */}
                  <div className="glass-card rounded-2xl p-4 border border-indigo-500/30 bg-indigo-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Server className="w-4 h-4" /> [ KTOR BACKEND (Server API) ]
                      </div>
                      <span className="text-[10px] text-indigo-400 font-mono">Rest & Webhook Ports</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-emerald-400 font-bold">GET /api/releases/latest</span>
                          <span className="text-slate-400 text-[10px]">Cung cấp link tải cho Web</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Trả về phiên bản mới nhất, dung lượng tệp .apk, .exe, .dmg và checksum an toàn.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-sky-400 font-bold">POST /api/telegram/webhook</span>
                          <span className="text-slate-400 text-[10px]">Xử lý tương tác Bot</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Tiếp nhận Webhook từ Telegram Servers, sinh Inline Keyboards và điều phối tiến trình.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-6 h-6 text-sky-400 animate-bounce" />
                </div>

                {/* STEP 3: TELEGRAM MINI APP (TMA - WASM) */}
                <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <Zap className="w-4 h-4 text-emerald-400" /> [ TELEGRAM MINI APP (TMA - Wasm) ]
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      Khởi chạy tức thì bên trong Telegram
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    Người dùng có thể <strong>tải trực tiếp video</strong>, biên tập <strong>phụ đề Subtitle đa ngôn ngữ</strong>, sửa dấu tiếng Việt bằng AI và <strong>render Hardsub hoàn chỉnh</strong> ngay lập tức mà không cần cài đặt thêm bất kỳ phần mềm nào khác!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <strong className="text-emerald-300">Tải Video Trực Tiếp:</strong>
                      <div className="text-[11px] text-slate-400">Hỗ trợ MP4, Reels, TikTok & Web Links</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <strong className="text-emerald-300">SmartMerge AI Sub:</strong>
                      <div className="text-[11px] text-slate-400">Tự động hợp nhất & chỉnh mốc thời gian</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <strong className="text-emerald-300">Render Hardsub:</strong>
                      <div className="text-[11px] text-slate-400">Xuất video sắc nét chia sẻ ngay trên chat</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIER BREAKDOWN EXPLANATION */}
          {activeTab === "breakdown" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
                <h4 className="font-bold text-sm text-blue-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> 1. Client Tier & Telegram Mini App (TMA)
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Giao diện người dùng được xây dựng bằng <strong>Compose Multiplatform (:composeApp)</strong> cho phép chia sẻ 100% logic điều hướng, ViewModel và trạng thái video giữa Telegram Mini App (TMA), trình duyệt Web (Wasm), ứng dụng di động Android/iOS và Desktop.
                </p>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 font-mono text-[11px] text-slate-400">
                  • TelegramAuthValidator: Xác thực chữ ký HMAC-SHA256 của Telegram initData để đảm bảo chống giả mạo.<br />
                  • SmartMergeEngine: Thuật toán tự động ghép câu phụ đề thông minh khi phát hiện nhịp thở ngắt quãng.
                </div>
              </div>

              <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 2. Tầng Core KMP Shared (:shared)
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Lớp trung tâm chứa toàn bộ mô hình dữ liệu (SubtitleItem, VideoMeta), thư viện xuất phụ đề (SrtFormatter) và Ktor HTTP Client kết nối tới API Gateway qua REST và WebSockets.
                </p>
              </div>

              <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
                <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Server className="w-4 h-4" /> 3. Backend Gateway & Ktor Server (:server)
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Máy chủ điều phối đa luồng: Quản lý hàng đợi render video qua FFmpegService, kết nối đồng thời với mô hình Gemini AI để phân vai giọng nói (Nam/Nữ/Già/Trẻ), và gửi thông báo real-time qua WebSockets.
                </p>
              </div>

              <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
                <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" /> 4. Quy trình CI/CD & Triển Khai
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  GitHub Actions tự động đóng gói ứng dụng sang định dạng Wasm/JS, đẩy trực tiếp lên Cloudflare Pages và cấu hình webhook cho Telegram Bot để phục vụ người dùng 24/7.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: RAW UNICODE DIAGRAM */}
          {activeTab === "raw" && (
            <div className="relative">
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <button
                  onClick={handleCopyRaw}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Đã chép" : "Sao chép mã sơ đồ"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-black/85 border border-white/10 font-mono text-[11px] sm:text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed select-text shadow-inner">
                {FULL_ARCHITECTURE_DIAGRAM}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-black/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Vietsub Bot Architecture & Routing v2.4</span>
            <span aria-hidden="true">·</span>
            <span>Compose Multiplatform + Ktor + Telegram TMA</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenTelegramBot}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" /> Mở Telegram Bot
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemArchitectureModal;
