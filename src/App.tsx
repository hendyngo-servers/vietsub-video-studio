import React, { useState, useRef } from "react";
import {
  Sparkles,
  Upload,
  Download,
  Film,
  Sliders,
  FileText,
  HelpCircle,
  Video,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Mic,
  Link,
  Zap,
  Maximize2,
  Keyboard,
  Users,
  Globe,
  Bookmark,
} from "lucide-react";
import { VideoPlayer, VideoPlayerHandle } from "./components/VideoPlayer";
import { SubtitleList } from "./components/SubtitleList";
import { AIGenerateModal } from "./components/AIGenerateModal";
import { AIRefineModal } from "./components/AIRefineModal";
import { SubtitleStylingModal } from "./components/SubtitleStylingModal";
import { ExportModal } from "./components/ExportModal";
import { SampleVideosModal } from "./components/SampleVideosModal";
import { AICoverModal } from "./components/AICoverModal";
import { AudioWaveformTimeline } from "./components/AudioWaveformTimeline";
import { CapCutEditorModal } from "./components/CapCutEditorModal";
import { WebDramaImportModal } from "./components/WebDramaImportModal";
import { UniversalLinkTranslatorModal } from "./components/UniversalLinkTranslatorModal";
import { BookmarkletStudioModal } from "./components/BookmarkletStudioModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { CompactShortcutsDock } from "./components/CompactShortcutsDock";
import { AutoVoiceoverModal } from "./components/AutoVoiceoverModal";
import { SAMPLE_VIDEOS } from "./data/sampleVideos";
import {
  SubtitleCue,
  SubtitleStyle,
  GenerationConfig,
  SampleVideo,
  AudioEditConfig,
  VoiceoverConfig,
} from "./types";
import { extractAudioFromVideo } from "./utils/audioExtractor";
import { parseSRT } from "./utils/subtitleFormatters";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";

export const App: React.FC = () => {
  // Video & Subtitles State
  const defaultSample = SAMPLE_VIDEOS[0];
  const [videoUrl, setVideoUrl] = useState<string>(defaultSample.videoUrl);
  const [videoTitle, setVideoTitle] = useState<string>(defaultSample.title);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [cues, setCues] = useState<SubtitleCue[]>(defaultSample.initialCues || []);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(38);

  const videoPlayerRef = useRef<VideoPlayerHandle>(null);

  // Subtitle styling configuration
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: "lg",
    textColor: "#FACC15", // Cinematic yellow
    backgroundColor: "translucent-black",
    fontFamily: "sans",
    position: "bottom",
    displayMode: "vi",
    textShadow: true,
    capcutPreset: "default",
    aspectRatio: "16:9",
    showTikTokSafeZone: false,
  });

  // Audio editing configuration (CapCut Audio)
  const [audioConfig, setAudioConfig] = useState<AudioEditConfig>({
    volumeMultiplier: 1.0,
    vocalEnhance: false,
    bassBoost: false,
    noiseReduction: false,
    audioDucking: false,
    playbackSpeed: 1.0,
    reverb: "none",
  });

  // Modal visibility states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isCapCutModalOpen, setIsCapCutModalOpen] = useState(false);
  const [isWebDramaModalOpen, setIsWebDramaModalOpen] = useState(false);
  const [isUniversalTranslatorModalOpen, setIsUniversalTranslatorModalOpen] = useState(false);
  const [isBookmarkletModalOpen, setIsBookmarkletModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isShortcutsDockPinned, setIsShortcutsDockPinned] = useState(false);
  const [isAutoVoiceoverModalOpen, setIsAutoVoiceoverModalOpen] = useState(false);

  // Auto Voiceover & Multi-Voice Persona Configuration
  const [voiceoverConfig, setVoiceoverConfig] = useState<VoiceoverConfig>({
    enabled: true,
    voiceName: "vi-female",
    speechRate: 1.0,
    pitch: 1.0,
    originalVolumeDucking: 0.25,
    readMode: "vi",
    autoMultiVoice: true,
  });

  // AI Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [isRefining, setIsRefining] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Global Keyboard Shortcuts Hook
  // - 'Space' / 'K': Play/pause video (when not typing in an input)
  // - 'ArrowLeft' / 'ArrowRight': Seek 5s backward / forward
  // - 'J' / 'L': Seek 10s backward / forward
  // - 'Ctrl + Enter' / 'Cmd + Enter': Save edits in the subtitle list
  // - '?': Mở / đóng bảng tra cứu phím tắt
  // - 'C': Bật / tắt hiển thị phụ đề
  // - 'M': Bật / tắt tiếng (Mute)
  useGlobalShortcuts({
    onTogglePlay: () => {
      videoPlayerRef.current?.togglePlay();
    },
    onSeekRelative: (delta) => {
      videoPlayerRef.current?.seekRelative(delta);
    },
    onSaveEdits: () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      showToast("Đã lưu chỉnh sửa phụ đề (Ctrl + Enter)!", "success");
    },
    onToggleShortcutsModal: () => {
      setIsShortcutsModalOpen((prev) => !prev);
    },
    onToggleMute: () => {
      videoPlayerRef.current?.toggleMute();
    },
    onToggleSubtitles: () => {
      videoPlayerRef.current?.toggleSubtitles();
    },
    enabled:
      !isGenerateModalOpen &&
      !isRefineModalOpen &&
      !isStyleModalOpen &&
      !isExportModalOpen &&
      !isSampleModalOpen &&
      !isCoverModalOpen &&
      !isCapCutModalOpen &&
      !isWebDramaModalOpen,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  // Handle local video upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    setCurrentFile(file);
    setCurrentTime(0);
    showToast(`Đã tải lên video "${file.name}". Nhấn "Tạo Vietsub AI" để phiên dịch phụ đề!`, "info");
  };

  // Handle drag and drop video
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
      setCurrentFile(file);
      setCurrentTime(0);
      showToast(`Đã tải lên video "${file.name}"!`, "info");
    }
  };

  // Select sample video
  const handleSelectSample = (sample: SampleVideo) => {
    setVideoUrl(sample.videoUrl);
    setVideoTitle(sample.title);
    setCurrentFile(null);
    setCues(sample.initialCues || []);
    setCurrentTime(0);
    showToast(`Đã tải video mẫu: ${sample.title}`, "success");
  };

  // Import existing SRT or VTT
  const handleImportSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseSRT(text);
        if (parsed.length > 0) {
          setCues(parsed);
          showToast(`Đã nhập thành công ${parsed.length} câu phụ đề từ tệp!`, "success");
        } else {
          showToast("Không tìm thấy mốc phụ đề hợp lệ trong tệp SRT.", "error");
        }
      }
    };
    reader.readAsText(file);
  };

  // Execute AI Vietsub generation
  const handleGenerateVietsub = async (config: GenerationConfig) => {
    setGenerationError(null);
    setIsProcessing(true);
    setProgressStep("Đang chuẩn bị âm thanh video...");
    setProgressPercent(10);

    try {
      let audioBase64 = "";
      let mimeType = "audio/wav";

      if (currentFile) {
        // Extract audio from uploaded local file
        const extracted = await extractAudioFromVideo(currentFile, (pct, msg) => {
          setProgressPercent(Math.round(pct * 0.5));
          setProgressStep(msg);
        });
        audioBase64 = extracted.base64;
        mimeType = extracted.mimeType;
      } else {
        // For sample videos or URLs: fetch blob and extract
        setProgressStep("Đang tải tệp video mẫu để xử lý...");
        setProgressPercent(20);
        const res = await fetch(videoUrl);
        const blob = await res.blob();
        const extracted = await extractAudioFromVideo(blob, (pct, msg) => {
          setProgressPercent(20 + Math.round(pct * 0.35));
          setProgressStep(msg);
        });
        audioBase64 = extracted.base64;
        mimeType = extracted.mimeType;
      }

      setProgressStep("Đang phân tích âm thanh & dịch phụ đề với Gemini AI...");
      setProgressPercent(65);

      const response = await fetch("/api/vietsub/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          sourceLang: config.sourceLang,
          targetLang: config.targetLang,
          style: config.style,
          maxCharsPerLine: config.maxCharsPerLine,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo phụ đề từ Gemini API.");
      }

      if (data.cues && Array.isArray(data.cues)) {
        setCues(data.cues);
        setProgressPercent(100);
        setGenerationError(null);
        setIsGenerateModalOpen(false);
        const langInfo = data.targetLanguage ? `${data.detectedLanguage} ➔ ${data.targetLanguage}` : data.detectedLanguage;
        showToast(
          `Tạo thành công ${data.cues.length} câu phụ đề! (${langInfo})`,
          "success"
        );
      } else {
        throw new Error("Dữ liệu phụ đề trả về không hợp lệ.");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Đã có lỗi khi tạo Vietsub bằng AI.";
      setGenerationError(msg);
      showToast(msg, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Refine Subtitles
  const handleRefineSubtitles = async (instruction: string) => {
    if (cues.length === 0) {
      showToast("Chưa có phụ đề để tối ưu.", "error");
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch("/api/vietsub/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cues,
          instruction,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi hiệu đính phụ đề.");
      }

      if (data.cues && Array.isArray(data.cues)) {
        setCues(data.cues);
        setIsRefineModalOpen(false);
        showToast("Đã áp dụng tối ưu AI cho toàn bộ phụ đề thành công!", "success");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi khi tối ưu hóa câu chữ.", "error");
    } finally {
      setIsRefining(false);
    }
  };

  // Subtitle CRUD handlers
  const handleUpdateCue = (updated: SubtitleCue) => {
    setCues((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCue = (id: number) => {
    setCues((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCue = (atTime?: number) => {
    const start = atTime !== undefined ? Number(atTime.toFixed(2)) : 0;
    const end = Number((start + 2.5).toFixed(2));
    const newId = cues.length > 0 ? Math.max(...cues.map((c) => c.id)) + 1 : 1;

    const newCue: SubtitleCue = {
      id: newId,
      start,
      end,
      startTime: `00:00:${Math.floor(start)}.000`,
      endTime: `00:00:${Math.floor(end)}.000`,
      textOriginal: "",
      textVi: "Dòng phụ đề mới",
    };

    const updated = [...cues, newCue].sort((a, b) => a.start - b.start);
    setCues(updated);
  };

  const handleShiftAllCues = (offset: number) => {
    setCues((prev) =>
      prev.map((c) => {
        const newStart = Math.max(0, Number((c.start + offset).toFixed(2)));
        const newEnd = Math.max(newStart + 0.3, Number((c.end + offset).toFixed(2)));
        return {
          ...c,
          start: newStart,
          end: newEnd,
        };
      })
    );
    showToast(`Đã dịch chuyển thời gian phụ đề ${offset > 0 ? `+${offset}` : offset}s`, "info");
  };

  // Merge two adjacent subtitle cues
  const handleMergeCues = (firstCueId: number, secondCueId: number) => {
    setCues((prev) => {
      const idx1 = prev.findIndex((c) => c.id === firstCueId);
      const idx2 = prev.findIndex((c) => c.id === secondCueId);
      if (idx1 === -1 || idx2 === -1) return prev;

      const firstIndex = Math.min(idx1, idx2);
      const secondIndex = Math.max(idx1, idx2);
      const firstCue = prev[firstIndex];
      const secondCue = prev[secondIndex];

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

      const nextCues = [...prev];
      nextCues.splice(secondIndex, 1);
      nextCues[firstIndex] = mergedCue;
      return nextCues;
    });

    showToast("Đã gộp thành công 2 câu phụ đề liền kề!", "success");
  };

  return (
    <div
      id="app-root-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white"
    >
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />
      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt,.txt"
        onChange={handleImportSrt}
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Vietsub Video Studio
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tạo phụ đề tiếng Việt tự động cho video với độ chính xác cao
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Pick Sample Video */}
            <button
              id="btn-open-sample-modal"
              onClick={() => setIsSampleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xs"
              title="Chọn video mẫu để thử nghiệm nhanh"
            >
              <Video className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Video mẫu</span>
            </button>

            {/* Upload Video Button */}
            <button
              id="btn-upload-video-file"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xs"
              title="Tải video của bạn từ máy tính (MP4, WebM, MOV)"
            >
              <Upload className="w-3.5 h-3.5 text-rose-400" />
              <span>Tải video lên</span>
            </button>

            {/* Import SRT */}
            <button
              id="btn-import-srt"
              onClick={() => srtInputRef.current?.click()}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xs"
              title="Nhập phụ đề có sẵn (.SRT, .VTT)"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Nhập .SRT</span>
            </button>

            {/* Keyboard Shortcuts Guide Button */}
            <button
              id="btn-open-shortcuts-modal"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xs"
              title="Tra cứu phím tắt chỉnh sửa phụ đề & tua video (Nhấn ?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline">Phím tắt</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ?
              </kbd>
            </button>

            {/* Dịch Trực Tiếp Mọi Link, Web & App */}
            <button
              id="btn-open-universal-translator-modal"
              onClick={() => setIsUniversalTranslatorModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600/30 via-rose-600/30 to-indigo-600/30 hover:from-pink-600/50 hover:to-indigo-600/50 text-pink-300 border border-pink-500/40 font-semibold text-xs transition-all shadow-xs"
              title="Dịch trực tiếp trên tất cả Link, Web hoặc App (YouTube, TikTok, AV01, Reels, Màn hình...)"
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>Dịch Mọi Link / Web / App</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-500/30 text-pink-200 border border-pink-400/30">
                Universal
              </span>
            </button>

            {/* Bookmarklet 1-Click Extension Tool Button */}
            <button
              id="btn-open-bookmarklet-modal"
              onClick={() => setIsBookmarkletModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-rose-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-all shadow-xs"
              title="Tiện ích Bookmarklet 1-Click: Dịch phụ đề & Thuyết minh trên bất kỳ website nào"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>Tiện Ích Bookmarklet</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-400/30">
                1-Click
              </span>
            </button>

            {/* CapCut & Audio Pro Button */}
            <button
              id="btn-open-capcut-modal"
              onClick={() => setIsCapCutModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-300 border border-purple-500/40 font-semibold text-xs transition-all shadow-xs"
              title="Mẫu chữ CapCut thịnh hành, Safe Zone và bộ công cụ chỉnh âm thanh"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400 fill-current" />
              <span>CapCut & Audio</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Pro
              </span>
            </button>

            {/* Voiceover Casting Modal Button (Nam / Nu / Gia / Tre) */}
            <button
              id="btn-open-voiceover-modal-header"
              onClick={() => setIsAutoVoiceoverModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-950/80 via-purple-950/80 to-slate-900 hover:from-rose-900 hover:to-purple-900 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-all shadow-xs"
              title="Tự động nhận diện giọng nói Nam/Nữ/Già/Trẻ để thuyết minh phụ đề tiếng Việt"
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span>Thuyết Minh AI</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 border border-rose-400/30">
                Nam/Nữ/Già/Trẻ
              </span>
            </button>

            {/* Primary Generate Vietsub with AI */}
            <button
              id="btn-open-ai-generate-modal"
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/25 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Tạo Vietsub AI</span>
            </button>

            {/* AI Song Cover Button */}
            <button
              id="btn-open-ai-cover-modal"
              onClick={() => setIsCoverModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-300 border border-purple-500/40 font-semibold text-xs transition-all shadow-xs"
              title="Cover lại bài hát bằng các giọng ca sĩ AI nổi tiếng: Sơn Tùng M-TP, Diva Ballad, Vũ..."
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Cover Bài Hát AI</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Hot
              </span>
            </button>

            {/* Export Video & Subtitles Button */}
            <button
              id="btn-open-export-modal"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-all shadow-xs"
              title="Xuất video lồng Vietsub hoặc kèm thuyết minh tiếng Việt AI"
            >
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất Video & Sub</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Thuyết minh
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-xl border flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-700 text-rose-200"
                : toastMessage.type === "info"
                ? "bg-blue-950/90 border-blue-700 text-blue-200"
                : "bg-emerald-950/90 border-emerald-700 text-emerald-200"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* Left Column: Video Player & Controls (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Video Title bar */}
          <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <Film className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold truncate text-slate-200">
                {videoTitle}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                {cues.length} phụ đề
              </span>
              <button
                id="btn-toolbar-style"
                onClick={() => setIsStyleModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Tùy chỉnh phụ đề"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Player */}
          <VideoPlayer
            ref={videoPlayerRef}
            videoUrl={videoUrl}
            cues={cues}
            currentTime={currentTime}
            onTimeUpdate={(t) => setCurrentTime(t)}
            subtitleStyle={subtitleStyle}
            onOpenStyleModal={() => setIsStyleModalOpen(true)}
            onSeek={(t) => setCurrentTime(t)}
            audioConfig={audioConfig}
            onOpenCapCutModal={() => setIsCapCutModalOpen(true)}
            voiceoverConfig={voiceoverConfig}
            onOpenVoiceoverModal={() => setIsAutoVoiceoverModalOpen(true)}
          />

          {/* Audio Waveform Timeline */}
          <AudioWaveformTimeline
            videoUrl={videoUrl}
            cues={cues}
            currentTime={currentTime}
            duration={videoDuration}
            onSeek={(t) => setCurrentTime(t)}
            onUpdateCue={handleUpdateCue}
            onAddCue={(t) => handleAddCue(t)}
          />

          {/* Quick Helper Tips & Features */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-slate-200">Mẹo nhanh:</strong> Nhấp vào phụ đề để nhảy video tới mốc tương ứng.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(true)}
                className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 hover:border-indigo-500/50 transition-colors"
                title="Bấm để xem danh sách phím tắt đầy đủ"
              >
                <kbd className="font-mono text-[10px] text-amber-400 font-semibold">Space</kbd> Phát/Dừng
              </button>
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(true)}
                className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 hover:border-indigo-500/50 transition-colors"
                title="Bấm để xem danh sách phím tắt đầy đủ"
              >
                <kbd className="font-mono text-[10px] text-amber-400 font-semibold">← / →</kbd> Tua 5s
              </button>
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(true)}
                className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 hover:border-indigo-500/50 transition-colors"
                title="Bấm để xem danh sách phím tắt đầy đủ"
              >
                <kbd className="font-mono text-[10px] text-amber-400 font-semibold">Ctrl+Enter</kbd> Lưu sửa
              </button>
              <button
                type="button"
                id="btn-open-shortcuts-from-tips"
                onClick={() => setIsShortcutsModalOpen(true)}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all shrink-0 ml-1"
                title="Xem toàn bộ bảng phím tắt nhanh (Nhấn ?)"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Phím tắt (?)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Subtitle Timeline & Editor (5 cols on lg) */}
        <div className="lg:col-span-5 h-[550px] lg:h-[calc(100vh-140px)] min-h-[480px]">
          <SubtitleList
            cues={cues}
            currentTime={currentTime}
            onSelectCue={(time) => setCurrentTime(time)}
            onUpdateCue={handleUpdateCue}
            onDeleteCue={handleDeleteCue}
            onAddCue={handleAddCue}
            onShiftAllCues={handleShiftAllCues}
            onOpenRefineModal={() => setIsRefineModalOpen(true)}
            onMergeCues={handleMergeCues}
            onOpenVoiceoverModal={() => setIsAutoVoiceoverModalOpen(true)}
            onSaveEdits={() => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              showToast("Đã lưu chỉnh sửa phụ đề (Ctrl + Enter)!", "success");
            }}
          />
        </div>
      </main>

      {/* Modals */}
      <AIGenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          setGenerationError(null);
        }}
        onGenerate={handleGenerateVietsub}
        isProcessing={isProcessing}
        progressStep={progressStep}
        progressPercent={progressPercent}
        errorMessage={generationError}
        onClearError={() => setGenerationError(null)}
      />

      <AIRefineModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onRefine={handleRefineSubtitles}
        isRefining={isRefining}
      />

      <SubtitleStylingModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        style={subtitleStyle}
        onChangeStyle={setSubtitleStyle}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        cues={cues}
        videoTitle={videoTitle}
        videoUrl={videoUrl}
        subtitleStyle={subtitleStyle}
        onNotify={showToast}
      />

      <SampleVideosModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      <AICoverModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        cues={cues}
        videoTitle={videoTitle}
        onNotify={showToast}
      />

      {/* CapCut Visual Presets & Audio Editing Suite Modal */}
      <CapCutEditorModal
        isOpen={isCapCutModalOpen}
        onClose={() => setIsCapCutModalOpen(false)}
        style={subtitleStyle}
        onChangeStyle={setSubtitleStyle}
        audioConfig={audioConfig}
        onChangeAudioConfig={setAudioConfig}
      />

      {/* Universal Direct Translator for Any Link, Web & App */}
      <UniversalLinkTranslatorModal
        isOpen={isUniversalTranslatorModalOpen}
        onClose={() => setIsUniversalTranslatorModalOpen(false)}
        onImportSuccess={(result) => {
          setVideoUrl(result.videoUrl);
          setVideoTitle(result.title);
          if (result.duration) {
            setVideoDuration(result.duration);
          }
          if (result.initialCues && result.initialCues.length > 0) {
            setCues(result.initialCues);
          }
          showToast(`Đã nạp thành công: "${result.title}". Có thể tạo Vietsub & Thuyết minh ngay!`, "success");
          if (result.autoStartTranslate) {
            setIsGenerateModalOpen(true);
          }
        }}
        onAddLiveCues={(newCues) => {
          setCues((prev) => [...prev, ...newCues]);
        }}
        onNotify={showToast}
      />

      {/* Bookmarklet 1-Click Studio Modal */}
      <BookmarkletStudioModal
        isOpen={isBookmarkletModalOpen}
        onClose={() => setIsBookmarkletModalOpen(false)}
        onNotify={showToast}
      />

      {/* TikTok Short Drama & Web Phim Import Modal */}
      <WebDramaImportModal
        isOpen={isWebDramaModalOpen}
        onClose={() => setIsWebDramaModalOpen(false)}
        onImportSuccess={(result) => {
          setVideoUrl(result.videoUrl);
          setVideoTitle(result.title);
          if (result.duration) {
            setVideoDuration(result.duration);
          }
          if (result.initialCues && result.initialCues.length > 0) {
            setCues(result.initialCues);
          }
          showToast(`Đã nhập phim: "${result.title}". Có thể tạo Vietsub ngay!`, "success");
          if (result.autoStartTranslate) {
            setIsGenerateModalOpen(true);
          }
        }}
        onImportVideo={(result) => {
          setVideoUrl(result.videoUrl);
          setVideoTitle(result.title);
          if (result.duration) {
            setVideoDuration(result.duration);
          }
          if (result.initialCues && result.initialCues.length > 0) {
            setCues(result.initialCues);
          }
          showToast(`Đã nhập phim: "${result.title}". Có thể tạo Vietsub ngay!`, "success");
          if (result.autoStartTranslate) {
            setIsGenerateModalOpen(true);
          }
        }}
        onNotify={showToast}
      />

      {/* Auto Voiceover & Multi-Voice Speaker Persona Modal (Nam / Nu / Gia / Tre) */}
      <AutoVoiceoverModal
        isOpen={isAutoVoiceoverModalOpen}
        onClose={() => setIsAutoVoiceoverModalOpen(false)}
        cues={cues}
        onUpdateCues={(updatedCues) => setCues(updatedCues)}
        voiceoverConfig={voiceoverConfig}
        onUpdateVoiceoverConfig={(cfg) => setVoiceoverConfig(cfg)}
        videoTitle={videoTitle}
        onNotify={showToast}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        isPinned={isShortcutsDockPinned}
        onTogglePin={() => setIsShortcutsDockPinned((prev) => !prev)}
      />

      {/* Compact Docked Shortcuts Overlay */}
      <CompactShortcutsDock
        isVisible={isShortcutsDockPinned}
        onClose={() => setIsShortcutsDockPinned(false)}
        onOpenFullModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Floating Minimized Export Status Badge */}
      {!isExportModalOpen && (
        <button
          id="btn-reopen-export-minimized"
          onClick={() => setIsExportModalOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs font-semibold hover:scale-105 active:scale-95 transition-all group"
          title="Mở lại cửa sổ Xuất Video & Phụ đề"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping group-hover:animate-none" />
          <Film className="w-4 h-4 text-emerald-400" />
          <span>Xuất Video & Sub</span>
        </button>
      )}
    </div>
  );
};

export default App;
