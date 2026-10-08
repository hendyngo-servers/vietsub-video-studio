import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  FileText,
  FileCode,
  FileType,
  Sparkles,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Film,
  Sliders,
  Radio,
  Loader2,
  Minimize2,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  SubtitleCue,
  SubtitleDisplayMode,
  SubtitleStyle,
  VideoExportProgress,
  VoiceoverConfig,
} from "../types";
import {
  exportToSRT,
  exportToVTT,
  exportToTXT,
  triggerDownload,
} from "../utils/subtitleFormatters";
import {
  AVAILABLE_VOICES,
  DEFAULT_VOICEOVER_CONFIG,
  previewVoice,
  stopVoicePreview,
} from "../utils/voiceoverEngine";
import { exportVideoWithVietsubAndVoiceover } from "../utils/videoExporter";
import { ExportPreviewPlayer } from "./ExportPreviewPlayer";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  videoTitle?: string;
  videoUrl: string;
  subtitleStyle: SubtitleStyle;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  cues,
  videoTitle = "video",
  videoUrl,
  subtitleStyle,
  onNotify,
}) => {
  // Navigation Tabs: 'video' (Export MP4/WebM with burned sub & voiceover), 'preview' (Live Preview Player), or 'subtitles' (SRT, VTT, etc.)
  const [activeTab, setActiveTab] = useState<"video" | "preview" | "subtitles">("video");

  // Subtitle File Export State
  const [format, setFormat] = useState<"srt" | "vtt" | "txt" | "json">("srt");
  const [mode, setMode] = useState<SubtitleDisplayMode>("vi");
  const [copied, setCopied] = useState(false);

  // Voiceover & Video Export State
  const [voiceover, setVoiceover] = useState<VoiceoverConfig>(DEFAULT_VOICEOVER_CONFIG);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Export Progress State
  const [exportProgress, setExportProgress] = useState<VideoExportProgress>({
    isExporting: false,
    step: "",
    percent: 0,
    currentSeconds: 0,
    totalSeconds: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      stopVoicePreview();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [onClose]);

  if (!isOpen) return null;

  // Subtitle formatters
  const getExportContent = () => {
    switch (format) {
      case "srt":
        return exportToSRT(cues, mode);
      case "vtt":
        return exportToVTT(cues, mode);
      case "txt":
        return exportToTXT(cues, true);
      case "json":
        return JSON.stringify(cues, null, 2);
    }
  };

  const previewContent = getExportContent();

  const handleDownloadSubtitles = () => {
    const safeName = videoTitle.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 30) || "vietsub";
    const filename = `${safeName}_vietsub.${format}`;
    const mimeMap = {
      srt: "text/plain;charset=utf-8",
      vtt: "text/vtt;charset=utf-8",
      txt: "text/plain;charset=utf-8",
      json: "application/json;charset=utf-8",
    };
    triggerDownload(previewContent, filename, mimeMap[format]);
    if (onNotify) onNotify(`Đã tải xuống tệp ${filename}`, "success");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview Voice Sample
  const handleToggleVoicePreview = async () => {
    if (isPlayingPreview) {
      stopVoicePreview();
      setIsPlayingPreview(false);
      return;
    }

    setPreviewError(null);
    setIsPlayingPreview(true);

    const firstCueText =
      cues.length > 0
        ? (voiceover.readMode === "original" ? cues[0].textOriginal : cues[0].textVi) || cues[0].textVi
        : "Xin chào quý vị, đây là bản thuyết minh tiếng Việt tự động cho video!";

    try {
      await previewVoice(voiceover.voiceId, firstCueText, voiceover.speechRate, () => {
        setIsPlayingPreview(false);
      });
    } catch (err: any) {
      setIsPlayingPreview(false);
      setPreviewError(err.message || "Không thể phát âm thanh thử.");
    }
  };

  // Start Video Export
  const handleStartVideoExport = async () => {
    if (!videoUrl) {
      if (onNotify) onNotify("Không tìm thấy video để xuất.", "error");
      return;
    }

    stopVoicePreview();
    setIsPlayingPreview(false);

    abortControllerRef.current = new AbortController();

    try {
      await exportVideoWithVietsubAndVoiceover({
        videoUrl,
        cues,
        subtitleStyle,
        voiceover,
        videoTitle,
        onProgress: (p) => setExportProgress(p),
        signal: abortControllerRef.current.signal,
      });

      if (onNotify) {
        onNotify(
          voiceover.enabled
            ? "Đã xuất video có phụ đề Vietsub và thuyết minh thành công!"
            : "Đã xuất video có phụ đề Vietsub thành công!",
          "success"
        );
      }
    } catch (err: any) {
      if (abortControllerRef.current?.signal.aborted) {
        if (onNotify) onNotify("Đã hủy quá trình xuất video.", "info");
      } else {
        console.error("Video export failed:", err);
        if (onNotify) onNotify(err.message || "Xuất video không thành công.", "error");
      }
    } finally {
      setExportProgress({
        isExporting: false,
        step: "",
        percent: 0,
        currentSeconds: 0,
        totalSeconds: 0,
      });
      abortControllerRef.current = null;
    }
  };

  // Cancel Video Export
  const handleCancelVideoExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopVoicePreview();
  };

  const selectedVoice = AVAILABLE_VOICES.find((v) => v.id === voiceover.voiceId) || AVAILABLE_VOICES[0];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="export-modal-dialog"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Xuất Video & Phụ đề</h3>
              <p className="text-xs text-slate-400">
                Xuất video hoàn chỉnh kèm Vietsub hoặc lồng tiếng thuyết minh AI theo mốc thời gian
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Minimize / Hide Button */}
            <button
              id="btn-minimize-export-modal"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 text-xs font-medium transition-colors border border-slate-700/60"
              title="Ẩn cửa sổ pop-up (Thu nhỏ để tiếp tục làm việc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ẩn cửa sổ</span>
            </button>
            <button
              id="btn-close-export-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 pt-2">
          <button
            id="tab-export-video"
            onClick={() => {
              if (!exportProgress.isExporting) setActiveTab("video");
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "video"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Xuất Video (Kèm Vietsub & Thuyết minh)</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Mới
            </span>
          </button>
          <button
            id="tab-export-preview"
            onClick={() => {
              if (!exportProgress.isExporting) setActiveTab("preview");
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "preview"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Xem & Nghe Trước Thành Phẩm</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Live
            </span>
          </button>
          <button
            id="tab-export-subtitles"
            onClick={() => {
              if (!exportProgress.isExporting) setActiveTab("subtitles");
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "subtitles"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tệp Phụ đề (.SRT, .VTT, .TXT)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* TAB 1: VIDEO EXPORT WITH VIETSUB & VOICEOVER */}
          {activeTab === "video" && (
            <div className="space-y-5">
              {/* Progress View if exporting */}
              {exportProgress.isExporting ? (
                <div
                  id="export-progress-panel"
                  className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin flex items-center justify-center" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      {voiceover.enabled
                        ? "Đang xuất video có Vietsub và lồng thuyết minh"
                        : "Đang xuất video có phụ đề Vietsub"}
                    </h4>
                    <p className="text-xs text-slate-400">{exportProgress.step}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(5, exportProgress.percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between w-full max-w-md text-[11px] text-slate-400">
                    <span>Tiến trình: {exportProgress.percent}%</span>
                    {exportProgress.totalSeconds > 0 && (
                      <span>
                        Thời lượng: {exportProgress.currentSeconds}s / {Math.round(exportProgress.totalSeconds)}s
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="btn-minimize-while-exporting"
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                      title="Thu nhỏ cửa sổ để tiếp tục thao tác khác, tiến trình xuất vẫn chạy nền"
                    >
                      <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ẩn cửa sổ & Chạy nền</span>
                    </button>
                    <button
                      id="btn-cancel-export-video"
                      type="button"
                      onClick={handleCancelVideoExport}
                      className="px-4 py-2 rounded-xl border border-rose-800/80 text-rose-300 hover:bg-rose-950/60 text-xs font-semibold transition-colors"
                    >
                      Hủy xuất video
                    </button>
                  </div>
                </div>
              ) : (
                /* Configuration Form */
                <div className="space-y-5">
                  {/* Quick Preview Prompt Card */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 flex items-center justify-between transition-all group shadow-sm text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-amber-200">
                          Xem & Nghe Trước Thành Phẩm (Live Preview)
                        </div>
                        <div className="text-[11px] text-amber-400/80">
                          Kiểm tra video phát kèm phụ đề Vietsub và giọng thuyết minh AI trước khi tải xuống
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">
                      Mở xem ngay →
                    </span>
                  </button>

                  {/* Voiceover Master Toggle Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            voiceover.enabled
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-white">
                              Thuyết minh AI cho video
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Lồng tiếng tự động
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Tự động phát giọng đọc tiếng Việt khớp từng câu phụ đề khi xuất video
                          </p>
                        </div>
                      </div>

                      {/* Switch Button */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          id="toggle-voiceover-enabled"
                          type="checkbox"
                          checked={voiceover.enabled}
                          onChange={(e) =>
                            setVoiceover((prev) => ({ ...prev, enabled: e.target.checked }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {/* Expandable Voiceover Settings */}
                    {voiceover.enabled && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-fadeIn">
                        {/* Voice Selection */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-2">
                            Chọn giọng đọc thuyết minh:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {AVAILABLE_VOICES.map((v) => {
                              const isSelected = voiceover.voiceId === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() =>
                                    setVoiceover((prev) => ({ ...prev, voiceId: v.id }))
                                  }
                                  className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition-all ${
                                    isSelected
                                      ? "bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-950/40"
                                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-xs sm:text-sm">{v.name}</span>
                                      {v.badge && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                                          {v.badge}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                      {v.description}
                                    </div>
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                      isSelected
                                        ? "border-emerald-400 bg-emerald-500 text-white"
                                        : "border-slate-600"
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Audio Preview Button */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-slate-300">
                              Đang chọn: <strong>{selectedVoice.name}</strong>
                            </span>
                          </div>

                          <button
                            id="btn-preview-voiceover"
                            type="button"
                            onClick={handleToggleVoicePreview}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isPlayingPreview
                                ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                                : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
                            }`}
                          >
                            {isPlayingPreview ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Dừng nghe</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Nghe thử giọng đọc</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Multi-voice Persona Option in Export Modal */}
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                              <span>Lồng tiếng phân vai nhân vật (Nam / Nữ / Già / Trẻ)</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Tự động chuyển giọng đọc theo vai diễn nhân vật đã nhận diện trong danh sách phụ đề
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={voiceover.autoMultiVoice}
                            onChange={(e) =>
                              setVoiceover((prev) => ({ ...prev, autoMultiVoice: e.target.checked }))
                            }
                            className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                          />
                        </div>

                        {previewError && (
                          <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/60 p-2 rounded-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{previewError}</span>
                          </div>
                        )}

                        {/* Controls: Ducking & Volume */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                          {/* Ducking slider */}
                          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 font-medium">Âm lượng video gốc khi nói:</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {Math.round((voiceover.originalVolumeDucking ?? 0.25) * 100)}%
                              </span>
                            </div>
                            <input
                              id="slider-original-volume-ducking"
                              type="range"
                              min="0.05"
                              max="0.8"
                              step="0.05"
                              value={voiceover.originalVolumeDucking ?? 0.25}
                              onChange={(e) =>
                                setVoiceover((prev) => ({
                                  ...prev,
                                  originalVolumeDucking: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="text-[10px] text-slate-500">
                              Tự động giảm âm lượng video gốc để giọng thuyết minh nổi bật, rõ nét.
                            </div>
                          </div>

                          {/* Speech rate slider */}
                          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 font-medium">Tốc độ đọc thuyết minh:</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {voiceover.speechRate.toFixed(1)}x
                              </span>
                            </div>
                            <input
                              id="slider-speech-rate"
                              type="range"
                              min="0.8"
                              max="1.3"
                              step="0.05"
                              value={voiceover.speechRate}
                              onChange={(e) =>
                                setVoiceover((prev) => ({
                                  ...prev,
                                  speechRate: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="text-[10px] text-slate-500">
                              Chuẩn 1.0x. Tăng lên nếu video nói nhanh để câu đọc kịp mốc thời gian.
                            </div>
                          </div>
                        </div>

                        {/* Read Mode */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                            Nội dung đọc thuyết minh:
                          </label>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setVoiceover((prev) => ({ ...prev, readMode: "vi" }))}
                              className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                                voiceover.readMode === "vi"
                                  ? "bg-emerald-950/50 border-emerald-500 text-white"
                                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              🇻🇳 Đọc bản dịch Tiếng Việt (Khuyên dùng)
                            </button>
                            <button
                              type="button"
                              onClick={() => setVoiceover((prev) => ({ ...prev, readMode: "bilingual" }))}
                              className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                                voiceover.readMode === "bilingual"
                                  ? "bg-emerald-950/50 border-emerald-500 text-white"
                                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              🌐 Đọc Song ngữ (Việt + Gốc)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary & Subtitle Style notice */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span>
                        Video xuất ra sẽ được lồng sẵn <strong>{cues.length} câu phụ đề Vietsub</strong> với kiểu chữ,
                        màu sắc và vị trí hiện tại trên màn hình.
                      </span>
                      {voiceover.enabled && (
                        <span className="block text-emerald-300 mt-1 font-medium">
                          ✨ Đã kích hoạt thuyết minh AI: Giọng "{selectedVoice.name}" sẽ tự động đọc tiếng Việt khớp theo từng câu!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVIEW OUTPUT (VIDEO + BURNED SUB + VOICEOVER) */}
          {activeTab === "preview" && (
            <ExportPreviewPlayer
              videoUrl={videoUrl}
              cues={cues}
              subtitleStyle={subtitleStyle}
              voiceover={voiceover}
              onChangeVoiceover={setVoiceover}
              onProceedExport={handleStartVideoExport}
            />
          )}

          {/* TAB 3: SUBTITLE FILES (.SRT, .VTT, .TXT, .JSON) */}
          {activeTab === "subtitles" && (
            <div className="space-y-4">
              {/* Format selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Định dạng tệp xuất ra:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "srt", label: ".SRT", desc: "Phổ biến nhất", icon: FileText },
                    { id: "vtt", label: ".VTT", desc: "Web Video", icon: FileCode },
                    { id: "txt", label: ".TXT", desc: "Văn bản thô", icon: FileType },
                    { id: "json", label: ".JSON", desc: "Dữ liệu mốc", icon: Sparkles },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setFormat(fmt.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          format === fmt.id
                            ? "bg-emerald-950/40 border-emerald-500 text-white font-bold"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                        <div className="text-xs">{fmt.label}</div>
                        <div className="text-[10px] text-slate-500">{fmt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtitle Mode */}
              {format !== "json" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Nội dung dòng phụ đề:
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "vi", label: "Chỉ Tiếng Việt" },
                      { id: "bilingual", label: "Song ngữ (Gốc + Việt)" },
                      { id: "original", label: "Chỉ Lời thoại gốc" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`py-2 px-2 rounded-xl border transition-all ${
                          mode === m.id
                            ? "bg-slate-800 border-rose-500 text-white font-semibold"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400">Xem trước nội dung:</label>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
                  </button>
                </div>
                <pre className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-y-auto whitespace-pre-wrap select-all">
                  {previewContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              stopVoicePreview();
              onClose();
            }}
            disabled={exportProgress.isExporting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Đóng
          </button>

          {activeTab === "preview" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                ← Tùy chỉnh thông số xuất
              </button>
              <button
                id="btn-confirm-export-from-preview"
                onClick={handleStartVideoExport}
                disabled={exportProgress.isExporting || cues.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <Film className="w-4 h-4" />
                <span>Bắt đầu xuất video ngay</span>
              </button>
            </div>
          ) : activeTab === "video" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all"
                title="Xem thử video và nghe thuyết minh trước khi xuất"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Xem/Nghe Thử</span>
              </button>
              <button
                id="btn-confirm-export-video"
                onClick={handleStartVideoExport}
                disabled={exportProgress.isExporting || cues.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {exportProgress.isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xuất video...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>
                      {voiceover.enabled ? "Bắt đầu xuất video có thuyết minh" : "Bắt đầu xuất video có phụ đề"}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              id="btn-confirm-download-subtitles"
              onClick={handleDownloadSubtitles}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Tải xuống file .{format.toUpperCase()}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
