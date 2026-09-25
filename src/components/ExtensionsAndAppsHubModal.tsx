import React, { useState } from "react";
import {
  X,
  Smartphone,
  Apple,
  Globe,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Bookmark,
  QrCode,
  Share2,
} from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface ExtensionsAndAppsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const ExtensionsAndAppsHubModal: React.FC<ExtensionsAndAppsHubModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<"pwa" | "android" | "ios" | "capacitor">("pwa");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const { isInstallable, isInstalled, install, isIOS, platformInfo } = usePWAInstall();
  const isAndroid = platformInfo.os === "android";

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    onNotify?.("Đã sao chép lệnh vào bộ nhớ tạm!", "success");
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Trung tâm Ứng dụng & Cài đặt</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                  Web &bull; Android &bull; iOS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sử dụng đồng thời mượt mà trên Web, CH Play (Android) và App Store (iPhone/iPad)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/90 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pwa")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === "pwa"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cài nhanh Web / PWA</span>
          </button>

          <button
            onClick={() => setActiveTab("android")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === "android"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Google Play (CH Play)</span>
          </button>

          <button
            onClick={() => setActiveTab("ios")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === "ios"
                ? "bg-slate-900 text-slate-200 border-slate-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>App Store (iOS / iPad)</span>
          </button>

          <button
            onClick={() => setActiveTab("capacitor")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === "capacitor"
                ? "bg-slate-900 text-indigo-400 border-indigo-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Đóng gói Capacitor</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === "pwa" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Cài đặt trực tiếp vào màn hình chính (PWA Standalone)</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Chạy độc lập không viền duyệt web, khởi động siêu tốc và sử dụng mượt mà khi ngoại tuyến.
                  </p>
                </div>
                {isInstalled ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã cài đặt</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Cài đặt App ngay</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-400">
                    Sử dụng menu trình duyệt: Bấm <strong>Thêm vào màn hình chính</strong>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span>Trên điện thoại Android (CH Play / Chrome)</span>
                  </div>
                  <ol className="list-decimal list-inside text-slate-400 space-y-1 mt-2">
                    <li>Mở link web trong <strong>Google Chrome</strong></li>
                    <li>Bấm vào menu 3 chấm ở góc trên bên phải</li>
                    <li>Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào MH chính</strong></li>
                    <li>Biểu tượng Vietsub Studio xuất hiện như app tải từ CH Play</li>
                  </ol>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-slate-300" />
                    <span>Trên iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside text-slate-400 space-y-1 mt-2">
                    <li>Mở link trong trình duyệt <strong>Safari</strong></li>
                    <li>Bấm biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới</li>
                    <li>Cuộn xuống chọn <strong>Thêm vào Màn hình chính (Add to Home)</strong></li>
                    <li>Bấm <strong>Thêm (Add)</strong> để hoàn tất</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === "android" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Phát hành lên Google Play Store (CH Play)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Ứng dụng đã được cấu hình sẵn <code>CapacitorConfig</code> (App ID: <code>com.hendy.vietsubpro</code>) và Web App Manifest chuẩn TWA.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-emerald-400">Cách 1: Xuất file APK / AAB bằng Capacitor Android</strong>
                    <div className="mt-2 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                      <span>npm run cap:android</span>
                      <button
                        onClick={() => handleCopy("npm run cap:android", "cap-android")}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedCmd === "cap-android" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-cyan-400">Cách 2: Đóng gói TWA bằng Google Bubblewrap CLI</strong>
                    <div className="mt-2 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                      <span>npx @bubblewrap/cli init --manifest=./public/manifest.json</span>
                      <button
                        onClick={() => handleCopy("npx @bubblewrap/cli init --manifest=./public/manifest.json", "bubblewrap")}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedCmd === "bubblewrap" ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ios" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Apple className="w-4 h-4 text-slate-200" />
                  <span>Phát hành lên Apple App Store (iOS)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Mở Xcode và đồng bộ mã nguồn với Capacitor iOS để xuất IPA và đưa lên App Store Connect.
                </p>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <strong className="text-indigo-400">Lệnh đồng bộ và mở Xcode:</strong>
                    <div className="mt-2 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                      <span>npm run cap:ios</span>
                      <button
                        onClick={() => handleCopy("npm run cap:ios", "cap-ios")}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedCmd === "cap-ios" ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    Trong Xcode: Chọn Signing & Capabilities &rarr; Thêm tài khoản Apple Developer &rarr; Bấm <strong>Product &gt; Archive</strong> để tải lên App Store.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "capacitor" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-slate-200 mb-1">Cấu hình Capacitor (capacitor.config.ts)</div>
                <pre className="text-[11px] font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-indigo-300 overflow-x-auto">
{`appId: 'com.hendy.vietsubpro'
appName: 'Hendy Vietsub Pro'
webDir: 'dist'
server: {
  androidScheme: 'https',
  cleartext: true
}`}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-slate-200 mb-1">Quy trình build & đồng bộ:</div>
                <div className="font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800/80 space-y-1 text-slate-300">
                  <div>npm run build</div>
                  <div>npx cap sync</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA &bull; Capacitor 6.0 &bull; Responsive Multi-device</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExtensionsAndAppsHubModal;
