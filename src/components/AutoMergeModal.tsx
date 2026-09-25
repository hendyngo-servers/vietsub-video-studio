import React, { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  GitMerge,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Check,
  Zap,
} from "lucide-react";
import { SubtitleCue } from "../types";
import {
  autoMergeAndCleanCues,
  analyzeCueIssues,
  AutoMergeConfig,
  DEFAULT_CLEANER_CONFIG,
} from "../utils/subtitleCleaner";

interface AutoMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  onApplyMergedCues: (cleanedCues: SubtitleCue[]) => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const AutoMergeModal: React.FC<AutoMergeModalProps> = ({
  isOpen,
  onClose,
  cues,
  onApplyMergedCues,
  onNotify,
}) => {
  const [config, setConfig] = useState<AutoMergeConfig>(DEFAULT_CLEANER_CONFIG);
  const [activeTab, setActiveTab] = useState<"preview" | "issues" | "settings">("preview");

  // Real-time analysis and preview calculation
  const report = useMemo(() => {
    return analyzeCueIssues(cues, config);
  }, [cues, config]);

  const mergeResult = useMemo(() => {
    return autoMergeAndCleanCues(cues, config);
  }, [cues, config]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyMergedCues(mergeResult.cleanedCues);
    if (onNotify) {
      onNotify(
        `Đã tự động dọn dẹp và gộp ${mergeResult.mergedCount} câu vụn/chồng chéo (còn lại ${mergeResult.cleanedCues.length} câu)!`,
        "success"
      );
    }
    onClose();
  };

  const handleQuickReset = () => {
    setConfig(DEFAULT_CLEANER_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Tự động gộp & Dọn dẹp phụ đề
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Smart Merge
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Khắc phục tệp phụ đề bị vụn vặt, thời lượng quá ngắn hoặc các mốc thời gian chồng chéo nhau
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

        {/* Issue Highlights Banner */}
        <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-950/90 border-b border-slate-800 text-xs">
          <div className="p-3 text-center">
            <div className="text-slate-400 text-[11px] mb-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Câu quá ngắn (&lt;{config.minDuration}s)</span>
            </div>
            <div className="text-base font-bold text-amber-400">
              {report.shortCuesCount}{" "}
              <span className="text-xs font-normal text-slate-400">câu</span>
            </div>
          </div>

          <div className="p-3 text-center">
            <div className="text-slate-400 text-[11px] mb-0.5 flex items-center justify-center gap-1">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Mốc bị chồng chéo (Overlap)</span>
            </div>
            <div className="text-base font-bold text-rose-400">
              {report.overlappingCount}{" "}
              <span className="text-xs font-normal text-slate-400">cặp</span>
            </div>
          </div>

          <div className="p-3 text-center bg-emerald-950/20">
            <div className="text-emerald-400 text-[11px] mb-0.5 flex items-center justify-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gộp tối ưu được</span>
            </div>
            <div className="text-base font-bold text-emerald-300">
              -{mergeResult.mergedCount}{" "}
              <span className="text-xs font-normal text-emerald-400">
                ({cues.length} &rarr; {mergeResult.cleanedCues.length} câu)
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 text-xs">
          <button
            onClick={() => setActiveTab("preview")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xem trước kết quả ({mergeResult.cleanedCues.length} câu)</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tùy chỉnh ngưỡng gộp</span>
          </button>

          <button
            onClick={() => setActiveTab("issues")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "issues"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Chi tiết lỗi phát hiện ({report.totalIssues})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Danh sách phụ đề sau khi áp dụng thuật toán gộp thông minh:
                </span>
                <span className="font-mono text-emerald-400">
                  {mergeResult.cleanedCues.length} câu hợp lệ
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {mergeResult.cleanedCues.map((cue) => {
                  const duration = (cue.end - cue.start).toFixed(2);
                  return (
                    <div
                      key={cue.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400">
                            #{cue.id}
                          </span>
                          <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {cue.startTime || `${cue.start}s`} &rarr; {cue.endTime || `${cue.end}s`}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({duration}s)
                          </span>
                        </div>
                        {cue.speakerRole && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">
                            {cue.speakerRole}
                          </span>
                        )}
                      </div>

                      <div className="text-slate-100 font-medium leading-relaxed">
                        {cue.textVi}
                      </div>

                      {cue.textOriginal && (
                        <div className="text-[11px] text-slate-400 italic">
                          {cue.textOriginal}
                        </div>
                      )}

                      {cue.secondaryText && (
                        <div className="text-[11px] text-teal-400/90 font-mono">
                          [Phụ]: {cue.secondaryText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4 text-xs">
              {/* Min Duration Setting */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200">
                    Thời lượng tối thiểu của mỗi câu (Min Duration):
                  </label>
                  <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                    {config.minDuration}s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Các câu có thời lượng ngắn hơn ngưỡng này sẽ được tự động gộp vào câu liền kề để người xem đọc kịp và không bị chớp giật trên màn hình.
                </p>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[0.5, 0.8, 1.0, 1.2, 1.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig({ ...config, minDuration: val })}
                      className={`py-1.5 rounded-lg border font-mono font-semibold transition-all ${
                        config.minDuration === val
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {val}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Merge Overlaps Setting */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">
                      Tự động gộp mốc chồng chéo (Merge Overlaps)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Khi thời điểm kết thúc của câu trước đè lên thời điểm bắt đầu của câu kế tiếp
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.mergeOverlaps}
                    onChange={(e) =>
                      setConfig({ ...config, mergeOverlaps: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Max Gap to Merge */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200">
                    Khoảng cách tối đa để nối câu (Max Gap):
                  </label>
                  <span className="font-mono font-bold text-teal-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                    {config.maxGapToMerge}s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nếu khoảng nghỉ giữa 2 câu nhỏ hơn ngưỡng này và có câu bị ngắn, hệ thống sẽ gộp liền mạch thành một câu hoàn chỉnh.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[0.2, 0.4, 0.6, 1.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig({ ...config, maxGapToMerge: val })}
                      className={`py-1.5 rounded-lg border font-mono font-semibold transition-all ${
                        config.maxGapToMerge === val
                          ? "bg-teal-600 border-teal-500 text-white shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {val}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleQuickReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mặc định</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "issues" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Tìm thấy {report.totalIssues} vấn đề cần dọn dẹp trong tệp phụ đề hiện tại:
              </div>

              {report.details.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <div>Không phát hiện câu bị lỗi thời lượng hay chồng chéo mốc thời gian!</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {report.details.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-2.5"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          issue.issueType === "overlap"
                            ? "text-rose-400"
                            : issue.issueType === "short"
                            ? "text-amber-400"
                            : "text-red-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-200">
                          {issue.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Kết quả:{" "}
            <span className="font-bold text-white">
              {cues.length} câu &rarr; {mergeResult.cleanedCues.length} câu
            </span>{" "}
            <span className="text-emerald-400">(-{mergeResult.mergedCount} câu dư thừa)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={mergeResult.mergedCount === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                mergeResult.mergedCount > 0
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Áp dụng gộp tự động ({mergeResult.mergedCount} câu)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
