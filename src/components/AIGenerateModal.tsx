import React, { useState } from "react";
import {
  Sparkles,
  X,
  Languages,
  Wand2,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { GenerationConfig, VietsubStyle, TARGET_LANGUAGES } from "../types";

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: GenerationConfig) => Promise<void>;
  isProcessing: boolean;
  progressStep: string;
  progressPercent: number;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const AIGenerateModal: React.FC<AIGenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isProcessing,
  progressStep,
  progressPercent,
  errorMessage,
  onClearError,
}) => {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("vi");
  const [style, setStyle] = useState<VietsubStyle>("natural");
  const [maxCharsPerLine, setMaxCharsPerLine] = useState(42);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onClearError) onClearError();
    onGenerate({
      sourceLang,
      targetLang,
      style,
      maxCharsPerLine,
    });
  };

  const styleOptions: { id: VietsubStyle; label: string; desc: string; icon: string }[] = [
    {
      id: "natural",
      label: "Chuẩn phim ảnh (Khuyên dùng)",
      desc: "Văn phong mượt mà, tự nhiên, xưng hô phù hợp cảm xúc nhân vật và văn hóa Việt Nam.",
      icon: "🎬",
    },
    {
      id: "bilingual",
      label: "Song ngữ (Bilingual)",
      desc: "Giữ lại nguyên văn tiếng gốc và dịch tiếng Việt ngay bên dưới, tối ưu cho việc học tiếng.",
      icon: "🌐",
    },
    {
      id: "catchy",
      label: "Bắt trend / Mạng xã hội",
      desc: "Phù hợp cho TikTok, Facebook Reels, YouTube Shorts với câu ngắn, hấp dẫn và hiện đại.",
      icon: "⚡",
    },
    {
      id: "literal",
      label: "Sát nghĩa / Học thuật",
      desc: "Dịch trung thực, bám sát từng từ nguyên bản, phù hợp với tài liệu khoa học, bài giảng.",
      icon: "📖",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="ai-generate-modal-dialog"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Tạo phụ đề Vietsub tự động với AI</h2>
              <p className="text-xs text-slate-400">Trích xuất giọng nói, dịch sang tiếng Việt và khớp mốc thời gian</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              id="btn-close-generate-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {isProcessing ? (
            /* Progress State */
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-rose-500 animate-spin flex items-center justify-center"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-rose-400 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">Gemini AI đang lắng nghe và tạo Vietsub</h3>
                <p className="text-xs text-slate-400 max-w-sm">{progressStep}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-sm bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                <div
                  className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(10, progressPercent)}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Quá trình thường mất từ 5 - 20 giây tuỳ theo độ dài video
              </div>
            </div>
          ) : (
            /* Form Configuration */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Banner if last attempt failed */}
              {errorMessage && (
                <div
                  id="ai-generate-error-banner"
                  className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/60 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-rose-950/40"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-rose-100">
                        Chưa hoàn thành tạo phụ đề
                      </div>
                      <div className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                        {errorMessage}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      id="btn-retry-ai-generate"
                      type="button"
                      onClick={() => handleSubmit()}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Thử lại ngay</span>
                    </button>
                    {onClearError && (
                      <button
                        type="button"
                        onClick={onClearError}
                        className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors"
                        title="Đóng thông báo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Source & Target Language Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Source Language */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ngôn ngữ gốc của video</span>
                  </label>
                  <select
                    id="select-source-language"
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="auto">✨ Tự động nhận diện</option>
                    <option value="en">Tiếng Anh (English)</option>
                    <option value="ja">Tiếng Nhật (日本語)</option>
                    <option value="ko">Tiếng Hàn (한국어)</option>
                    <option value="zh">Tiếng Trung (中文)</option>
                    <option value="vi">Tiếng Việt (Vietnamese)</option>
                    <option value="fr">Tiếng Pháp (Français)</option>
                    <option value="de">Tiếng Đức (Deutsch)</option>
                    <option value="es">Tiếng Tây Ban Nha (Español)</option>
                    <option value="ru">Tiếng Nga (Русский)</option>
                    <option value="th">Tiếng Thái (ไทย)</option>
                  </select>
                </div>

                {/* Target Language */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dịch phụ đề sang</span>
                  </label>
                  <select
                    id="select-target-language"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-300 font-medium focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {TARGET_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Target Language Presets */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Chọn nhanh ngôn ngữ đích phổ biến:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_LANGUAGES.slice(0, 5).map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setTargetLang(lang.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                        targetLang === lang.code
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Phong cách dịch thuật Vietsub
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {styleOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setStyle(opt.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        style === opt.id
                          ? "bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/30 text-white"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{opt.icon}</span>
                        <span className="text-xs font-bold">{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Max Length per line */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                    <span>Độ dài tối đa mỗi dòng phụ đề</span>
                  </label>
                  <span className="text-xs font-mono text-rose-400 font-bold">{maxCharsPerLine} ký tự</span>
                </div>
                <input
                  id="range-max-chars"
                  type="range"
                  min={25}
                  max={65}
                  step={1}
                  value={maxCharsPerLine}
                  onChange={(e) => setMaxCharsPerLine(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Ngắn gọn (Dễ đọc nhanh)</span>
                  <span>Tiêu chuẩn (42 ký tự)</span>
                  <span>Dài (Nhiều chi tiết)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-submit-ai-generate"
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Tạo phụ đề {TARGET_LANGUAGES.find((l) => l.code === targetLang)?.flag || "✨"} {TARGET_LANGUAGES.find((l) => l.code === targetLang)?.label.split(" ")[0] || "AI"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
