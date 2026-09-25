import React from "react";
import { X, Sliders, Check } from "lucide-react";
import { SubtitleStyle, SubtitlePosition, SubtitleDisplayMode } from "../types";

interface SubtitleStylingModalProps {
  isOpen: boolean;
  onClose: () => void;
  style: SubtitleStyle;
  onChangeStyle: (style: SubtitleStyle) => void;
}

export const SubtitleStylingModal: React.FC<SubtitleStylingModalProps> = ({
  isOpen,
  onClose,
  style,
  onChangeStyle,
}) => {
  if (!isOpen) return null;

  const colors = [
    { name: "Trắng", value: "#FFFFFF" },
    { name: "Vàng điện ảnh", value: "#FACC15" },
    { name: "Xanh ngọc", value: "#38BDF8" },
    { name: "Xanh lá nhạt", value: "#4ADE80" },
    { name: "Hồng cam", value: "#FB7185" },
    { name: "Cam sáng", value: "#FB923C" },
  ];

  const fontSizes: { id: SubtitleStyle["fontSize"]; label: string }[] = [
    { id: "sm", label: "Nhỏ" },
    { id: "base", label: "Vừa" },
    { id: "lg", label: "Lớn (Khuyên dùng)" },
    { id: "xl", label: "Rất lớn" },
    { id: "2xl", label: "Khổng lồ" },
  ];

  const positions: { id: SubtitlePosition; label: string }[] = [
    { id: "bottom", label: "Dưới cùng (Mặc định)" },
    { id: "middle", label: "Chính giữa" },
    { id: "top", label: "Trên đỉnh" },
  ];

  const displayModes: { id: SubtitleDisplayMode; label: string; desc: string }[] = [
    { id: "vi", label: "Chỉ tiếng Việt", desc: "Hiển thị bản dịch Vietsub rõ nét" },
    { id: "bilingual", label: "Song ngữ (Bilingual)", desc: "Dòng trên tiếng gốc, dòng dưới Vietsub" },
    { id: "original", label: "Chỉ tiếng gốc", desc: "Hiển thị nguyên văn lời thoại gốc" },
  ];

  const bgStyles: { id: SubtitleStyle["backgroundColor"]; label: string }[] = [
    { id: "shadow-only", label: "Bóng đen điện ảnh (Không hộp nền)" },
    { id: "translucent-black", label: "Hộp đen mờ kính (Khuyên dùng)" },
    { id: "solid-black", label: "Hộp đen đặc" },
    { id: "none", label: "Chữ phẳng" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="subtitle-styling-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm sm:text-base">Tùy biến hiển thị phụ đề</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Xem trước trực tiếp:
          </div>
          <div className="w-full aspect-video max-h-36 bg-slate-900 rounded-xl overflow-hidden relative flex flex-col items-center justify-center border border-slate-800">
            {/* Background mockup graphic */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 flex items-center justify-center opacity-60">
              <span className="text-xs text-slate-600 font-mono">[Khung hình video]</span>
            </div>

            {/* Subtitle preview */}
            <div className="z-10 px-4 py-1 text-center">
              {style.displayMode === "bilingual" && (
                <div className="text-xs text-white opacity-80 mb-0.5">
                  Never give up on your dreams.
                </div>
              )}
              <div
                className={`font-semibold ${
                  style.fontSize === "sm"
                    ? "text-xs"
                    : style.fontSize === "base"
                    ? "text-sm"
                    : style.fontSize === "lg"
                    ? "text-base"
                    : style.fontSize === "xl"
                    ? "text-lg"
                    : "text-xl"
                } ${
                  style.backgroundColor === "translucent-black"
                    ? "bg-black/75 px-3 py-1 rounded-md"
                    : style.backgroundColor === "solid-black"
                    ? "bg-black px-3 py-1 rounded-md"
                    : ""
                }`}
                style={{
                  color: style.textColor,
                  textShadow: style.textShadow
                    ? "0 2px 4px rgba(0,0,0,0.9), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                    : "none",
                }}
              >
                Đừng bao giờ từ bỏ ước mơ của bạn.
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Display Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Chế độ hiển thị
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {displayModes.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => onChangeStyle({ ...style, displayMode: dm.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    style.displayMode === dm.id
                      ? "bg-rose-950/40 border-rose-500 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs">{dm.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{dm.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Màu sắc chữ phụ đề
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChangeStyle({ ...style, textColor: c.value })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    style.textColor === c.value
                      ? "border-rose-500 bg-slate-800 ring-1 ring-rose-500/50 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: c.value }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kích thước chữ
              </label>
              <select
                value={style.fontSize}
                onChange={(e) =>
                  onChangeStyle({ ...style, fontSize: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                {fontSizes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vị trí trên video
              </label>
              <select
                value={style.position}
                onChange={(e) =>
                  onChangeStyle({ ...style, position: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Background Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kiểu nền / Viền phụ đề
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bgStyles.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => onChangeStyle({ ...style, backgroundColor: bg.id })}
                  className={`p-2 rounded-xl border text-left text-xs transition-all ${
                    style.backgroundColor === bg.id
                      ? "bg-rose-950/40 border-rose-500 text-white font-medium"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
          >
            Đóng & Lưu thiết lập
          </button>
        </div>
      </div>
    </div>
  );
};
