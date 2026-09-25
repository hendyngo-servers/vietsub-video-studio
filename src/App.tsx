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
  Cloud,
  Menu,
  ListOrdered,
  Columns,
  Smartphone,
} from "lucide-react";
import { VideoPlayer, VideoPlayerHandle } from "./components/VideoPlayer";
import { SubtitleList, RightPanelTab } from "./components/SubtitleList";
import { StudioLeftSidebar } from "./components/StudioLeftSidebar";
import { AIGenerateModal } from "./components/AIGenerateModal";
import { AIRefineModal } from "./components/AIRefineModal";
import { SubtitleStylingModal } from "./components/SubtitleStylingModal";
import { ExportModal } from "./components/ExportModal";
import { SampleVideosModal } from "./components/SampleVideosModal";
import { AICoverModal } from "./components/AICoverModal";
import { Timeline } from "./components/Timeline";
import { MultiChannelAudioMixer } from "./components/MultiChannelAudioMixer";
import { CapCutEditorModal } from "./components/CapCutEditorModal";
import { WebDramaImportModal } from "./components/WebDramaImportModal";
import { UniversalLinkTranslatorModal } from "./components/UniversalLinkTranslatorModal";
import { BookmarkletStudioModal } from "./components/BookmarkletStudioModal";
import { CloudflareDeploymentModal } from "./components/CloudflareDeploymentModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { CompactShortcutsDock } from "./components/CompactShortcutsDock";
import { AutoVoiceoverModal } from "./components/AutoVoiceoverModal";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { ExtensionsAndAppsHubModal } from "./components/ExtensionsAndAppsHubModal";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { MobileBottomDock } from "./components/MobileBottomDock";
import { MobileNavDrawer } from "./components/MobileNavDrawer";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useResponsiveLayout, WorkspaceTab } from "./hooks/useResponsiveLayout";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { SAMPLE_VIDEOS } from "./data/sampleVideos";
import { smartSplitSingleCue } from "./utils/smartSplitter";
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
  // Cross-Platform & Responsive Layout State
  const responsiveLayout = useResponsiveLayout();
  const { platformInfo } = usePWAInstall();
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<WorkspaceTab>("video");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Video & Subtitles State
  const defaultSample = SAMPLE_VIDEOS[0];
  const [videoUrl, setVideoUrl] = useState<string>(defaultSample.videoUrl);
  const [videoTitle, setVideoTitle] = useState<string>(defaultSample.title);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [cues, setCues] = useState<SubtitleCue[]>(defaultSample.initialCues || []);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(38);

  const videoPlayerRef = useRef<VideoPlayerHandle>(null);

  // Subtitle styling configuration (Tự động lưu qua useLocalStorage - không mất khi reload/đóng app)
  const [subtitleStyle, setSubtitleStyle] = useLocalStorage<SubtitleStyle>(
    "hendy_subtitle_style_v1",
    {
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
    }
  );

  // Audio editing configuration (Tự động lưu qua useLocalStorage - không mất khi reload/đóng app)
  const [audioConfig, setAudioConfig] = useLocalStorage<AudioEditConfig>(
    "hendy_audio_config_v1",
    {
      volumeMultiplier: 1.0,
      vocalEnhance: false,
      bassBoost: false,
      noiseReduction: false,
      audioDucking: false,
      playbackSpeed: 1.0,
      reverb: "none",
    }
  );

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
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isAppsHubModalOpen, setIsAppsHubModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isShortcutsDockPinned, setIsShortcutsDockPinned] = useState(false);
  const [isAutoVoiceoverModalOpen, setIsAutoVoiceoverModalOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("subtitles");

  // Auto Voiceover & Multi-Voice Persona Configuration (Tự động lưu qua useLocalStorage)
  const [voiceoverConfig, setVoiceoverConfig] = useLocalStorage<VoiceoverConfig>(
    "hendy_voiceover_config_v1",
    {
      enabled: true,
      voiceId: "vi-female",
      speechRate: 1.0,
      voiceVolume: 1.0,
      originalVolumeDucking: 0.25,
      readMode: "vi",
      autoMultiVoice: true,
    }
  );

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
        let rawError = data.error || "Không thể tạo phụ đề từ Gemini API.";
        try {
          if (typeof rawError === "string" && rawError.trim().startsWith("{") && rawError.trim().endsWith("}")) {
            const p = JSON.parse(rawError.trim());
            if (p.error?.message) rawError = p.error.message;
          }
        } catch {
          // not json
        }
        if (rawError.includes("PERMISSION_DENIED") || rawError.includes("denied access") || rawError.includes("403")) {
          rawError = "Dự án Google Cloud hiện tại chưa được cấp quyền gọi mô hình (403 Permission Denied). Vui lòng thử lại với video mẫu hoặc nhập tệp phụ đề SRT.";
        }
        throw new Error(rawError);
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
      let msg = err.message || "Đã có lỗi khi tạo Vietsub bằng AI.";
      try {
        if (typeof msg === "string" && msg.trim().startsWith("{") && msg.trim().endsWith("}")) {
          const p = JSON.parse(msg.trim());
          if (p.error?.message) msg = p.error.message;
        }
      } catch {
        // not json
      }
      if (msg.includes("PERMISSION_DENIED") || msg.includes("denied access") || msg.includes("403")) {
        msg = "Dự án Google Cloud chưa được cấp quyền gọi mô hình (403 Permission Denied). Bạn có thể tải video mẫu hoặc nhập tệp SRT để tiếp tục.";
      }
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

  // Smart Split a single cue based on natural speech pauses
  const handleSmartSplitSingleCue = (cueId: number) => {
    setCues((prev) => {
      const targetCue = prev.find((c) => c.id === cueId);
      if (!targetCue) return prev;
      const segments = smartSplitSingleCue(targetCue);
      if (segments.length <= 1) {
        showToast(`Câu #${cueId} không đủ dài để tách thêm.`, "info");
        return prev;
      }
      const idx = prev.findIndex((c) => c.id === cueId);
      const nextCues = [...prev];
      nextCues.splice(idx, 1, ...segments);
      const reIndexed = nextCues.map((c, i) => ({ ...c, id: i + 1 }));
      showToast(`Đã tách câu #${idx + 1} thành ${segments.length} câu ngắn theo nhịp nói tự nhiên!`, "success");
      return reIndexed;
    });
  };

  return (
    <div
      id="app-root-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="app-container selection:bg-rose-500 selection:text-white"
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

      {/* Top Header - Bố cục tinh gọn, chuyên nghiệp, không lỗi tràn */}
      <header
        className="col-span-full z-30 shrink-0 border-b border-slate-800 bg-[#090d17]/95 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 select-none"
        style={{ gridColumn: "1 / -1", gridRow: "1" }}
      >
        {/* Left: Brand Identity & PWA Install */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-600/30 shrink-0">
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent truncate">
                Hendy Vietsub Studio
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                PRO AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden xl:block truncate">
              Biên tập video & phụ đề tiếng Việt tự động chuyên nghiệp
            </p>
          </div>

          <div className="hidden sm:block shrink-0 ml-1">
            <PWAInstallButton />
          </div>
        </div>

        {/* Center: Video Source Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            id="btn-upload-video-file"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition shadow-xs"
            title="Tải video của bạn từ máy tính (MP4, WebM, MOV)"
          >
            <Upload className="w-3.5 h-3.5 text-rose-400" />
            <span>Mở video</span>
          </button>

          <button
            id="btn-open-sample-modal"
            onClick={() => setIsSampleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition shadow-xs"
            title="Chọn video mẫu để thử nghiệm nhanh"
          >
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>Video mẫu</span>
          </button>

          <button
            id="btn-import-srt"
            onClick={() => srtInputRef.current?.click()}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition shadow-xs"
            title="Nhập phụ đề có sẵn (.SRT, .VTT)"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Nhập .SRT</span>
          </button>
        </div>

        {/* Right: Primary Call-to-actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-open-ai-generate-modal"
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Tạo Vietsub AI</span>
          </button>

          <button
            id="btn-open-export-modal"
            onClick={() => setIsExportModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition"
            title="Xuất file phụ đề hoặc Video có phụ đề"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file</span>
          </button>

          <button
            id="btn-open-apps-hub-modal"
            onClick={() => setIsAppsHubModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition"
            title="Cài đặt trên điện thoại Android (CH Play) và iPhone (App Store)"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">App Store & CH Play</span>
            <span className="xl:hidden">Mobile</span>
          </button>

          <button
            id="btn-open-shortcuts-modal"
            onClick={() => setIsShortcutsModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent hover:border-slate-800 transition"
            title="Bảng phím tắt (?)"
          >
            <Keyboard className="w-4 h-4 text-slate-400" />
          </button>

          {/* Mobile Menu / Drawer Hamburger Button */}
          <button
            id="btn-mobile-open-menu"
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="Mở menu công cụ"
          >
            <Menu className="w-4 h-4" />
          </button>
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

      {/* Main Workspace Layout (Row 2 & 3 of .app-container) */}
      {/* Left Sidebar - Grid col 1, row 2 */}
      <div
        className="hidden lg:block h-full overflow-hidden border-r border-slate-800/80 bg-[#080d1a]"
        style={{ width: "var(--sidebar-width, 60px)", gridColumn: "1 / 2", gridRow: "2" }}
      >
        <StudioLeftSidebar
          activeTab={activeRightTab}
          onSelectTab={(tab) => {
            setActiveRightTab(tab as RightPanelTab);
            if (mobileWorkspaceTab === "video") setMobileWorkspaceTab("subtitles");
          }}
          onOpenFilePicker={() => fileInputRef.current?.click()}
          onOpenVoiceoverModal={() => setIsAutoVoiceoverModalOpen(true)}
          onOpenStyleModal={() => setIsStyleModalOpen(true)}
          onOpenCapCutModal={() => setIsCapCutModalOpen(true)}
          onOpenCoverModal={() => setIsCoverModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenAppsHub={() => setIsAppsHubModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenCloudflare={() => setIsCloudflareModalOpen(true)}
        />
      </div>

      {/* Middle Column (1fr) - Khung chính: Video Canvas & Preview Area */}
      <main
        className={`flex-1 flex flex-col p-2 sm:p-3 overflow-hidden min-h-0 bg-[#0b0f19] ${
          mobileWorkspaceTab === "subtitles" ? "hidden lg:flex" : "flex"
        }`}
        style={{ gridColumn: responsiveLayout.isMobile ? undefined : "2 / 3", gridRow: responsiveLayout.isMobile ? undefined : "2" }}
      >
        {/* Video Title Bar */}
        <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 rounded-xl px-3.5 py-1.5 mb-2 shrink-0">
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
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Player Canvas */}
        <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden rounded-xl bg-black/80 border border-slate-800/80 shadow-inner relative">
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
            onPlayStateChange={(playing) => setIsVideoPlaying(playing)}
          />
        </div>

        {/* Quick Helper Tips & Shortcuts */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-400 flex items-center justify-between gap-3 mt-2 shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] truncate">
              <strong className="text-slate-200">Mẹo:</strong> Nhấp vào mốc phụ đề bên dưới để tua video nhanh tới vị trí đó.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 hover:text-white"
            >
              <kbd className="font-mono text-[10px] text-amber-400 font-semibold">Space</kbd> Phát/Dừng
            </button>
            <button
              type="button"
              id="btn-open-shortcuts-from-tips"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30"
              title="Xem toàn bộ bảng phím tắt nhanh (Nhấn ?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Phím tắt (?)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Right Column - Cột AI bên phải */}
      <div
        className={`w-full lg:w-[var(--right-panel-width,320px)] lg:max-w-[var(--right-panel-width,320px)] h-full flex flex-col min-h-0 bg-[#080d19] border-l border-slate-800 shrink-0 overflow-hidden ${
          mobileWorkspaceTab === "video" ? "hidden lg:flex" : "flex"
        }`}
        style={{
          width: "var(--right-panel-width, 320px)",
          maxWidth: "var(--right-panel-width, 320px)",
          gridColumn: responsiveLayout.isMobile ? undefined : "3 / 4",
          gridRow: responsiveLayout.isMobile ? undefined : "2",
        }}
      >
        <SubtitleList
          cues={cues}
          currentTime={currentTime}
          videoDuration={videoDuration}
          activeTab={activeRightTab}
          onTabChange={setActiveRightTab}
          onSelectCue={(time) => setCurrentTime(time)}
          onUpdateCue={handleUpdateCue}
          onDeleteCue={handleDeleteCue}
          onAddCue={handleAddCue}
          onShiftAllCues={handleShiftAllCues}
          onOpenRefineModal={() => setIsRefineModalOpen(true)}
          onMergeCues={handleMergeCues}
          onOpenVoiceoverModal={() => setIsAutoVoiceoverModalOpen(true)}
          onBatchUpdateCues={(updated) => {
            setCues(updated);
          }}
          onSaveEdits={() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            showToast(`Đã lưu chỉnh sửa phụ đề (${platformInfo.modifierKey} + Enter)!`, "success");
          }}
          onOpenAiGenerate={() => setIsGenerateModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenStyleModal={() => setIsStyleModalOpen(true)}
          onOpenCapCutModal={() => setIsCapCutModalOpen(true)}
          onOpenCoverModal={() => setIsCoverModalOpen(true)}
          onOpenWebDramaModal={() => setIsWebDramaModalOpen(true)}
          onOpenUniversalTranslatorModal={() => setIsUniversalTranslatorModalOpen(true)}
          onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
          onOpenAppsHub={() => setIsAppsHubModalOpen(true)}
          onNotify={showToast}
        />
      </div>

      {/* Timeline dưới cùng - Multi-Track: Track Video, Track Audio, Track Subtitle */}
      <div
        className={`col-span-full shrink-0 border-t border-slate-800/90 z-20 ${
          mobileWorkspaceTab === "subtitles" ? "hidden lg:block" : "block"
        }`}
        style={{
          height: "var(--timeline-height, 250px)",
          gridColumn: "1 / -1",
          gridRow: "3",
        }}
      >
        <Timeline
          currentTime={currentTime}
          duration={videoDuration}
          setCurrentTime={(t) => setCurrentTime(t)}
          cues={cues}
          onSelectCue={(_id, t) => {
            setCurrentTime(t);
          }}
          onAddCue={(t) => handleAddCue(t)}
          onSmartSplitCue={handleSmartSplitSingleCue}
          isPlaying={isVideoPlaying}
          onTogglePlay={() => videoPlayerRef.current?.togglePlay()}
          videoTitle={videoTitle}
          audioConfig={audioConfig}
          onUpdateAudioConfig={setAudioConfig}
          onOpenVoiceoverModal={() => setIsAutoVoiceoverModalOpen(true)}
        />
      </div>

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
        onUpdateCues={(updatedCues) => setCues(updatedCues)}
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

      {/* Cloudflare Workers AI & dash.cloudflare.com Deployment Modal */}
      <CloudflareDeploymentModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
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

      {/* Floating Minimized Export Status Badge (Desktop Only) */}
      {!isExportModalOpen && (
        <button
          id="btn-reopen-export-minimized"
          onClick={() => setIsExportModalOpen(true)}
          className="hidden lg:flex fixed bottom-5 right-5 z-40 items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs font-semibold hover:scale-105 active:scale-95 transition-all group"
          title="Mở lại cửa sổ Xuất Video & Phụ đề"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping group-hover:animate-none" />
          <Film className="w-4 h-4 text-emerald-400" />
          <span>Xuất Video & Sub</span>
        </button>
      )}

      {/* Touch-Optimized Mobile / Tablet Floating Bottom Dock */}
      <MobileBottomDock
        activeTab={mobileWorkspaceTab}
        onChangeTab={(tab) => setMobileWorkspaceTab(tab)}
        isPlaying={isVideoPlaying}
        onTogglePlay={() => videoPlayerRef.current?.togglePlay()}
        onAddCue={() => handleAddCue(currentTime)}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        cuesCount={cues.length}
        isTablet={responsiveLayout.isTablet}
      />

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />

      {/* Extensions, PWA & Cross-Platform (App Store & CH Play) Hub Modal */}
      <ExtensionsAndAppsHubModal
        isOpen={isAppsHubModalOpen}
        onClose={() => setIsAppsHubModalOpen(false)}
        onNotify={showToast}
      />

      {/* Mobile & Tablet Full Studio Tool Drawer */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        platformInfo={platformInfo}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
        onOpenDirectLinkModal={() => setIsUniversalTranslatorModalOpen(true)}
        onOpenVoiceoverModal={() => setIsAutoVoiceoverModalOpen(true)}
        onOpenCapCutModal={() => setIsCapCutModalOpen(true)}
        onOpenCoverModal={() => setIsCoverModalOpen(true)}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSampleVideosModal={() => setIsSampleModalOpen(true)}
        onOpenStyleModal={() => setIsStyleModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />
    </div>
  );
};

export default App;
