import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center justify-between gap-3 rounded-xl bg-amber-600/95 text-white px-3.5 py-2.5 shadow-2xl backdrop-blur-md border border-amber-400/40 text-xs animate-fadeIn"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-black/20 shrink-0">
          <WifiOff className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold">Đang ở chế độ Ngoại tuyến (Offline)</div>
          <div className="text-[11px] text-amber-100">
            Dữ liệu phụ đề đã lưu cache trong trình duyệt vẫn hoạt động bình thường.
          </div>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white shrink-0 transition-colors"
        title="Thử kết nối lại"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
