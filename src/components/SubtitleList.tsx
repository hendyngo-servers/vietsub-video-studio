import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Search,
  ArrowDownNarrowWide,
  Check,
  ChevronDown,
  Sparkles,
  MoveRight,
  RotateCcw,
  GitMerge,
  Volume2,
  Users,
  AlertTriangle,
  Zap,
  Layers,
  Scissors,
  Download,
  Languages,
  Globe,
  Film,
  FileText,
  FileCode,
  FileType,
  Smartphone,
  Cloud,
  ChevronRight,
  ListOrdered,
  Sliders,
  Image,
  Link,
  Bot,
  ArrowUpRight,
  Mic,
  Copy,
} from "lucide-react";
import { SubtitleCue, SpeakerVoicePersona } from "../types";
import {
  formatSecondsToDisplay,
  formatSecondsToSrtTime,
  exportToSRT,
  exportToVTT,
  exportToTXT,
  triggerDownload,
} from "../utils/subtitleFormatters";
import {
  previewVoice,
  stopVoicePreview,
  previewSpeakerPersona,
  getPersonaInfo,
  SPEAKER_PERSONAS,
} from "../utils/voiceoverEngine";
import { AutoMergeModal } from "./AutoMergeModal";
import { SmartSplitModal } from "./SmartSplitModal";
import {
  analyzeCueIssues,
  autoMergeAndCleanCues,
  DEFAULT_CLEANER_CONFIG,
} from "../utils/subtitleCleaner";
import {
  isCueLong,
  smartSplitSingleCue,
  analyzeSmartSplit,
  executeBatchSmartSplit,
  DEFAULT_SMART_SPLIT_CONFIG,
} from "../utils/smartSplitter";

export type RightPanelTab = "subtitles" | "ai_tools" | "ai_translate" | "download";

interface SubtitleListProps {
  cues: SubtitleCue[];
  currentTime: number;
  videoDuration?: number;
  activeTab?: RightPanelTab;
  onTabChange?: (tab: RightPanelTab) => void;
  onSelectCue: (time: number) => void;
  onUpdateCue: (updatedCue: SubtitleCue) => void;
  onDeleteCue: (id: number) => void;
  onAddCue: (atTime?: number) => void;
  onShiftAllCues: (offsetSeconds: number) => void;
  onOpenRefineModal: () => void;
  onSaveEdits?: () => void;
  onMergeCues?: (firstCueId: number, secondCueId: number) => void;
  onOpenVoiceoverModal?: () => void;
  onDetectSpeakers?: () => void;
  isDetectingSpeakers?: boolean;
  onBatchUpdateCues?: (updatedCues: SubtitleCue[]) => void;
  onOpenAiGenerate?: () => void;
  onOpenExportModal?: () => void;
  onOpenStyleModal?: () => void;
  onOpenCapCutModal?: () => void;
  onOpenCoverModal?: () => void;
  onOpenWebDramaModal?: () => void;
  onOpenUniversalTranslatorModal?: () => void;
  onOpenCloudflareModal?: () => void;
  onOpenAppsHub?: () => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const SubtitleList: React.FC<SubtitleListProps> = ({
  cues,
  currentTime,
  videoDuration = 30,
  onSelectCue,
  onUpdateCue,
  onDeleteCue,
  onAddCue,
  onShiftAllCues,
  onOpenRefineModal,
  onSaveEdits,
  onMergeCues,
  onOpenVoiceoverModal,
  onDetectSpeakers,
  isDetectingSpeakers,
  onBatchUpdateCues,
  onOpenAiGenerate,
  onOpenExportModal,
  onOpenStyleModal,
  onOpenCapCutModal,
  onOpenCoverModal,
  onOpenWebDramaModal,
  onOpenUniversalTranslatorModal,
  onOpenCloudflareModal,
  onOpenAppsHub,
  onNotify,
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<RightPanelTab>("subtitles");
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab: RightPanelTab) => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };
  const [searchQuery, setSearchQuery] = useState("");
  // Subtitle list browsing is independent from video playback per user specification
  const [autoScroll, setAutoScroll] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [timeShiftVal, setTimeShiftVal] = useState<number>(0.2);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [selectedCueIds, setSelectedCueIds] = useState<number[]>([]);
  const [activePlayingCueId, setActivePlayingCueId] = useState<number | null>(null);
  const [isAutoMergeModalOpen, setIsAutoMergeModalOpen] = useState(false);
  const [isSmartSplitModalOpen, setIsSmartSplitModalOpen] = useState(false);
  const [cleanToast, setCleanToast] = useState<string | null>(null);

  // Instant one-click export helpers
  const handleInstantExportSRT = () => {
    if (cues.length === 0) {
      onNotify?.("Chưa có phụ đề để xuất file SRT.", "error");
      return;
    }
    const content = exportToSRT(cues, "vi");
    triggerDownload(content, "phu-de-vietsub.srt", "text/plain;charset=utf-8");
    onNotify?.("Đã xuất và tải xuống tệp phu-de-vietsub.srt!", "success");
  };

  const handleInstantExportVTT = () => {
    if (cues.length === 0) {
      onNotify?.("Chưa có phụ đề để xuất file VTT.", "error");
      return;
    }
    const content = exportToVTT(cues, "vi");
    triggerDownload(content, "phu-de-vietsub.vtt", "text/vtt;charset=utf-8");
    onNotify?.("Đã xuất và tải xuống tệp phu-de-vietsub.vtt!", "success");
  };

  const handleInstantExportTXT = () => {
    if (cues.length === 0) {
      onNotify?.("Chưa có phụ đề để xuất kịch bản TXT.", "error");
      return;
    }
    const content = exportToTXT(cues, true, "vi");
    triggerDownload(content, "kich-ban-phu-de.txt", "text/plain;charset=utf-8");
    onNotify?.("Đã xuất và tải xuống kịch bản TXT!", "success");
  };

  const handleInstantBackupJSON = () => {
    const projectData = {
      app: "vietsub-video-studio",
      version: "1.0",
      timestamp: new Date().toISOString(),
      cuesCount: cues.length,
      cues,
    };
    triggerDownload(JSON.stringify(projectData, null, 2), "du-an-vietsub.json", "application/json");
    onNotify?.("Đã sao lưu toàn bộ dự án vào tệp du-an-vietsub.json!", "success");
  };

  // Analyze cues for short durations, overlapping timestamps, and micro-gaps
  const cueIssues = useMemo(() => {
    return analyzeCueIssues(cues);
  }, [cues]);

  // Analyze cues for long segments exceeding readable line limits
  const smartSplitAnalysis = useMemo(() => {
    return analyzeSmartSplit(cues);
  }, [cues]);

  // Apply cleaned cues batch update
  const handleApplyCleanedCues = (cleanedCues: SubtitleCue[]) => {
    if (onBatchUpdateCues) {
      onBatchUpdateCues(cleanedCues);
    } else {
      cleanedCues.forEach((c) => onUpdateCue(c));
      const cleanedIds = new Set(cleanedCues.map((c) => c.id));
      cues.forEach((c) => {
        if (!cleanedIds.has(c.id)) {
          onDeleteCue(c.id);
        }
      });
    }
  };

  // Quick 1-click clean for short/overlapping cues
  const handleQuickAutoClean = () => {
    const result = autoMergeAndCleanCues(cues, DEFAULT_CLEANER_CONFIG);
    if (result.mergedCount > 0) {
      handleApplyCleanedCues(result.cleanedCues);
      setCleanToast(`Đã tự động gộp ${result.mergedCount} câu vụn/chồng chéo!`);
      setTimeout(() => setCleanToast(null), 4000);
    } else {
      setCleanToast("Không có câu nào bị chồng chéo hay quá ngắn để gộp.");
      setTimeout(() => setCleanToast(null), 3000);
    }
  };

  // Quick 1-click smart split for all long cues based on natural speech pauses
  const handleQuickSmartSplit = () => {
    const result = executeBatchSmartSplit(cues, DEFAULT_SMART_SPLIT_CONFIG);
    if (result.splitCount > 0) {
      handleApplyCleanedCues(result.newCues);
      setCleanToast(`Đã tự động tách ${result.splitCount} đoạn dài thành ${result.newCues.length} câu ngắn gọn theo nhịp nói!`);
      setTimeout(() => setCleanToast(null), 4000);
    } else {
      setCleanToast("Tất cả câu đều đã ngắn gọn, vừa tầm mắt người xem.");
      setTimeout(() => setCleanToast(null), 3000);
    }
  };

  // 1-click smart split for a single cue
  const handleSmartSplitSingleCue = (cueId: number) => {
    const targetCue = cues.find((c) => c.id === cueId);
    if (!targetCue) return;
    const segments = smartSplitSingleCue(targetCue);
    if (segments.length <= 1) {
      setCleanToast(`Câu #${cueId} không đủ dài để tách.`);
      setTimeout(() => setCleanToast(null), 3000);
      return;
    }
    const idx = cues.findIndex((c) => c.id === cueId);
    const nextCues = [...cues];
    nextCues.splice(idx, 1, ...segments);
    const reIndexed = nextCues.map((c, i) => ({ ...c, id: i + 1 }));
    handleApplyCleanedCues(reIndexed);
    setCleanToast(`Đã ngắt câu #${idx + 1} thành ${segments.length} câu ngắn theo nhịp nói tự nhiên!`);
    setTimeout(() => setCleanToast(null), 4000);
  };

  const activeCardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle selection of a cue for merging
  const handleToggleSelectCue = (cueId: number) => {
    setSelectedCueIds((prev) => {
      if (prev.includes(cueId)) {
        return prev.filter((id) => id !== cueId);
      }
      if (prev.length >= 2) {
        return [cueId];
      }
      return [...prev, cueId];
    });
  };

  // Analyze selected cues to determine if they are adjacent
  const selectedCuesAnalysis = useMemo(() => {
    if (selectedCueIds.length !== 2) {
      return {
        isAdjacent: false,
        firstCue: null as SubtitleCue | null,
        secondCue: null as SubtitleCue | null,
        firstIndex: -1,
        secondIndex: -1,
      };
    }

    const idx0 = cues.findIndex((c) => c.id === selectedCueIds[0]);
    const idx1 = cues.findIndex((c) => c.id === selectedCueIds[1]);

    if (idx0 === -1 || idx1 === -1) {
      return { isAdjacent: false, firstCue: null, secondCue: null, firstIndex: -1, secondIndex: -1 };
    }

    const firstIndex = Math.min(idx0, idx1);
    const secondIndex = Math.max(idx0, idx1);
    const isAdjacent = secondIndex - firstIndex === 1;

    return {
      isAdjacent,
      firstCue: cues[firstIndex],
      secondCue: cues[secondIndex],
      firstIndex,
      secondIndex,
    };
  }, [cues, selectedCueIds]);

  // Handle merging the two adjacent cues
  const handleMergeSelected = () => {
    if (!selectedCuesAnalysis.isAdjacent || !selectedCuesAnalysis.firstCue || !selectedCuesAnalysis.secondCue) {
      return;
    }

    const { firstCue, secondCue } = selectedCuesAnalysis;
    if (onMergeCues) {
      onMergeCues(firstCue.id, secondCue.id);
    } else {
      const mergedCue: SubtitleCue = {
        ...firstCue,
        end: secondCue.end,
        endTime: secondCue.endTime,
        textVi: `${firstCue.textVi.trim()} ${secondCue.textVi.trim()}`.trim(),
        textOriginal: [firstCue.textOriginal?.trim(), secondCue.textOriginal?.trim()]
          .filter(Boolean)
          .join(" ")
          .trim(),
      };
      onUpdateCue(mergedCue);
      onDeleteCue(secondCue.id);
    }

    setSelectedCueIds([]);
  };

  // Note: Synchronization with video playback is not required.
  // The list position remains completely stable while the user scrolls, reads, or edits cues.
  const filteredCues = cues.filter(
    (c) =>
      c.textVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.textOriginal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTimeAdjust = (cue: SubtitleCue, field: "start" | "end", delta: number) => {
    const newStart = field === "start" ? Math.max(0, Number((cue.start + delta).toFixed(2))) : cue.start;
    const newEnd = field === "end" ? Math.max(newStart + 0.2, Number((cue.end + delta).toFixed(2))) : cue.end;

    onUpdateCue({
      ...cue,
      start: newStart,
      end: newEnd,
      startTime: formatSecondsToSrtTime(newStart).replace(",", "."),
      endTime: formatSecondsToSrtTime(newEnd).replace(",", "."),
    });
  };

  return (
    <div
      id="subtitle-list-container"
      className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
    >
      {/* Horizontal Tabs: 'Công cụ AI', 'Dịch AI', 'Tải xuống', and 'Phụ đề' */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/90 px-2 pt-2 gap-1 overflow-x-auto scrollbar-none shrink-0 select-none">
        <button
          id="tab-btn-subtitles"
          type="button"
          onClick={() => setActiveTab("subtitles")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "subtitles"
              ? "bg-slate-900 text-rose-400 border-rose-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Phụ đề</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
            {cues.length}
          </span>
        </button>

        <button
          id="tab-btn-ai-tools"
          type="button"
          onClick={() => setActiveTab("ai_tools")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "ai_tools"
              ? "bg-slate-900 text-indigo-400 border-indigo-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Công cụ AI</span>
          {(cueIssues.totalIssues > 0 || smartSplitAnalysis.longCuesCount > 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          id="tab-btn-ai-translate"
          type="button"
          onClick={() => setActiveTab("ai_translate")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "ai_translate"
              ? "bg-slate-900 text-cyan-400 border-cyan-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Dịch AI</span>
        </button>

        <button
          id="tab-btn-download"
          type="button"
          onClick={() => setActiveTab("download")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "download"
              ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Tải xuống</span>
        </button>
      </div>

      {/* TAB CONTENT: CÔNG CỤ AI */}
      {activeTab === "ai_tools" && (
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 min-h-0 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 px-1 flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span>Danh sách công cụ AI tối ưu video & phụ đề</span>
            <button
              onClick={() => setActiveTab("subtitles")}
              className="text-indigo-400 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              <span>Xem danh sách ({cues.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Tách câu thông minh */}
            <button
              type="button"
              onClick={() => setIsSmartSplitModalOpen(true)}
              className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 transition group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    <span>Tách câu thông minh (Smart Split)</span>
                    {smartSplitAnalysis.longCuesCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 font-bold">
                        {smartSplitAnalysis.longCuesCount} câu dài
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Ngắt câu dài theo nhịp nói tự nhiên, dấu câu & liên từ
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* AI Tối ưu & Đánh bóng */}
            <button
              type="button"
              onClick={onOpenRefineModal}
              className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    AI Tối ưu & Sửa lỗi ngữ pháp
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Trau chuốt câu từ, sửa chính tả, gọt giũa phong cách tự nhiên
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Phân vai lồng tiếng */}
            {onOpenVoiceoverModal && (
              <button
                type="button"
                onClick={onOpenVoiceoverModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Phân vai lồng tiếng đa giọng đọc
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Tự nhận diện nhân vật Nam/Nữ/Già/Trẻ, gán giọng đọc AI tương ứng
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Tự động dọn & gộp mốc */}
            <button
              type="button"
              onClick={() => setIsAutoMergeModalOpen(true)}
              className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <GitMerge className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    <span>Dọn dẹp & Gộp mốc câu</span>
                    {cueIssues.totalIssues > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 font-bold">
                        {cueIssues.totalIssues} vấn đề
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Xóa khoảng trống micro-gap, gộp mốc thời gian bị chồng chéo
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Tùy chỉnh kiểu chữ */}
            {onOpenStyleModal && (
              <button
                type="button"
                onClick={onOpenStyleModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Tùy chỉnh phong cách phụ đề
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Màu sắc, viền chữ, font, bóng đổ, vùng an toàn TikTok Safe Zone
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Tạo ảnh bìa Hook AI */}
            {onOpenCoverModal && (
              <button
                type="button"
                onClick={onOpenCoverModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Image className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Tạo ảnh bìa Hook / Thumbnail AI
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Thiết kế ảnh thumbnail thu hút người xem cho TikTok & Reels
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* CapCut Preset Studio */}
            {onOpenCapCutModal && (
              <button
                type="button"
                onClick={onOpenCapCutModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      CapCut Preset & Karaoke Studio
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Hiệu ứng chữ nhảy, highlight karaoke theo từng từ
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DỊCH AI */}
      {activeTab === "ai_translate" && (
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 min-h-0 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 px-1 flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span>Dịch thuật phụ đề & Nhận diện đa ngôn ngữ</span>
            <button
              onClick={() => setActiveTab("subtitles")}
              className="text-cyan-400 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              <span>Xem danh sách ({cues.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Tạo Vietsub AI */}
            {onOpenAiGenerate && (
              <button
                type="button"
                onClick={onOpenAiGenerate}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Tạo Vietsub AI từ Video
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Trích xuất giọng nói và tự động đồng bộ mốc thời gian
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Dịch đa ngôn ngữ */}
            {onOpenAiGenerate && (
              <button
                type="button"
                onClick={onOpenAiGenerate}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Languages className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Dịch đa ngôn ngữ (Multilingual Subtitles)
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Hỗ trợ dịch Anh, Nhật, Hàn, Trung, Pháp, Đức, Tây Ban Nha,...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Dịch từ link video trực tuyến */}
            {onOpenUniversalTranslatorModal && (
              <button
                type="button"
                onClick={onOpenUniversalTranslatorModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Link className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Dịch từ link TikTok, YouTube, Reels
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Dán link trực tuyến để tải và phiên dịch phụ đề nhanh
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Dịch Web Drama / Phim ngắn */}
            {onOpenWebDramaModal && (
              <button
                type="button"
                onClick={onOpenWebDramaModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Dịch Web Drama & Phim ngắn
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Chế độ dịch kịch bản hội thoại kịch tính theo tập phim
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Cloudflare Workers AI */}
            {onOpenCloudflareModal && (
              <button
                type="button"
                onClick={onOpenCloudflareModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Cloud className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Tăng tốc Cloudflare Workers AI
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Cấu hình API riêng, sao lưu biên dịch an toàn trên Edge
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TẢI XUỐNG */}
      {activeTab === "download" && (
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 min-h-0 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 px-1 flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span>Xuất file phụ đề & Render video hoàn chỉnh</span>
            <button
              onClick={() => setActiveTab("subtitles")}
              className="text-emerald-400 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              <span>Xem danh sách ({cues.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Xuất file SRT */}
            <button
              type="button"
              onClick={handleInstantExportSRT}
              className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    <span>Xuất file phụ đề .SRT</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                      Chuẩn nhất
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Tải ngay file SRT dùng cho CapCut, Premiere, DaVinci, Final Cut
                  </p>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
            </button>

            {/* Xuất file VTT */}
            <button
              type="button"
              onClick={handleInstantExportVTT}
              className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <FileCode className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Xuất file phụ đề .VTT
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Định dạng WebVTT tiêu chuẩn cho trình phát HTML5 web và mobile
                  </p>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
            </button>

            {/* Xuất kịch bản thuần TXT */}
            <button
              type="button"
              onClick={handleInstantExportTXT}
              className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 transition group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <FileType className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Xuất kịch bản lời thoại .TXT
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Văn bản thuần đầy đủ mốc thời gian để đọc và lưu trữ
                  </p>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />
            </button>

            {/* Xuất Video Hardsub & Voiceover (Mở trình xuất) */}
            {onOpenExportModal && (
              <button
                type="button"
                onClick={onOpenExportModal}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-gradient-to-r from-rose-950/60 to-slate-900 hover:from-rose-900/70 border border-rose-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>Xuất Video Hardsub & Voiceover</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold">
                        Đầy đủ
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 truncate">
                      Xem trước video, gắn cứng phụ đề và hòa âm thuyết minh
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1" />
              </button>
            )}

            {/* Sao lưu dự án JSON */}
            <button
              type="button"
              onClick={handleInstantBackupJSON}
              className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Sao lưu toàn bộ dự án .JSON
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Lưu toàn bộ danh sách mốc, lời thoại và phân vai nhân vật
                  </p>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1" />
            </button>

            {/* Cài đặt App CH Play / App Store / PWA */}
            {onOpenAppsHub && (
              <button
                type="button"
                onClick={onOpenAppsHub}
                className="flex items-center justify-between w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      <span>Cài đặt App (CH Play & App Store)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-mono">
                        Multi-device
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Cài đặt và đồng bộ dùng song song trên điện thoại và máy tính
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PHỤ ĐỀ (SUBTITLES LIST & EDITOR) */}
      {activeTab === "subtitles" && (
        <>
          {/* List Header */}
          <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-900/95 flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Danh sách câu</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                    {cues.length}
                  </span>
                </h3>
                <span
                  className="hidden xl:inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60"
                  title="Nhấn Ctrl + Enter bất kỳ lúc nào để lưu chỉnh sửa"
                >
                  <kbd className="font-mono text-[9px] text-amber-400 font-semibold">Ctrl+Enter</kbd> Lưu
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Time shift dropdown */}
                <div className="relative">
                  <button
                    id="btn-toggle-shift-dropdown"
                    onClick={() => setShowShiftDropdown(!showShiftDropdown)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                    title="Lệch mốc thời gian phụ đề (+/- sync)"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">Lệch giờ</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showShiftDropdown && (
                    <div className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-xs text-slate-200">
                      <div className="font-semibold mb-2 text-white">Dịch chuyển toàn bộ mốc:</div>
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => {
                            onShiftAllCues(-timeShiftVal);
                            setShowShiftDropdown(false);
                          }}
                          className="flex-1 py-1 px-2 rounded bg-slate-700 hover:bg-slate-600 text-center text-rose-300"
                        >
                          -{timeShiftVal}s
                        </button>
                        <button
                          onClick={() => {
                            onShiftAllCues(timeShiftVal);
                            setShowShiftDropdown(false);
                          }}
                          className="flex-1 py-1 px-2 rounded bg-slate-700 hover:bg-slate-600 text-center text-emerald-300"
                        >
                          +{timeShiftVal}s
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Bước:</span>
                        {[0.1, 0.2, 0.5, 1.0].map((v) => (
                          <button
                            key={v}
                            onClick={() => setTimeShiftVal(v)}
                            className={`px-1.5 py-0.5 rounded ${
                              timeShiftVal === v ? "bg-rose-500 text-white font-bold" : "bg-slate-700/60"
                            }`}
                          >
                            {v}s
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Merge Selected Cues Button (Header) */}
                {selectedCuesAnalysis.isAdjacent && (
                  <button
                    id="btn-merge-cues-header"
                    onClick={handleMergeSelected}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md active:scale-95 transition-all animate-pulse"
                    title={`Gộp câu #${selectedCuesAnalysis.firstIndex + 1} và #${selectedCuesAnalysis.secondIndex + 1}`}
                  >
                    <GitMerge className="w-3 h-3" />
                    <span>Gộp</span>
                  </button>
                )}

                {/* Add Cue Button */}
                <button
                  id="btn-add-subtitle-cue"
                  onClick={() => onAddCue(currentTime)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md active:scale-95 transition-all"
                  title="Thêm phụ đề mới tại thời điểm hiện tại"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thêm dòng</span>
                </button>
              </div>
            </div>

            {/* Search and Auto-scroll toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-search-subtitles"
                  type="text"
                  placeholder="Tìm kiếm nội dung phụ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <button
                id="btn-toggle-auto-scroll"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all ${
                  autoScroll
                    ? "bg-slate-800 text-slate-200 border-slate-700"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}
                title="Tự động cuộn theo video"
              >
                <ArrowDownNarrowWide className={`w-3.5 h-3.5 ${autoScroll ? "text-rose-400" : "text-slate-600"}`} />
                <span className="hidden md:inline">Cuộn</span>
              </button>
            </div>
          </div>

      {/* Quick Clean Toast Notification */}
      {cleanToast && (
        <div className="px-3 py-2 bg-emerald-900/90 border-b border-emerald-500/50 flex items-center justify-between text-xs text-white shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
            <span>{cleanToast}</span>
          </div>
          <button
            onClick={() => setCleanToast(null)}
            className="text-emerald-300 hover:text-white text-xs px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Auto Merge Messy Cues Alert Banner */}
      {cueIssues.totalIssues > 0 && selectedCueIds.length === 0 && (
        <div
          id="auto-clean-suggestion-banner"
          className="px-3 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Phát hiện{" "}
              {cueIssues.shortCuesCount > 0 && (
                <strong>{cueIssues.shortCuesCount} câu quá ngắn (&lt;0.8s) </strong>
              )}
              {cueIssues.shortCuesCount > 0 && cueIssues.overlappingCount > 0 && "và "}
              {cueIssues.overlappingCount > 0 && (
                <strong>{cueIssues.overlappingCount} mốc chồng chéo </strong>
              )}
              cần làm sạch.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-quick-auto-merge"
              onClick={handleQuickAutoClean}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm active:scale-95 transition-all"
              title="Gộp thông minh ngay lập tức các mốc bị lỗi"
            >
              <Zap className="w-3 h-3" />
              <span>Gộp nhanh</span>
            </button>
            <button
              id="btn-open-auto-merge-custom"
              onClick={() => setIsAutoMergeModalOpen(true)}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-all"
            >
              Xem trước &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Smart Split Long Cues Alert Banner */}
      {smartSplitAnalysis.longCuesCount > 0 && cueIssues.totalIssues === 0 && selectedCueIds.length === 0 && (
        <div
          id="smart-split-suggestion-banner"
          className="px-3 py-2 bg-rose-950/40 border-b border-rose-500/30 flex items-center justify-between text-xs text-rose-200 animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              Phát hiện <strong>{smartSplitAnalysis.longCuesCount} câu quá dài</strong> (&gt;42 ký tự hoặc &gt;4s) người xem khó đọc kịp.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-quick-smart-split"
              onClick={handleQuickSmartSplit}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-sm active:scale-95 transition-all"
              title="Tách ngay tất cả các câu dài theo nhịp nói tự nhiên"
            >
              <Zap className="w-3 h-3" />
              <span>Tách nhanh</span>
            </button>
            <button
              id="btn-open-smart-split-modal-banner"
              onClick={() => setIsSmartSplitModalOpen(true)}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-all"
            >
              Xem trước &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Merge Selection Bar Banner */}
      {selectedCueIds.length > 0 && (
        <div id="merge-selection-banner">
          {selectedCuesAnalysis.isAdjacent ? (
            <div className="px-3 sm:px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200 shadow-md">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                  <GitMerge className="w-4 h-4" />
                </div>
                <div>
                  <span>
                    Đã chọn 2 câu liền kề: <strong className="text-white">#{selectedCuesAnalysis.firstIndex + 1}</strong> và <strong className="text-white">#{selectedCuesAnalysis.secondIndex + 1}</strong>
                  </span>
                  <div className="text-[11px] text-emerald-400/80">
                    Sẽ ghép nối nội dung và lấy mốc kết thúc của câu #{selectedCuesAnalysis.secondIndex + 1}.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-merge-subtitles"
                  onClick={handleMergeSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
                  title="Gộp 2 câu phụ đề đã chọn"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Gộp 2 câu (Merge)</span>
                </button>
                <button
                  onClick={() => setSelectedCueIds([])}
                  className="text-emerald-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-emerald-900/40"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : selectedCueIds.length === 1 ? (
            <div className="px-3 sm:px-4 py-2 bg-slate-800/95 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>
                  Đã chọn câu <strong className="text-amber-400">#{cues.findIndex((c) => c.id === selectedCueIds[0]) + 1}</strong>. Hãy tích chọn thêm 1 câu liền kề (trước hoặc sau) để gộp.
                </span>
              </div>
              <button
                onClick={() => setSelectedCueIds([])}
                className="text-slate-400 hover:text-white text-[11px] px-2 py-0.5 rounded hover:bg-slate-700"
              >
                Hủy chọn
              </button>
            </div>
          ) : (
            <div className="px-3 sm:px-4 py-2 bg-amber-950/90 border-b border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
              <span>
                ⚠️ Hai câu được chọn không nằm liền kề nhau. Vui lòng chọn 2 câu liên tiếp để thực hiện gộp (Merge).
              </span>
              <button
                onClick={() => setSelectedCueIds([])}
                className="text-amber-300 hover:text-white text-xs underline ml-2"
              >
                Chọn lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subtitles Scrollable Area */}
      <div
        ref={scrollContainerRef}
        id="subtitles-cards-list"
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5"
      >
        {filteredCues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center px-4">
            <p className="text-sm mb-2 font-medium">Chưa có đoạn phụ đề nào khớp</p>
            <p className="text-xs text-slate-600">
              Nhấn "Tạo Vietsub bằng AI" trên thanh công cụ hoặc thêm dòng thủ công bằng nút (+) ở góc trên.
            </p>
          </div>
        ) : (
          filteredCues.map((cue, index) => {
            const isActive = currentTime >= cue.start && currentTime <= cue.end;
            const cueIndexInAll = cues.findIndex((c) => c.id === cue.id);
            const isSelected = selectedCueIds.includes(cue.id);
            const singleSelectedId = selectedCueIds.length === 1 ? selectedCueIds[0] : null;
            const singleSelectedIdx = singleSelectedId !== null ? cues.findIndex((c) => c.id === singleSelectedId) : -1;
            const isNeighborOfSelected =
              singleSelectedIdx !== -1 && Math.abs(cueIndexInAll - singleSelectedIdx) === 1;

            const duration = Number((cue.end - cue.start).toFixed(2));
            const nextCue = cueIndexInAll < cues.length - 1 ? cues[cueIndexInAll + 1] : null;
            const isOverlapping = nextCue ? cue.end > nextCue.start + 0.05 : false;
            const overlapAmount = nextCue && isOverlapping ? (cue.end - nextCue.start).toFixed(2) : null;
            const isTooShort = duration < 0.8;
            const isLong = isCueLong(cue);

            return (
              <div
                key={cue.id}
                ref={isActive ? activeCardRef : null}
                id={`subtitle-card-${cue.id}`}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg"
                    : isActive
                    ? "bg-slate-800/90 border-rose-500/80 shadow-md ring-1 ring-rose-500/40"
                    : isNeighborOfSelected
                    ? "bg-slate-900/90 border-dashed border-emerald-500/50 hover:border-emerald-400"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                {/* Header: Index, Timestamps, Adjust Buttons, Delete */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Checkbox to select cue for merging */}
                    <input
                      type="checkbox"
                      id={`checkbox-select-cue-${cue.id}`}
                      checked={isSelected}
                      onChange={() => handleToggleSelectCue(cue.id)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 cursor-pointer"
                      title={
                        isSelected
                          ? "Bỏ chọn câu này"
                          : isNeighborOfSelected
                          ? "Chọn câu này để gộp với câu đã chọn"
                          : "Tích chọn câu này để gộp"
                      }
                    />

                    <span
                      onClick={() => onSelectCue(cue.start)}
                      className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-rose-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                      title="Nhấn để phát video từ mốc này"
                    >
                      #{index + 1}
                    </span>

                    {/* Time scrubber controls */}
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      <span
                        onClick={() => onSelectCue(cue.start)}
                        className="hover:text-rose-400 cursor-pointer"
                        title="Bắt đầu"
                      >
                        {formatSecondsToDisplay(cue.start)}
                      </span>
                      <MoveRight className="w-2.5 h-2.5 text-slate-600" />
                      <span
                        onClick={() => onSelectCue(cue.end)}
                        className="hover:text-rose-400 cursor-pointer"
                        title="Kết thúc"
                      >
                        {formatSecondsToDisplay(cue.end)}
                      </span>
                      <span className="text-slate-600 pl-1">
                        ({duration.toFixed(1)}s)
                      </span>
                    </div>

                    {isTooShort && (
                      <span
                        className="hidden xs:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        title={`Câu quá ngắn (${duration}s < 0.8s)`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>Quá ngắn ({duration}s)</span>
                      </span>
                    )}

                    {isLong && (
                      <span
                        onClick={() => handleSmartSplitSingleCue(cue.id)}
                        className="hidden xs:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer hover:bg-rose-500/30 transition-colors"
                        title={`Câu quá dài (${cue.textVi.length} ký tự, ${duration}s). Nhấn để tách thông minh theo nhịp nói (Smart Split)`}
                      >
                        <Scissors className="w-2.5 h-2.5" />
                        <span>Dài ({cue.textVi.length} kt)</span>
                      </span>
                    )}

                    {isOverlapping && (
                      <span
                        className="hidden xs:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                        title={`Mốc kết thúc đè lên câu #${cueIndexInAll + 2} (${overlapAmount}s)`}
                      >
                        <Layers className="w-2.5 h-2.5" />
                        <span>Đè {overlapAmount}s</span>
                      </span>
                    )}

                    {isNeighborOfSelected && !isSelected && (
                      <span className="hidden sm:inline-block text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        Liền kề
                      </span>
                    )}
                  </div>

                  {/* Micro nudge buttons, quick merge & delete */}
                  <div className="flex items-center gap-1">
                    {/* Quick merge shortcut with next cue */}
                    {nextCue && (isTooShort || isOverlapping) && (
                      <button
                        id={`btn-quick-merge-issue-${cue.id}`}
                        type="button"
                        onClick={() => {
                          if (onMergeCues) {
                            onMergeCues(cue.id, nextCue.id);
                          } else {
                            setSelectedCueIds([cue.id, nextCue.id]);
                          }
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold transition-all"
                        title={`Gộp câu #${cueIndexInAll + 1} vào câu kế #${cueIndexInAll + 2}`}
                      >
                        <GitMerge className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline">Gộp câu kế</span>
                      </button>
                    )}

                    {cueIndexInAll < cues.length - 1 && !(isTooShort || isOverlapping) && (
                      <button
                        id={`btn-quick-merge-${cue.id}`}
                        type="button"
                        onClick={() => {
                          const nextCue = cues[cueIndexInAll + 1];
                          if (nextCue) {
                            setSelectedCueIds([cue.id, nextCue.id]);
                          }
                        }}
                        className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title={`Chọn gộp câu #${cueIndexInAll + 1} với câu liền kề #${cueIndexInAll + 2}`}
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Smart Split button on each cue card */}
                    <button
                      id={`btn-smart-split-cue-${cue.id}`}
                      type="button"
                      onClick={() => handleSmartSplitSingleCue(cue.id)}
                      className={`p-1 rounded transition-colors ${
                        isLong
                          ? "text-rose-300 hover:text-white bg-rose-500/25 hover:bg-rose-600 border border-rose-500/40 shadow-sm"
                          : "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      }`}
                      title={
                        isLong
                          ? `Tách câu dài này (${cue.textVi.length} ký tự, ${duration}s) thành các câu ngắn theo nhịp nói tự nhiên (Smart Split)`
                          : "Tách câu này theo nhịp nói tự nhiên (Smart Split)"
                      }
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>

                    {/* Time start micro adjustment */}
                    <div className="hidden sm:flex items-center bg-slate-900 rounded border border-slate-800 text-[10px] font-mono">
                      <button
                        onClick={() => handleTimeAdjust(cue, "start", -0.2)}
                        className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Lùi mốc bắt đầu 0.2s"
                      >
                        -0.2s
                      </button>
                      <span className="text-slate-600 px-0.5">|</span>
                      <button
                        onClick={() => handleTimeAdjust(cue, "start", 0.2)}
                        className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Tăng mốc bắt đầu 0.2s"
                      >
                        +0.2s
                      </button>
                    </div>

                    {/* Quick Listen Voiceover for this cue with persona */}
                    <button
                      id={`btn-listen-cue-${cue.id}`}
                      type="button"
                      onClick={() => {
                        if (activePlayingCueId === cue.id) {
                          stopVoicePreview();
                          setActivePlayingCueId(null);
                        } else {
                          setActivePlayingCueId(cue.id);
                          const persona =
                            cue.voicePersona ||
                            (cue.speakerGender === "male"
                              ? cue.speakerAge === "elderly"
                                ? "male_elderly"
                                : "male_young"
                              : cue.speakerAge === "elderly"
                              ? "female_elderly"
                              : "female_young");

                          previewSpeakerPersona(
                            persona,
                            cue.textVi || cue.textOriginal,
                            () => {
                              setActivePlayingCueId(null);
                            }
                          );
                        }
                      }}
                      className={`p-1 rounded transition-colors ${
                        activePlayingCueId === cue.id
                          ? "text-rose-400 bg-rose-500/20 animate-pulse"
                          : "text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                      }`}
                      title="Nghe thử giọng nhân vật này"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      id={`btn-delete-cue-${cue.id}`}
                      onClick={() => onDeleteCue(cue.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Xóa phụ đề này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Vietnamese Text Input */}
                <div className="space-y-1.5">
                  {isLong && (
                    <div className="flex items-center justify-between text-[11px] bg-rose-950/40 border border-rose-900/50 rounded-lg px-2.5 py-1 text-rose-300">
                      <div className="flex items-center gap-1.5 truncate">
                        <Scissors className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">
                          Câu dài ({cue.textVi.length} ký tự). Tách thành các đoạn ngắn theo nhịp thở để dễ đọc.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSmartSplitSingleCue(cue.id)}
                        className="shrink-0 ml-2 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow-sm transition-all active:scale-95 flex items-center gap-1"
                        title="Tách câu theo nhịp nói tự nhiên"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        <span>Tách ngay</span>
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      id={`textarea-vietnamese-${cue.id}`}
                      rows={2}
                      value={cue.textVi}
                      onChange={(e) =>
                        onUpdateCue({
                          ...cue,
                          textVi: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          (e.target as HTMLElement).blur();
                          onSaveEdits?.();
                        }
                      }}
                      placeholder="Nhập nội dung phụ đề tiếng Việt..."
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30 resize-none font-medium"
                    />
                  </div>

                  {/* Spoken original text (optional view & edit) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold w-12 shrink-0">
                      Gốc:
                    </span>
                    <input
                      id={`input-original-${cue.id}`}
                      type="text"
                      value={cue.textOriginal}
                      onChange={(e) =>
                        onUpdateCue({
                          ...cue,
                          textOriginal: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          (e.target as HTMLElement).blur();
                          onSaveEdits?.();
                        }
                      }}
                      placeholder="Lời thoại gốc (tiếng Anh, Nhật,...)"
                      className="flex-1 bg-slate-950/60 border border-slate-800/60 rounded px-2 py-0.5 text-[11px] text-slate-400 focus:text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  {/* Speaker Persona & Character Role Tag */}
                  {(() => {
                    const persona =
                      cue.voicePersona ||
                      (cue.speakerGender === "male"
                        ? cue.speakerAge === "elderly"
                          ? "male_elderly"
                          : "male_young"
                        : cue.speakerAge === "elderly"
                        ? "female_elderly"
                        : "female_young");
                    const meta = getPersonaInfo(persona);

                    return (
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{meta.icon}</span>
                          <span className="text-slate-400">
                            {cue.speakerRole ? (
                              <strong className="text-slate-200">{cue.speakerRole}</strong>
                            ) : (
                              "Nhân vật"
                            )}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${meta.bgBadge}`}
                          >
                            {meta.shortLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-[10px] hidden sm:inline">Chất giọng:</span>
                          <select
                            value={persona}
                            onChange={(e) => {
                              const newPersona = e.target.value as SpeakerVoicePersona;
                              onUpdateCue({
                                ...cue,
                                voicePersona: newPersona,
                              });
                            }}
                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
                          >
                            {(Object.keys(SPEAKER_PERSONAS) as SpeakerVoicePersona[]).map((pKey) => {
                              const pMeta = SPEAKER_PERSONAS[pKey];
                              return (
                                <option key={pKey} value={pKey}>
                                  {pMeta.icon} {pMeta.shortLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      )}

      {/* Auto Merge & Clean Up Modal */}
      <AutoMergeModal
        isOpen={isAutoMergeModalOpen}
        onClose={() => setIsAutoMergeModalOpen(false)}
        cues={cues}
        onApplyMergedCues={handleApplyCleanedCues}
        onNotify={(msg) => {
          setCleanToast(msg);
          setTimeout(() => setCleanToast(null), 4000);
        }}
      />

      {/* Smart Split Modal */}
      <SmartSplitModal
        isOpen={isSmartSplitModalOpen}
        onClose={() => setIsSmartSplitModalOpen(false)}
        cues={cues}
        onApplySplitCues={handleApplyCleanedCues}
        onNotify={(msg) => {
          setCleanToast(msg);
          setTimeout(() => setCleanToast(null), 4000);
        }}
      />
    </div>
  );
};
