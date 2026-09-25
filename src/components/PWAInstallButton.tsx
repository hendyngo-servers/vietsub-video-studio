import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Apple,
  Laptop,
  Check,
  Globe,
  Sparkles,
  Info,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, platformInfo, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowModal(true);
    }
  };

  const getPlatformIcon = () => {
    switch (platformInfo.os) {
      case 'mac':
        return <Laptop className="w-3.5 h-3.5 text-slate-300" />;
      case 'windows':
        return <Monitor className="w-3.5 h-3.5 text-blue-400" />;
      case 'linux':
        return <Laptop className="w-3.5 h-3.5 text-amber-400" />;
      case 'android':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ios':
        return <Apple className="w-3.5 h-3.5 text-slate-200" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  // If already running inside standalone app, show small verified indicator
  if (isInstalled) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
        title="Ứng dụng đang chạy ở chế độ Đa nền tảng Standalone"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Bản cài đặt</span>
        <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-mono">
          {platformInfo.osName}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        id="btn-pwa-install-header"
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`flex items-center gap-1.5 rounded-xl font-semibold text-xs transition-all shadow-sm active:scale-95 ${
          compact
            ? 'p-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
            : isInstallable
            ? 'px-3 py-2 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 text-emerald-300 border border-emerald-500/40'
            : 'px-2.5 sm:px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
        }`}
        title={`Cài đặt ứng dụng đa nền tảng cho ${platformInfo.osName} (Windows, macOS, Linux, Android, iOS)`}
      >
        {isInstallable ? (
          <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
        ) : (
          getPlatformIcon()
        )}
        {!compact && (
          <span className="flex items-center gap-1">
            <span>Cài App</span>
            <span className="hidden md:inline-block text-[10px] px-1 py-0.2 rounded bg-slate-700/80 text-slate-300 font-mono">
              {platformInfo.osName}
            </span>
          </span>
        )}
      </button>

      {/* Cross-Platform Installation Guidance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Cài đặt Ứng dụng Đa nền tảng
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tương thích 100% Windows, macOS, Linux, Android, iOS & iPadOS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Current Device Highlight */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getPlatformIcon()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">
                      Thiết bị hiện tại của bạn:
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      {platformInfo.osName} ({platformInfo.isMobile ? 'Di động' : 'Máy tính'})
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Tương thích
                </span>
              </div>

              {/* Instructions by OS */}
              {isIOS ? (
                <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-slate-300" />
                    <span>Cách cài đặt trên iPhone / iPad (iOS Safari):</span>
                  </div>
                  <ol className="space-y-2 text-slate-300 pl-4 list-decimal text-[11px] leading-relaxed">
                    <li>
                      Nhấn vào nút <strong className="text-white">Chia sẻ (Share)</strong>{' '}
                      <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> ở thanh công cụ dưới cùng của trình duyệt Safari.
                    </li>
                    <li>
                      Cuộn xuống danh sách và chọn{' '}
                      <strong className="text-white">Thêm vào Màn hình chính (Add to Home Screen)</strong>{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                    </li>
                    <li>
                      Nhấn nút <strong className="text-white">Thêm (Add)</strong> ở góc trên bên phải. Ứng dụng sẽ xuất hiện như app native, hỗ trợ mở toàn màn hình không có thanh URL.
                    </li>
                  </ol>
                </div>
              ) : platformInfo.os === 'android' ? (
                <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Cách cài đặt trên thiết bị Android (Chrome / Edge / Samsung):</span>
                  </div>
                  <ol className="space-y-2 text-slate-300 pl-4 list-decimal text-[11px] leading-relaxed">
                    <li>
                      Nhấn vào biểu tượng <strong className="text-white">Menu 3 chấm (⋮)</strong> ở góc phải trình duyệt.
                    </li>
                    <li>
                      Chọn <strong className="text-white">Cài đặt ứng dụng</strong> hoặc{' '}
                      <strong className="text-white">Thêm vào Màn hình chính</strong>.
                    </li>
                    <li>
                      Xác nhận cài đặt để trải nghiệm giao diện mượt mà và chạy độc lập.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <span>Cách cài đặt trên Máy tính (Windows / macOS / Linux):</span>
                  </div>
                  <ol className="space-y-2 text-slate-300 pl-4 list-decimal text-[11px] leading-relaxed">
                    <li>
                      Tìm biểu tượng <strong className="text-white">Cài đặt (Install / ⊕)</strong> ở thanh địa chỉ của trình duyệt Chrome hoặc Edge.
                    </li>
                    <li>
                      Hoặc nhấn Menu 3 chấm (⋮) &rarr; <strong className="text-white">Cài đặt Vietsub Video Studio</strong>.
                    </li>
                    <li>
                      Ứng dụng sẽ có cửa sổ riêng biệt, phím tắt nhanh và biểu tượng trên Desktop / Launchpad / Dock.
                    </li>
                  </ol>
                </div>
              )}

              {/* Benefits checklist */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Không cần cài đặt Store</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Chạy offline siêu tốc</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Toàn màn hình không viền</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Tự động cập nhật bản mới</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
