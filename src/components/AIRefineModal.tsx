import React, { useState } from "react";
import { Sparkles, X, Check, Loader2, Wand2 } from "lucide-react";

interface AIRefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (instruction: string) => Promise<void>;
  isRefining: boolean;
}

export const AIRefineModal: React.FC<AIRefineModalProps> = ({
  isOpen,
  onClose,
  onRefine,
  isRefining,
}) => {
  const [selectedPreset, setSelectedPreset] = useState("Rút gọn câu chữ để người xem đọc kịp");
  const [customPrompt, setCustomPrompt] = useState("");

  if (!isOpen) return null;

  const presets = [
    {
      title: "Rút gọn câu chữ",
      desc: "Lược bớt từ đệm, cô đọng nội dung để khán giả lướt mắt kịp theo nhịp phim.",
      instruction: "Rút gọn các câu phụ đề ngắn gọn, súc tích, giữ nguyên ý chính nhưng dễ đọc nhanh.",
    },
    {
      title: "Sửa chính tả & ngữ pháp tiếng Việt",
      desc: "Chuẩn hoá dấu thanh tiếng Việt (oà/òa), sửa lỗi gõ nhầm và viết hoa đầu câu.",
      instruction: "Kiểm tra và sửa toàn bộ lỗi chính tả tiếng Việt, dấu câu và ngữ pháp chuẩn xác.",
    },
    {
      title: "Tăng cảm xúc & mượt mà chuẩn phim",
      desc: "Điều chỉnh đại từ xưng hô và văn phong tự nhiên như phim điện ảnh chiếu rạp.",
      instruction: "Viết lại lời thoại tiếng Việt sao cho mượt mà, giàu cảm xúc, đúng ngữ cảnh điện ảnh.",
    },
    {
      title: "Phong cách mạng xã hội (TikTok/Shorts)",
      desc: "Ngôn từ trẻ trung, bắt trend, giật tít thu hút người xem mạng xã hội.",
      instruction: "Biên tập lại theo phong cách hiện đại, cuốn hút cho video ngắn TikTok/Reels.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const instruction = customPrompt.trim() ? customPrompt.trim() : selectedPreset;
    onRefine(instruction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="ai-refine-modal-dialog"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">AI Tối ưu & Hiệu đính phụ đề</h3>
              <p className="text-xs text-slate-400">Nâng cấp chất lượng câu từ tiếng Việt</p>
            </div>
          </div>
          {!isRefining && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Chọn thao tác tối ưu nhanh:
            </label>
            <div className="space-y-2">
              {presets.map((p) => (
                <div
                  key={p.title}
                  onClick={() => {
                    setSelectedPreset(p.instruction);
                    setCustomPrompt("");
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPreset === p.instruction && !customPrompt
                      ? "bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40 text-white"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="font-semibold text-xs text-indigo-300 mb-0.5">{p.title}</div>
                  <p className="text-[11px] text-slate-400 leading-normal">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Hoặc nhập yêu cầu riêng của bạn:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đổi xưng hô 'tôi' thành 'mình', câu văn gần gũi..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRefining}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isRefining}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Áp dụng tối ưu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
