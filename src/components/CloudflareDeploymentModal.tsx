import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Download,
  Sparkles,
  Zap,
  ShieldCheck,
  Server,
  Layers,
  Terminal,
  Radio,
  FileCode,
  Mic,
} from "lucide-react";

interface CloudflareDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const CloudflareDeploymentModal: React.FC<CloudflareDeploymentModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [accountId, setAccountId] = useState(
    localStorage.getItem("cf_account_id") || ""
  );
  const [apiToken, setApiToken] = useState(
    localStorage.getItem("cf_api_token") || ""
  );
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connected" | "fallback" | "error"
  >("idle");
  const [statusDetails, setStatusDetails] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "deploy">("ai");

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      setTestingConnection(true);
      const res = await fetch("/api/cloudflare/status", {
        headers: {
          "x-cf-account-id": accountId.trim(),
          "x-cf-api-token": apiToken.trim(),
        },
      });
      const data = await res.json();
      if (data.isConfigured) {
        setConnectionStatus("connected");
        setStatusDetails(
          `Đã kết nối Cloudflare Workers AI (Account: ${data.accountId || "Active"})`
        );
      } else {
        setConnectionStatus("fallback");
        setStatusDetails(
          "Chưa cấu hình API Token riêng; hệ thống đang dùng dự phòng thông minh qua server proxy."
        );
      }
    } catch (err: any) {
      setConnectionStatus("fallback");
      setStatusDetails("Chế độ tự động dự phòng sẵn sàng hoạt động.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCredentials = () => {
    localStorage.setItem("cf_account_id", accountId.trim());
    localStorage.setItem("cf_api_token", apiToken.trim());
    onNotify?.("Đã lưu cấu hình Cloudflare Workers AI vào trình duyệt!", "success");
    checkStatus();
  };

  const handleDownloadWrangler = () => {
    const wranglerContent = JSON.stringify(
      {
        $schema: "node_modules/wrangler/config-schema.json",
        name: "vietsub-video-studio",
        main: "worker.ts",
        compatibility_date: "2025-03-01",
        compatibility_flags: ["nodejs_compat"],
        assets: {
          directory: "./dist",
          binding: "ASSETS",
        },
        observability: {
          enabled: true,
        },
        ai: {
          binding: "AI",
        },
      },
      null,
      2
    );

    const blob = new Blob([wranglerContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wrangler.jsonc";
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.("Đã tải xuống tệp cấu hình wrangler.jsonc!", "success");
  };

  const handleCopyDeployCommands = () => {
    const commands = `npm install -g wrangler\nnpm run build\nnpx wrangler deploy`;
    navigator.clipboard.writeText(commands);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    onNotify?.("Đã sao chép lệnh triển khai Cloudflare!", "success");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Cloudflare Workers AI & Triển Khai
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  dash.cloudflare.com
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tích hợp AI biên (Edge AI) cho TTS, nhận dạng phụ đề Whisper và triển khai ứng dụng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6 pt-2">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "ai"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Workers AI (TTS & Whisper Subtitles)</span>
          </button>
          <button
            onClick={() => setActiveTab("deploy")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "deploy"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Hướng Dẫn Triển Khai dash.cloudflare.com</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === "ai" ? (
            <div className="space-y-5">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  connectionStatus === "connected"
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}
              >
                {connectionStatus === "connected" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                    <span>Trạng thái Workers AI:</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        connectionStatus === "connected"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                      }`}
                    >
                      {connectionStatus === "connected"
                        ? "Đang kích hoạt trực tiếp"
                        : "Sẵn sàng (Dual Fallback)"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {statusDetails ||
                      "Ứng dụng kết hợp kiến trúc Gemini API và Cloudflare Workers AI (@cf/openai/whisper, @cf/meta/m2m100-1.2b, TTS) để đảm bảo phụ đề và lồng tiếng hoạt động liên tục ngay cả khi vượt quota."}
                  </p>
                </div>
              </div>

              {/* Form Input */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-orange-400" />
                    <span>Cấu hình Cloudflare Credentials (Tùy chọn)</span>
                  </h4>
                  <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 underline"
                  >
                    <span>Lấy API Token tại dash.cloudflare.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Cloudflare Account ID:
                    </label>
                    <input
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder="ví dụ: 6b19a1283d0c9f..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Cloudflare API Token (quyền Workers AI Read/Edit):
                    </label>
                    <input
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="Nhập Cloudflare API Token của bạn..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={checkStatus}
                    disabled={testingConnection}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-orange-400" />
                    <span>{testingConnection ? "Đang kiểm tra..." : "Kiểm tra kết nối"}</span>
                  </button>

                  <button
                    onClick={handleSaveCredentials}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>

              {/* Models Matrix */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-orange-400" />
                  <span>Các mô hình Workers AI được tích hợp trực tiếp:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-mono text-[11px] text-orange-400 font-bold">
                      @cf/openai/whisper
                    </div>
                    <div className="text-[11px] text-slate-300">Nhận diện tiếng nói & mốc phụ đề</div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-mono text-[11px] text-emerald-400 font-bold">
                      @cf/meta/m2m100-1.2b
                    </div>
                    <div className="text-[11px] text-slate-300">Dịch thuật đa ngôn ngữ thời gian thực</div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-mono text-[11px] text-indigo-400 font-bold">
                      @cf/myshell-ai/melo-tts
                    </div>
                    <div className="text-[11px] text-slate-300">Tổng hợp giọng thuyết minh Edge TTS</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: DEPLOYMENT GUIDE FOR DASH.CLOUDFLARE.COM */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/30 via-slate-950 to-slate-900 border border-orange-500/30 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                  <Server className="w-4 h-4" />
                  <span>Triển khai lên dash.cloudflare.com trong 3 bước</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bạn có thể đưa ứng dụng Vietsub Video Studio lên Cloudflare Pages hoặc Cloudflare Workers để có tên miền riêng miễn phí, CDN toàn cầu và bảo mật SSL tự động.
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>Đăng nhập dash.cloudflare.com:</span>
                </div>
                <p className="text-xs text-slate-400 pl-7">
                  Truy cập{" "}
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 underline"
                  >
                    dash.cloudflare.com
                  </a>{" "}
                  → Chọn <strong>Compute (Workers & Pages)</strong> → Nhấp <strong>Create Application</strong> → Chọn <strong>Pages</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>Cài đặt thông số xây dựng (Build Settings):</span>
                </div>
                <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Framework preset:</span>
                    <strong className="text-white">Vite</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Build command:</span>
                    <strong className="text-emerald-400 font-mono">npm run build</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Build output directory:</span>
                    <strong className="text-amber-400 font-mono">dist</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Node.js version:</span>
                    <strong className="text-white font-mono">20</strong>
                  </div>
                </div>
              </div>

              {/* Step 3: Wrangler Configuration File */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Tệp cấu hình Cloudflare Wrangler:</span>
                  </div>
                  <button
                    onClick={handleDownloadWrangler}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải wrangler.jsonc</span>
                  </button>
                </div>

                <div className="relative pl-7">
                  <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`{
  "name": "vietsub-video-studio",
  "main": "server.ts",
  "compatibility_date": "2025-03-01",
  "assets": { "directory": "./dist" },
  "ai": { "binding": "AI" }
}`}
                  </pre>
                </div>
              </div>

              {/* Quick CLI command */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-mono truncate">
                  $ npm run build && npx wrangler deploy
                </span>
                <button
                  onClick={handleCopyDeployCommands}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors shrink-0 ml-2"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Đã chép!" : "Sao chép lệnh"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Kết hợp server Gemini API & Cloudflare Edge AI để vận hành ổn định</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
