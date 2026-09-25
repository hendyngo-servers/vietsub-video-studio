import React, { useState, useMemo } from "react";
import {
  X,
  Keyboard,
  Search,
  Pin,
  PinOff,
  Copy,
  Check,
  Play,
  Edit3,
  Sliders,
  Sparkles,
  Command,
  Laptop,
  Monitor,
  Smartphone,
  Apple,
} from "lucide-react";
import { detectPlatform } from "../hooks/usePWAInstall";

export interface ShortcutItem {
  id: string;
  category: "player" | "editor" | "system";
  keys: string[];
  description: string;
  detail?: string;
}

export const SHORTCUTS_DATA: ShortcutItem[] = [
  // Video Player Shortcuts
  {
    id: "toggle-play",
    category: "player",
    keys: ["Space"],
    description: "Phát hoặc Tạm dừng phát video",
    detail: "Hoạt động mọi lúc khi không nhập văn bản",
  },
  {
    id: "toggle-play-k",
    category: "player",
    keys: ["K"],
    description: "Tạm dừng / Tiếp tục phát video (kiểu YouTube/CapCut)",
  },
  {
    id: "seek-backward-5",
    category: "player",
    keys: ["←"],
    description: "Tua lùi 5 giây",
    detail: "Khớp nhịp lời thoại vừa trôi qua",
  },
  {
    id: "seek-forward-5",
    category: "player",
    keys: ["→"],
    description: "Tua tiến 5 giây",
  },
  {
    id: "seek-backward-10",
    category: "player",
    keys: ["J"],
    description: "Tua lùi nhanh 10 giây",
  },
  {
    id: "seek-forward-10",
    category: "player",
    keys: ["L"],
    description: "Tua tiến nhanh 10 giây",
  },
  {
    id: "toggle-subtitles",
    category: "player",
    keys: ["C"],
    description: "Bật / Tắt hiển thị phụ đề Vietsub trên khung hình",
  },
  {
    id: "toggle-mute",
    category: "player",
    keys: ["M"],
    description: "Tắt / Bật tiếng video (Mute / Unmute)",
  },

  // Editor Shortcuts
  {
    id: "save-edits",
    category: "editor",
    keys: ["Ctrl", "Enter"],
    description: "Lưu nhanh tất cả chỉnh sửa phụ đề",
    detail: "Hoạt động ngay cả khi đang gõ trong ô văn bản",
  },
  {
    id: "next-cue",
    category: "editor",
    keys: ["Tab"],
    description: "Chuyển con trỏ sang ô phụ đề tiếp theo",
  },
  {
    id: "prev-cue",
    category: "editor",
    keys: ["Shift", "Tab"],
    description: "Quay lại ô phụ đề trước đó",
  },
  {
    id: "waveform-adjust",
    category: "editor",
    keys: ["Kéo chuột"],
    description: "Kéo mép thẻ phụ đề trên Waveform để chỉnh độ dài mốc thời gian",
    detail: "Dải sóng âm thanh dưới khung phát video",
  },

  // System & Window Shortcuts
  {
    id: "open-shortcuts",
    category: "system",
    keys: ["?"],
    description: "Mở hoặc đóng Bảng tra cứu phím tắt này",
  },
  {
    id: "close-modal",
    category: "system",
    keys: ["Esc"],
    description: "Đóng hoặc Ẩn cửa sổ pop-up đang mở (Xuất video, CapCut, v.v.)",
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  isPinned,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "player" | "editor" | "system">("all");
  const [copied, setCopied] = useState(false);
  const platform = useMemo(() => detectPlatform(), []);

  // Filtered shortcuts with platform-adapted modifier keys
  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS_DATA.map((item) => {
      if (platform.modifierKey === "Cmd") {
        return {
          ...item,
          keys: item.keys.map((k) => (k === "Ctrl" ? "⌘ Cmd" : k === "Alt" ? "⌥ Option" : k)),
        };
      }
      return item;
    }).filter((item) => {
      const matchesCat = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.description.toLowerCase().includes(q) ||
        item.keys.some((k) => k.toLowerCase().includes(q)) ||
        (item.detail && item.detail.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory, platform]);

  const handleCopyAll = () => {
    const text = SHORTCUTS_DATA.map(
      (s) => `[${s.keys.join(" + ")}] : ${s.description} ${s.detail ? `(${s.detail})` : ""}`
    ).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="keyboard-shortcuts-dialog"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Bảng Phím Tắt Nhanh</h3>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/30">
                  Nhấn ? để mở
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thao tác chỉnh sửa phụ đề & tua video nhanh như phần mềm dựng phim chuyên nghiệp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Pin compact dock button */}
            <button
              id="btn-pin-shortcuts-overlay"
              type="button"
              onClick={onTogglePin}
              className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                isPinned
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60"
              }`}
              title={
                isPinned
                  ? "Đang ghim bảng phím tắt thu nhỏ ở góc màn hình. Bấm để bỏ ghim."
                  : "Ghim bảng phím tắt thu nhỏ góc màn hình khi đang làm việc"
              }
            >
              {isPinned ? <PinOff className="w-4 h-4 text-amber-400" /> : <Pin className="w-4 h-4" />}
            </button>

            {/* Close modal */}
            <button
              id="btn-close-shortcuts-modal"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="relative">
            <input
              id="input-search-shortcuts"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm phím tắt (ví dụ: tua, space, lưu, phụ đề...)"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 pl-9 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-white absolute right-3 top-2.5"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeCategory === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Tất cả ({SHORTCUTS_DATA.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("player")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeCategory === "player"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Trình phát Video
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("editor")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeCategory === "editor"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Biên tập Phụ đề
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("system")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeCategory === "system"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Hệ thống
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              title="Sao chép danh sách phím tắt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
            </button>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/60">
          {filteredShortcuts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Không tìm thấy phím tắt phù hợp với từ khóa "{searchQuery}".
            </div>
          ) : (
            filteredShortcuts.map((item) => (
              <div
                key={item.id}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-200">{item.description}</div>
                  {item.detail && <div className="text-[11px] text-slate-400">{item.detail}</div>}
                </div>

                {/* Key Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.keys.map((k, idx) => (
                    <React.Fragment key={idx}>
                      <kbd className="inline-flex items-center justify-center min-w-[24px] px-2 py-1 text-xs font-mono font-bold text-amber-300 bg-slate-950 border border-slate-700/80 rounded-md shadow-inner">
                        {k}
                      </kbd>
                      {idx < item.keys.length - 1 && (
                        <span className="text-[10px] text-slate-500 font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer tip */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-3">
          <span>
            💡 <strong>Mẹo chuyên nghiệp:</strong> Nhấn <kbd className="font-mono text-amber-300 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px]">Ctrl+Enter</kbd> khi đang gõ phụ đề để lưu ngay mà không cần rời tay khỏi bàn phím!
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors shrink-0"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
