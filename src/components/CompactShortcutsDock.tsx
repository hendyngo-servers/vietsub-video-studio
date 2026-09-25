import React from "react";
import { Keyboard, X, Maximize2 } from "lucide-react";

interface CompactShortcutsDockProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenFullModal: () => void;
}

export const CompactShortcutsDock: React.FC<CompactShortcutsDockProps> = ({
  isVisible,
  onClose,
  onOpenFullModal,
}) => {
  if (!isVisible) return null;

  return (
    <aside
      id="compact-shortcuts-dock"
      aria-label="Bảng phím tắt thao tác nhanh"
      className="fixed bottom-4 left-4 z-40 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-slate-200 text-xs w-72 animate-fadeIn select-none group"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-[11px] text-indigo-300">
          <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
          <span>Phím Tắt Nhanh (Ghim)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFullModal}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Mở toàn bộ danh sách phím tắt (?)"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Đóng bảng ghim"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Phát / Tạm dừng:</span>
          <kbd className="font-mono text-amber-300 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold">
            Space
          </kbd>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Tua lùi / tiến 5s:</span>
          <div className="flex items-center gap-1">
            <kbd className="font-mono text-amber-300 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold">
              ←
            </kbd>
            <kbd className="font-mono text-amber-300 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold">
              →
            </kbd>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Lưu sửa phụ đề:</span>
          <kbd className="font-mono text-amber-300 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold">
            Ctrl+Enter
          </kbd>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Tua nhanh 10s:</span>
          <div className="flex items-center gap-1">
            <kbd className="font-mono text-amber-300 px-1 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold">
              J
            </kbd>
            <kbd className="font-mono text-amber-300 px-1 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold">
              L
            </kbd>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Ẩn/Hiện Vietsub:</span>
          <kbd className="font-mono text-amber-300 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold">
            C
          </kbd>
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
        <span>Nhấn ? để xem tất cả</span>
        <button
          onClick={onOpenFullModal}
          className="text-indigo-400 hover:text-indigo-300 underline font-medium"
        >
          Chi tiết
        </button>
      </div>
    </aside>
  );
};
