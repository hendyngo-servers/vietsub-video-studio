import React, { useState, useMemo } from "react";
import {
  X,
  Scissors,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Type as TypeIcon,
  Zap,
  RotateCcw,
  Volume2,
  Check,
  Film,
  Smartphone,
  Tv,
} from "lucide-react";
import { SubtitleCue } from "../types";
import {
  SmartSplitConfig,
  DEFAULT_SMART_SPLIT_CONFIG,
  SMART_SPLIT_PRESETS,
  analyzeSmartSplit,
  executeBatchSmartSplit,
  SplitPointCandidate,
} from "../utils/smartSplitter";
import { formatSecondsToDisplay } from "../utils/subtitleFormatters";
import { previewSpeakerPersona, getPersonaInfo } from "../utils/voiceoverEngine";

interface SmartSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  onApplySplitCues: (updatedCues: SubtitleCue[]) => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const SmartSplitModal: React.FC<SmartSplitModalProps> = ({
  isOpen,
  onClose,
  cues,
  onApplySplitCues,
  onNotify,
}) => {
  const [config, setConfig] = useState<SmartSplitConfig>(DEFAULT_SMART_SPLIT_CONFIG);
  const [selectedPreset, setSelectedPreset] = useState<string>("standard");
  const [activeTab, setActiveTab] = useState<"preview" | "settings">("preview");
  const [excludedCueIds, setExcludedCueIds] = useState<number[]>([]);
  const [activePreviewingId, setActivePreviewingId] = useState<number | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Analyze cues with current config
  const report = useMemo(() => {
    return analyzeSmartSplit(cues, config);
  }, [cues, config]);

  // Selected candidate items to split
  const itemsToSplit = useMemo(() => {
    return report.items.filter((item) => item.needsSplit && !excludedCueIds.includes(item.originalCue.id));
  }, [report, excludedCueIds]);

  if (!isOpen) return null;

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    if (SMART_SPLIT_PRESETS[key]) {
      setConfig(SMART_SPLIT_PRESETS[key].config);
    }
  };

  const handleToggleExclude = (cueId: number) => {
    setExcludedCueIds((prev) =>
      prev.includes(cueId) ? prev.filter((id) => id !== cueId) : [...prev, cueId]
    );
  };

  const handleApply = () => {
    const cueIdsToSplit = itemsToSplit.map((item) => item.originalCue.id);
    const result = executeBatchSmartSplit(cues, config, cueIdsToSplit);
    onApplySplitCues(result.newCues);

    if (onNotify) {
      onNotify(
        `Đã tách thành công ${result.splitCount} đoạn phụ đề dài thành các câu ngắn gọn theo nhịp nói (Tổng ${result.newCues.length} câu)!`,
        "success"
      );
    }
    onClose();
  };

  // AI-Assisted Smart Split via Gemini server endpoint
  const handleAISmartSplit = async () => {
    setIsProcessingAI(true);
    try {
      const response = await fetch("/api/vietsub/smart-split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cues,
          config,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể tách câu bằng AI.");
      }

      if (data.cues && Array.isArray(data.cues)) {
        onApplySplitCues(data.cues);
        if (onNotify) {
          onNotify(
            `AI đã phân tích nhịp nói tự nhiên và tối ưu ${data.splitCount || "các"} câu phụ đề thành công!`,
            "success"
          );
        }
        onClose();
      }
    } catch (err: any) {
      console.warn("AI Split fallback to local heuristic engine:", err);
      // Fallback seamlessly to local engine
      handleApply();
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Tách câu thông minh (Smart Split)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Natural Speech Pauses
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tự động ngắt các đoạn phụ đề dài thành các câu ngắn vừa tầm mắt dựa trên nhịp thở, dấu câu và liên từ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-slate-400 text-[11px]">Tổng số câu hiện tại</span>
            <div className="text-lg font-bold text-slate-100">{report.totalCues} câu</div>
          </div>

          <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-rose-300 text-[11px] flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Cần tách (quá dài)
            </span>
            <div className="text-lg font-bold text-rose-400">{report.longCuesCount} câu</div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-emerald-300 text-[11px] font-medium">Ước tính sau khi tách</span>
            <div className="text-lg font-bold text-emerald-400">
              {cues.length + (report.estimatedNewCuesCount - report.totalCues)} câu (+{report.estimatedNewCuesCount - report.totalCues})
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-slate-400 text-[11px]">Đoạn dài nhất</span>
            <div className="text-lg font-bold text-amber-400">{report.maxCharCount} ký tự</div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Tiêu chuẩn tách:</span>
            <button
              onClick={() => handleSelectPreset("tiktok")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPreset === "tiktok"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>TikTok / Shorts (32 kt)</span>
            </button>

            <button
              onClick={() => handleSelectPreset("standard")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPreset === "standard"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>YouTube Chuẩn (42 kt)</span>
            </button>

            <button
              onClick={() => handleSelectPreset("cinema")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPreset === "cinema"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Điện ảnh / Phim (52 kt)</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "preview"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Xem trước so sánh ({itemsToSplit.length})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${
                activeTab === "settings"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Tùy chỉnh</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === "preview" ? (
            itemsToSplit.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                <h4 className="text-base font-semibold text-slate-200">
                  Tất cả phụ đề đều đã đạt độ dài lý tưởng!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Không có đoạn nào vượt quá {config.maxCharsPerLine} ký tự hoặc {config.maxDuration} giây.
                  Người xem có thể đọc trọn vẹn và thoải mái.
                </p>
                <button
                  onClick={() => handleSelectPreset("tiktok")}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Thử mức ngắt ngắn hơn (TikTok / Shorts 32 kt)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    Danh sách các câu dài được phát hiện và các mốc ngắt nhịp tự nhiên:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExcludedCueIds([])}
                      className="text-rose-400 hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    <span>•</span>
                    <button
                      onClick={() =>
                        setExcludedCueIds(report.items.filter((i) => i.needsSplit).map((i) => i.originalCue.id))
                      }
                      className="text-slate-400 hover:underline"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                {itemsToSplit.map((item) => {
                  const cue = item.originalCue;
                  const isExcluded = excludedCueIds.includes(cue.id);
                  const isPreviewing = activePreviewingId === cue.id;

                  return (
                    <div
                      key={cue.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all space-y-3"
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => handleToggleExclude(cue.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 accent-rose-500 cursor-pointer"
                          />
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            #{cue.id}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {formatSecondsToDisplay(cue.start)} &rarr; {formatSecondsToDisplay(cue.end)}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {item.reason}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          {item.pausePoints.length > 0 && (
                            <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              Phát hiện {item.pausePoints.length} điểm ngắt nhịp
                            </span>
                          )}
                          <span className="text-emerald-400 font-medium">
                            &rarr; Tách thành {item.splitSegments.length} câu
                          </span>
                        </div>
                      </div>

                      {/* Before and After Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Original Long Cue */}
                        <div className="md:col-span-5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
                              <span>Trước khi tách:</span>
                              <span className="text-slate-400 font-mono">
                                {(cue.textVi || cue.textOriginal).length} ký tự
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-medium">
                              {cue.textVi}
                            </p>
                            {cue.textOriginal && (
                              <p className="text-[11px] text-slate-400 italic mt-1.5 pt-1.5 border-t border-slate-800/80">
                                {cue.textOriginal}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="hidden md:flex md:col-span-1 items-center justify-center text-slate-600">
                          <ArrowRight className="w-5 h-5 text-rose-500" />
                        </div>

                        {/* Split Results */}
                        <div className="md:col-span-6 space-y-1.5">
                          <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center justify-between">
                            <span>Sau khi ngắt nhịp ({item.splitSegments.length} câu):</span>
                            <span className="text-emerald-400 font-mono">
                              Nhịp thở: ~{config.breathPauseGap}s
                            </span>
                          </div>

                          {item.splitSegments.map((subCue, subIdx) => (
                            <div
                              key={subIdx}
                              className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-start justify-between gap-2 text-xs"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-300/80 mb-0.5">
                                  <span className="font-bold text-emerald-400">#{subIdx + 1}</span>
                                  <span>
                                    {formatSecondsToDisplay(subCue.start)} &rarr; {formatSecondsToDisplay(subCue.end)}
                                  </span>
                                  <span className="text-slate-400">
                                    ({(subCue.end - subCue.start).toFixed(1)}s • {subCue.textVi.length} kt)
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-100 font-medium">
                                  {subCue.textVi}
                                </p>
                                {subCue.textOriginal && (
                                  <p className="text-[11px] text-slate-400 italic mt-0.5">
                                    {subCue.textOriginal}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  previewSpeakerPersona(
                                    subCue.voicePersona || "female_young",
                                    subCue.textVi
                                  );
                                }}
                                className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/40 transition-colors shrink-0"
                                title="Nghe thử đoạn này"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Settings Tab */
            <div className="space-y-4 max-w-2xl mx-auto py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  <span>Ngưỡng phân tách câu (Thresholds)</span>
                </h4>

                {/* Max Chars Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Số ký tự tối đa mỗi dòng:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {config.maxCharsPerLine} ký tự
                    </span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={65}
                    step={1}
                    value={config.maxCharsPerLine}
                    onChange={(e) => {
                      setSelectedPreset("custom");
                      setConfig({ ...config, maxCharsPerLine: Number(e.target.value) });
                    }}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>25 kt (TikTok ngắn)</span>
                    <span>42 kt (YouTube chuẩn)</span>
                    <span>65 kt (Phim dài)</span>
                  </div>
                </div>

                {/* Max Duration Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Thời lượng tối đa mỗi đoạn hiển thị:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {config.maxDuration.toFixed(1)} giây
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={6.0}
                    step={0.2}
                    value={config.maxDuration}
                    onChange={(e) => {
                      setSelectedPreset("custom");
                      setConfig({ ...config, maxDuration: Number(e.target.value) });
                    }}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>2.0s</span>
                    <span>4.0s</span>
                    <span>6.0s</span>
                  </div>
                </div>

                {/* Breath pause gap Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Khoảng đệm nhịp thở giữa các câu ngắt (Breath Gap):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {config.breathPauseGap.toFixed(2)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.02}
                    max={0.2}
                    step={0.01}
                    value={config.breathPauseGap}
                    onChange={(e) => {
                      setSelectedPreset("custom");
                      setConfig({ ...config, breathPauseGap: Number(e.target.value) });
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tạo khoảng hở nhỏ tự nhiên giữa 2 câu để mắt người xem dễ nhận diện câu mới xuất hiện.
                  </p>
                </div>
              </div>

              {/* Natural speech pause rules */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Quy tắc nhận diện nhịp nói (Speech Pause Rules)</span>
                </h4>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.splitByPunctuation}
                    onChange={(e) =>
                      setConfig({ ...config, splitByPunctuation: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 accent-rose-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">
                      Ưu tiên ngắt tại dấu câu (. , ? ! ; : — …)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Dấu chấm và dấu phẩy là vị trí diễn giả dừng lại lấy hơi tự nhiên nhất.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.splitByConjunctions}
                    onChange={(e) =>
                      setConfig({ ...config, splitByConjunctions: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 accent-rose-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">
                      Nhận diện liên từ nối (và, nhưng, bởi vì, cho nên, tuy nhiên, and, but, so...)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Ngắt nhịp trước các từ nối để giữ vế câu nguyên vẹn ngữ pháp.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.splitOriginalText}
                    onChange={(e) =>
                      setConfig({ ...config, splitOriginalText: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 accent-rose-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">
                      Đồng thời tách lời thoại gốc (Original Spoken Text)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Giữ đồng bộ phụ đề song ngữ (Bilingual) chuẩn chỉnh cả hai thứ tiếng.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setConfig(DEFAULT_SMART_SPLIT_CONFIG);
                    setSelectedPreset("standard");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mặc định</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAISmartSplit}
              disabled={isProcessingAI || itemsToSplit.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all disabled:opacity-50"
              title="Phân tích nhịp nói ngữ cảnh sâu bằng Gemini AI"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{isProcessingAI ? "AI đang phân tích..." : "Tách bằng Gemini AI"}</span>
            </button>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Hoặc áp dụng tức thì bằng thuật toán ngữ âm)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Đóng
            </button>

            <button
              id="btn-apply-smart-split"
              onClick={handleApply}
              disabled={itemsToSplit.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Scissors className="w-4 h-4" />
              <span>
                Áp dụng Smart Split ({itemsToSplit.length} câu)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
