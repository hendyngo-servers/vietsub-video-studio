import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Video,
  FolderOpen,
  FileText,
  Wand2,
  Mic,
  Volume2,
  Settings,
  Save,
  DownloadCloud,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Cpu,
  Languages,
  RefreshCw,
  Layers,
  Plus,
  Trash2,
  Film,
  Sliders,
  Download,
  ChevronRight,
  ArrowDownToLine,
  Smartphone,
  Menu,
  X,
  Monitor,
  Square,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Info,
  Music,
  Scissors,
  Users,
  Upload,
  Globe,
  Terminal,
  Network,
} from "lucide-react";

import { VideoPlayer, VideoPlayerHandle } from "./components/VideoPlayer";
import { SystemLogsTable } from "./components/SystemLogsTable";
import { SystemArchitectureModal } from "./components/SystemArchitectureModal";
import { AIGenerateModal } from "./components/AIGenerateModal";
import { AIRefineModal } from "./components/AIRefineModal";
import { SubtitleStylingModal } from "./components/SubtitleStylingModal";
import { ExportModal } from "./components/ExportModal";
import { SampleVideosModal } from "./components/SampleVideosModal";
import { AICoverModal } from "./components/AICoverModal";
import { CapCutEditorModal } from "./components/CapCutEditorModal";
import { WebDramaImportModal } from "./components/WebDramaImportModal";
import { UniversalLinkTranslatorModal } from "./components/UniversalLinkTranslatorModal";
import { BookmarkletStudioModal } from "./components/BookmarkletStudioModal";
import { CloudflareDeploymentModal } from "./components/CloudflareDeploymentModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { AutoVoiceoverModal } from "./components/AutoVoiceoverModal";
import { ExtensionsAndAppsHubModal } from "./components/ExtensionsAndAppsHubModal";
import { useLocalStorage } from "./hooks/useLocalStorage";
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
import { SystemLogEntry, SubsystemType, LogSeverity } from "./types/logs";
import { extractAudioFromVideo } from "./utils/audioExtractor";
import { parseSRT, exportToSRT, exportToVTT } from "./utils/subtitleFormatters";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";

type MainViewTab = "workspace-view" | "media-library" | "subtitles-editor" | "system-logs";
type RightPanelTab = "ai-tools" | "translate" | "download";

export const App: React.FC = () => {
  // Navigation & View state
  const [activeMainTab, setActiveMainTab] = useState<MainViewTab>("workspace-view");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("ai-tools");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Video & Playback state
  const defaultSample = SAMPLE_VIDEOS[0];
  const [videoUrl, setVideoUrl] = useState<string>(defaultSample.videoUrl);
  const [videoTitle, setVideoTitle] = useState<string>(defaultSample.title);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [cues, setCues] = useState<SubtitleCue[]>(defaultSample.initialCues || []);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(38);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerVolume, setPlayerVolume] = useState<number>(85);
  const [timelineZoom, setTimelineZoom] = useState<"1s" | "5s" | "10s">("5s");

  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  // Subtitle styling configuration
  const [subtitleStyle, setSubtitleStyle] = useLocalStorage<SubtitleStyle>(
    "hendy_subtitle_style_v1",
    {
      fontSize: "lg",
      textColor: "#FACC15",
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

  // Audio editing configuration
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

  // Voiceover configuration
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

  // Modals state
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
  const [isAutoVoiceoverModalOpen, setIsAutoVoiceoverModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);

  // AI Pipeline Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [isRefining, setIsRefining] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Toast Notification System
  const [toast, setToast] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // System Logs & Real-time Telemetry State
  const [logs, setLogs] = useState<SystemLogEntry[]>([
    {
      id: "init-1",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false }) + ".015",
      subsystem: "UI",
      severity: "success",
      message: "Khởi tạo thành công giao diện AI Studio Pro & Bộ điều phối Workspace",
    },
    {
      id: "init-2",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false }) + ".068",
      subsystem: "CANVAS_RENDERER",
      severity: "info",
      message: `Đã nạp video dự án: "${defaultSample.title}"`,
      details: `Source: ${defaultSample.videoUrl}`,
    },
    {
      id: "init-3",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false }) + ".112",
      subsystem: "AUDIO_ENGINE",
      severity: "info",
      message: "Động cơ Web Audio API & Multi-Track Mixer sẵn sàng",
    },
    {
      id: "init-4",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false }) + ".185",
      subsystem: "GEMINI_AI",
      severity: "success",
      message: "Kết nối máy chủ Gemini AI & Edge Speech Synth qua endpoint /api/vietsub",
    },
  ]);
  const [isLogsExpanded, setIsLogsExpanded] = useState<boolean>(true);

  const addLog = (
    subsystem: SubsystemType,
    severity: LogSeverity,
    message: string,
    details?: string
  ) => {
    const ms = String(new Date().getMilliseconds()).padStart(3, "0");
    const timestamp = new Date().toLocaleTimeString("vi-VN", { hour12: false }) + "." + ms;
    const newEntry: SystemLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      subsystem,
      severity,
      message,
      details,
    };
    setLogs((prev) => [newEntry, ...prev].slice(0, 400));
  };

  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Keyboard shortcuts
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
      showToast("Đã lưu các chỉnh sửa phụ đề thành công!", "success");
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

  // Upload Video File
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    setCurrentFile(file);
    setCurrentTime(0);
    addLog(
      "CANVAS_RENDERER",
      "info",
      `Đã tải lên video cục bộ: "${file.name}"`,
      `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB, Type: ${file.type}`
    );
    showToast(`Đã mở video: "${file.name}"`, "success");
  };

  // Drag and drop video
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
      setCurrentFile(file);
      setCurrentTime(0);
      addLog(
        "CANVAS_RENDERER",
        "info",
        `Đã kéo thả tệp video: "${file.name}"`,
        `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
      );
      showToast(`Đã nạp video: "${file.name}"`, "success");
    }
  };

  // Select sample video
  const handleSelectSample = (sample: SampleVideo) => {
    setVideoUrl(sample.videoUrl);
    setVideoTitle(sample.title);
    setCurrentFile(null);
    setCues(sample.initialCues || []);
    setCurrentTime(0);
    addLog(
      "CANVAS_RENDERER",
      "info",
      `Đã nạp video mẫu: "${sample.title}"`,
      `Duration: ${sample.duration}, Cues: ${sample.initialCues?.length || 0}`
    );
    showToast(`Đã chọn video: ${sample.title}`, "success");
  };

  // Import SRT
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
          addLog("UI", "success", `Đã nạp ${parsed.length} câu phụ đề từ tệp SRT: "${file.name}"`);
          showToast(`Đã nạp ${parsed.length} câu phụ đề từ tệp SRT!`, "success");
        } else {
          addLog("UI", "warn", `Tệp "${file.name}" không chứa cấu trúc phụ đề SRT hợp lệ.`);
          showToast("Không tìm thấy dòng phụ đề hợp lệ.", "error");
        }
      }
    };
    reader.readAsText(file);
  };

  // Generate Vietsub AI
  const handleGenerateVietsub = async (config: GenerationConfig) => {
    setGenerationError(null);
    setIsProcessing(true);
    setProgressStep("Đang trích xuất âm thanh từ video...");
    setProgressPercent(15);
    addLog(
      "GEMINI_AI",
      "info",
      `Bắt đầu phân tích & tạo Vietsub AI cho video: "${videoTitle}"`,
      `Source: ${config.sourceLang}, Target: ${config.targetLang}, Style: ${config.style}, MaxChars: ${config.maxCharsPerLine}`
    );

    try {
      let audioBase64 = "";
      let mimeType = "audio/wav";

      if (currentFile) {
        const extracted = await extractAudioFromVideo(currentFile, (pct, msg) => {
          setProgressPercent(Math.round(pct * 0.5));
          setProgressStep(msg);
        });
        audioBase64 = extracted.base64;
        mimeType = extracted.mimeType;
      } else {
        setProgressStep("Đang nạp dữ liệu âm thanh video...");
        setProgressPercent(25);
        const res = await fetch(videoUrl);
        const blob = await res.blob();
        const extracted = await extractAudioFromVideo(blob, (pct, msg) => {
          setProgressPercent(20 + Math.round(pct * 0.35));
          setProgressStep(msg);
        });
        audioBase64 = extracted.base64;
        mimeType = extracted.mimeType;
      }

      addLog("AUDIO_ENGINE", "info", `Trích xuất audio buffer thành công (${mimeType}). Chuẩn bị gửi AI.`);
      setProgressStep("Đang nhận diện giọng nói & dịch Vietsub...");
      setProgressPercent(70);

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
        const errDetails = data.details || JSON.stringify(data, null, 2);
        throw new Error(data.error || "Không thể tạo phụ đề.");
      }

      if (data.cues && Array.isArray(data.cues)) {
        setCues(data.cues);
        setProgressPercent(100);
        setIsGenerateModalOpen(false);
        addLog(
          "GEMINI_AI",
          "success",
          `Tạo thành công ${data.cues.length} câu phụ đề Vietsub!`,
          `DetectedLang: ${data.detectedLanguage}, Target: ${data.targetLanguage}, Model: ${data.usedModel || "gemini-flash"}`
        );
        showToast(`Tạo thành công ${data.cues.length} câu phụ đề Vietsub!`, "success");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Đã có lỗi xảy ra.";
      setGenerationError(msg);
      addLog(
        "GEMINI_AI",
        "error",
        `Lỗi khi gọi API tạo Vietsub: ${msg}`,
        err.stack || (typeof err === "object" ? JSON.stringify(err, null, 2) : String(err))
      );
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
    addLog("GEMINI_AI", "info", `Bắt đầu hiệu đính phụ đề: "${instruction}"`, `Số lượng: ${cues.length} câu`);
    try {
      const response = await fetch("/api/vietsub/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cues, instruction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lỗi tối ưu phụ đề.");
      if (data.cues && Array.isArray(data.cues)) {
        setCues(data.cues);
        setIsRefineModalOpen(false);
        addLog("GEMINI_AI", "success", `Hiệu đính thành công ${data.cues.length} câu phụ đề!`);
        showToast("Đã tối ưu hóa câu chữ thành công!", "success");
      }
    } catch (err: any) {
      addLog("GEMINI_AI", "error", `Lỗi hiệu đính phụ đề: ${err.message}`, err.stack);
      showToast(err.message || "Lỗi khi tối ưu câu chữ.", "error");
    } finally {
      setIsRefining(false);
    }
  };

  // Quick Action: Phục hồi dấu tiếng Việt (AI Diacritics Recovery)
  const handleRestoreVietnameseDiacritics = async () => {
    if (cues.length === 0) {
      showToast("Chưa có phụ đề để phục hồi dấu.", "error");
      return;
    }
    addLog("GEMINI_AI", "info", "Kích hoạt tự động phục hồi dấu tiếng Việt (Telex/VNI)...");
    showToast("Đang phục hồi dấu tiếng Việt tự động bằng AI...", "info");
    await handleRefineSubtitles(
      "Phục hồi đầy đủ dấu tiếng Việt chuẩn xác, sửa lỗi mất dấu, gõ sai Telex hoặc VNI, viết đúng chính tả."
    );
  };

  // Quick Action: Văn phong điện ảnh (Cinema polish)
  const handleCinemaPolish = async () => {
    if (cues.length === 0) {
      showToast("Chưa có phụ đề để chuẩn hóa văn phong điện ảnh.", "error");
      return;
    }
    addLog("GEMINI_AI", "info", "Kích hoạt chuẩn hóa văn phong điện ảnh Hollywood...");
    showToast("Đang áp dụng văn phong điện ảnh rạp chiếu...", "info");
    await handleRefineSubtitles(
      "Viết lại theo văn phong lời thoại phim điện ảnh Hollywood/chiếu rạp, biểu cảm tự nhiên, ngắn gọn, dứt khoát."
    );
  };

  // Quick Action: Tách nhịp câu dài (Smart Split)
  const handleSmartSplitAll = async () => {
    if (cues.length === 0) {
      showToast("Chưa có phụ đề để tách nhịp.", "error");
      return;
    }
    addLog("GEMINI_AI", "info", "Đang quét và tách nhịp câu dài theo nhịp thở tự nhiên...");
    showToast("Đang phân tích và tách nhịp câu dài...", "info");
    try {
      const res = await fetch("/api/vietsub/smart-split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cues, config: { maxCharsPerLine: 40, maxDuration: 4.0 } }),
      });
      const data = await res.json();
      if (data.cues && Array.isArray(data.cues)) {
        setCues(data.cues);
        addLog("GEMINI_AI", "success", `Đã tách nhịp tối ưu (+${data.cues.length - cues.length} câu mới)!`);
        showToast(`Đã tách nhịp tối ưu (+${data.cues.length - cues.length} câu mới)!`, "success");
      }
    } catch (err: any) {
      addLog("GEMINI_AI", "error", "Lỗi khi tách nhịp phụ đề.", err?.message);
      showToast("Lỗi khi tách nhịp phụ đề.", "error");
    }
  };

  // Subtitle CRUD
  const handleUpdateCueText = (id: number, textVi: string) => {
    setCues((prev) => prev.map((c) => (c.id === id ? { ...c, textVi } : c)));
  };

  const handleDeleteCue = (id: number) => {
    setCues((prev) => prev.filter((c) => c.id !== id));
    addLog("UI", "info", `Đã xóa câu phụ đề #${id}.`);
    showToast("Đã xóa dòng phụ đề.", "info");
  };

  const handleAddCue = () => {
    const start = Number(currentTime.toFixed(2));
    const end = Number((start + 2.5).toFixed(2));
    const newId = cues.length > 0 ? Math.max(...cues.map((c) => c.id)) + 1 : 1;

    const newCue: SubtitleCue = {
      id: newId,
      start,
      end,
      startTime: formatTime(start),
      endTime: formatTime(end),
      textOriginal: "New speech line",
      textVi: "Dòng phụ đề mới",
    };

    const updated = [...cues, newCue].sort((a, b) => a.start - b.start);
    setCues(updated);
    addLog("UI", "info", `Đã thêm dòng phụ đề mới #${newId} tại ${start}s.`);
    showToast("Đã thêm dòng phụ đề mới tại vị trí hiện tại.", "success");
  };

  const handleExportFile = (format: "srt" | "vtt") => {
    if (cues.length === 0) {
      showToast("Chưa có phụ đề để xuất.", "error");
      return;
    }
    const content = format === "srt" ? exportToSRT(cues) : exportToVTT(cues);
    const mime = format === "srt" ? "application/x-subrip" : "text/vtt";
    const filename = `${videoTitle || "subtitles"}.${format}`;

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("UI", "success", `Đã xuất tệp .${format.toUpperCase()}: "${filename}"`);
    showToast(`Đã tải xuống tệp .${format.toUpperCase()} thành công!`, "success");
  };

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  }

  function formatTimeDisplay(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex h-screen overflow-hidden antialiased select-none text-slate-100 bg-[#090d16]"
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

      {/* LEFT SIDEBAR / ICON DOCK */}
      <aside
        className={`sidebar-transition glass-panel flex flex-col z-30 shrink-0 border-r border-white/[0.08] relative ${
          isSidebarCollapsed ? "w-[72px]" : "w-72"
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent truncate">
                AI Studio Pro
              </span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title={isSidebarCollapsed ? "Mở rộng thanh công cụ" : "Thu gọn vào Dock icon"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Group: Media & Project */}
          <div>
            {!isSidebarCollapsed && (
              <div className="text-[11px] font-semibold text-slate-400 px-3 mb-2 uppercase tracking-wider">
                Dự án & Media
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setActiveMainTab("workspace-view")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeMainTab === "workspace-view"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                title="Không Gian Chính (Video + Subtitle + Timeline)"
              >
                <Video className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Không Gian Chính</span>}
              </button>

              <button
                onClick={() => setActiveMainTab("media-library")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeMainTab === "media-library"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                title="Thư Viện Media (Video mẫu, Tải file, Web Link)"
              >
                <FolderOpen className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Thư Viện Media</span>}
              </button>

              <button
                onClick={() => setActiveMainTab("subtitles-editor")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeMainTab === "subtitles-editor"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                title="Trình Biên Tập Sub Chi Tiết"
              >
                <FileText className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Trình Biên Tập Sub</span>}
              </button>
            </div>
          </div>

          {/* Group: AI Suite */}
          <div>
            {!isSidebarCollapsed && (
              <div className="text-[11px] font-semibold text-slate-400 px-3 mb-2 uppercase tracking-wider">
                Công Cụ Thông Minh
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={handleRestoreVietnameseDiacritics}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all"
                title="Phục hồi dấu tiếng Việt AI (Telex/VNI/mất dấu)"
              >
                <Wand2 className="w-5 h-5 shrink-0 text-purple-400" />
                {!isSidebarCollapsed && <span className="truncate">Phục Hồi Dấu Tiếng Việt</span>}
              </button>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all"
                title="Tạo Vietsub AI từ giọng nói (Whisper STT)"
              >
                <Mic className="w-5 h-5 shrink-0 text-blue-400" />
                {!isSidebarCollapsed && <span className="truncate">Whisper Voice-to-Text</span>}
              </button>

              <button
                onClick={() => setIsAutoVoiceoverModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all"
                title="Lồng Tiếng AI Phân Vai (TTS Nam/Nữ/Già/Trẻ)"
              >
                <Volume2 className="w-5 h-5 shrink-0 text-emerald-400" />
                {!isSidebarCollapsed && <span className="truncate">Lồng Tiếng AI (TTS)</span>}
              </button>

              <button
                onClick={() => setIsCapCutModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all"
                title="Preset Phim & Hiệu Ứng Kiểu CapCut"
              >
                <Film className="w-5 h-5 shrink-0 text-amber-400" />
                {!isSidebarCollapsed && <span className="truncate">Phong Cách CapCut</span>}
              </button>
            </div>
          </div>

          {/* Group: System */}
          <div>
            {!isSidebarCollapsed && (
              <div className="text-[11px] font-semibold text-slate-400 px-3 mb-2 uppercase tracking-wider">
                Hệ Thống
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setIsStyleModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all"
                title="Tùy biến hiển thị phụ đề & giao diện"
              >
                <Settings className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Cài Đặt & Cấu Hình</span>}
              </button>

              <button
                onClick={() => {
                  setActiveMainTab("workspace-view");
                  setIsLogsExpanded(true);
                  setTimeout(() => {
                    document.getElementById("workspace-system-logs-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeMainTab === "system-logs"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                title="Giám Sát Lỗi & Nhật Ký Hệ Thống Thời Gian Thực"
              >
                <Terminal className="w-5 h-5 shrink-0 text-purple-400" />
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between w-full overflow-hidden">
                    <span className="truncate">Nhật Ký & Lỗi</span>
                    {logs.filter((l) => l.severity === "error").length > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                        {logs.filter((l) => l.severity === "error").length}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                )}
              </button>

              <button
                onClick={() => setIsArchitectureModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all"
                title="Sơ Đồ Kiến Trúc Hệ Thống Vietsub Bot"
              >
                <Network className="w-5 h-5 shrink-0 text-sky-400" />
                {!isSidebarCollapsed && <span className="truncate">Sơ Đồ Kiến Trúc</span>}
              </button>

              <button
                onClick={() => setIsShortcutsModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all"
                title="Bảng phím tắt (?)"
              >
                <Keyboard className="w-5 h-5 shrink-0 text-slate-400" />
                {!isSidebarCollapsed && <span className="truncate">Phím Tắt (?)</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Profile */}
        <div className="p-3 border-t border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
            PRO
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">Studio Creator</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sẵn sàng
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* CENTRAL WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navigation / Status Bar */}
        <header className="h-16 glass-panel border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate max-w-[200px] sm:max-w-xs">
              Dự án: {videoTitle}
            </span>
            <span className="text-xs text-slate-400 hidden md:inline">
              1920x1080 (30 FPS) · {cues.length} phụ đề
            </span>

            {/* Aspect Ratio Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 text-xs">
              <button
                onClick={() => setSubtitleStyle((s) => ({ ...s, aspectRatio: "16:9" }))}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition ${
                  subtitleStyle.aspectRatio === "16:9"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => setSubtitleStyle((s) => ({ ...s, aspectRatio: "9:16" }))}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition ${
                  subtitleStyle.aspectRatio === "9:16"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                9:16
              </button>
              <button
                onClick={() => setSubtitleStyle((s) => ({ ...s, aspectRatio: "1:1" }))}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition ${
                  subtitleStyle.aspectRatio === "1:1"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1:1
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Telemetry / Error Indicator Button */}
            <button
              onClick={() => {
                setActiveMainTab("workspace-view");
                setIsLogsExpanded(true);
                setTimeout(() => {
                  document.getElementById("workspace-system-logs-section")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition ${
                logs.filter((l) => l.severity === "error").length > 0
                  ? "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                  : "bg-white/5 text-slate-300 border-white/5 hover:text-white hover:bg-white/10"
              }`}
              title="Xem nhật ký lỗi hệ thống thời gian thực"
            >
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Logs ({logs.length})</span>
              {logs.filter((l) => l.severity === "error").length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {logs.filter((l) => l.severity === "error").length} lỗi
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5 border border-white/5"
              title="Mở video khác từ máy tính"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Mở video</span>
            </button>

            <button
              onClick={() => showToast("Đã lưu dự án vào bộ nhớ cục bộ!", "success")}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5 border border-white/5"
              title="Lưu tiến độ dự án"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lưu</span>
            </button>

            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo Vietsub AI</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Xuất Video</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* TAB 1: WORKSPACE VIEW (Video Player + AI Pipeline + Timeline) */}
          {activeMainTab === "workspace-view" && (
            <div className="flex flex-col gap-4 flex-1">
              {/* Video Preview Canvas Section */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 shrink-0">
                {/* Main Video Player Canvas */}
                <div className="xl:col-span-2 glass-panel rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden min-h-[340px] bg-black/50">
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-semibold text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> Live Preview
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-white/10">
                      {subtitleStyle.aspectRatio}
                    </span>
                  </div>

                  {/* Canvas / Video Container */}
                  <div className="w-full flex-1 flex items-center justify-center min-h-[260px] overflow-hidden rounded-xl relative">
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
                      onPlayStateChange={(playing) => setIsPlaying(playing)}
                    />
                  </div>

                  {/* Player Controls Bar */}
                  <div className="w-full mt-3 pt-2 border-t border-white/5 flex items-center justify-between px-2 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => videoPlayerRef.current?.togglePlay()}
                        className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 transition"
                        title={isPlaying ? "Tạm dừng (Space)" : "Phát (Space)"}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={() => videoPlayerRef.current?.seekRelative(-5)}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition"
                        title="Tua lùi 5 giây"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => videoPlayerRef.current?.seekRelative(5)}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition"
                        title="Tua tới 5 giây"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <span className="font-mono text-slate-300">
                        {formatTimeDisplay(currentTime)} / {formatTimeDisplay(videoDuration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-slate-400" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={playerVolume}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPlayerVolume(val);
                            videoPlayerRef.current?.setVolume(val / 100);
                          }}
                          className="w-18 accent-blue-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const container = document.getElementById("root");
                          if (!document.fullscreenElement) {
                            container?.requestFullscreen?.();
                          } else {
                            document.exitFullscreen?.();
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition"
                        title="Toàn màn hình"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Secondary AI Pipeline Status & Quick Card */}
                <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" /> Trạng thái AI Pipeline
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Hoạt động
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Hệ thống đồng bộ đa luồng: Phụ đề Whisper AI, Dịch thuật Gemini và Thuyết minh phân vai.
                    </p>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white">Whisper Speech Subtitle</div>
                            <div className="text-[10px] text-slate-400">{cues.length} câu đã nhận diện</div>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold">100%</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Languages className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white">Dịch AI Gemini</div>
                            <div className="text-[10px] text-slate-400">Song ngữ Anh - Việt chuẩn rạp</div>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold">Hoàn tất</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Volume2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white">Thuyết Minh Phân Vai</div>
                            <div className="text-[10px] text-slate-400">Edge-TTS Đa giọng nói</div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-400 font-semibold">Sẵn sàng</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex gap-2">
                    <button
                      onClick={() => setIsGenerateModalOpen(true)}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition border border-white/5 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Chạy lại AI
                    </button>
                    <button
                      onClick={handleSmartSplitAll}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition border border-white/5 flex items-center justify-center gap-1.5"
                    >
                      <Scissors className="w-3.5 h-3.5 text-amber-400" /> Tách nhịp
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline / Track Management Section */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" /> Dòng Thời Gian & Track Đa Kênh
                    </h3>
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 text-xs">
                      <button
                        onClick={() => setTimelineZoom("1s")}
                        className={`px-2 py-0.5 rounded transition ${
                          timelineZoom === "1s" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        01s
                      </button>
                      <button
                        onClick={() => setTimelineZoom("5s")}
                        className={`px-2 py-0.5 rounded transition ${
                          timelineZoom === "5s" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        05s
                      </button>
                      <button
                        onClick={() => setTimelineZoom("10s")}
                        className={`px-2 py-0.5 rounded transition ${
                          timelineZoom === "10s" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        10s
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddCue}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm Phụ Đề
                    </button>
                  </div>
                </div>

                {/* Timeline Tracks Visualizer */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2 relative overflow-x-auto">
                  {/* Ruler */}
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono border-b border-white/5 pb-1 px-1">
                    <span>00:00</span>
                    <span>00:15</span>
                    <span>00:30</span>
                    <span>00:45</span>
                    <span>01:00</span>
                    <span>{formatTimeDisplay(videoDuration)}</span>
                  </div>

                  {/* Track 1: Video */}
                  <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                    <div className="w-28 text-xs font-medium text-slate-400 flex items-center gap-1.5 shrink-0">
                      <Film className="w-3.5 h-3.5 text-blue-400" /> Kênh 1 (Video)
                    </div>
                    <div className="flex-1 bg-blue-600/20 border border-blue-500/40 rounded-md h-8 relative flex items-center px-3 overflow-hidden">
                      <span className="text-[11px] font-medium text-blue-300 truncate">
                        {videoTitle} (100% Vol)
                      </span>
                    </div>
                  </div>

                  {/* Track 2: Audio Dubbing */}
                  <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                    <div className="w-28 text-xs font-medium text-slate-400 flex items-center gap-1.5 shrink-0">
                      <Mic className="w-3.5 h-3.5 text-purple-400" /> Kênh 2 (Lồng tiếng)
                    </div>
                    <div className="flex-1 bg-purple-600/20 border border-purple-500/40 rounded-md h-8 relative flex items-center px-3 overflow-hidden">
                      <span className="text-[11px] font-medium text-purple-300 truncate">
                        vi-VN-Neural AI Voiceover (Tự động giảm âm nền 25%)
                      </span>
                    </div>
                  </div>

                  {/* Track 3: Subtitles */}
                  <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                    <div className="w-28 text-xs font-medium text-slate-400 flex items-center gap-1.5 shrink-0">
                      <FileText className="w-3.5 h-3.5 text-amber-400" /> Kênh 3 (Phụ đề)
                    </div>
                    <div className="flex-1 relative h-8 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center px-2 overflow-hidden gap-1">
                      {cues.slice(0, 8).map((cue) => (
                        <div
                          key={cue.id}
                          onClick={() => {
                            setCurrentTime(cue.start);
                            videoPlayerRef.current?.seekTo(cue.start);
                          }}
                          className="bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/50 rounded px-2 py-0.5 text-[10px] text-amber-200 truncate cursor-pointer transition shrink-0 max-w-[160px]"
                          title={`${cue.startTime} - ${cue.endTime}: ${cue.textVi}`}
                        >
                          #{cue.id}: {cue.textVi}
                        </div>
                      ))}
                      {cues.length > 8 && (
                        <span className="text-[10px] text-amber-400 shrink-0 font-medium">
                          +{cues.length - 8} câu nữa...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time System Logs & Diagnostics Table in Workspace */}
              <div id="workspace-system-logs-section" className="shrink-0 mt-2">
                <SystemLogsTable
                  logs={logs}
                  onClearLogs={() => {
                    setLogs([]);
                    showToast("Đã dọn sạch lịch sử nhật ký hệ thống.", "info");
                  }}
                  isExpanded={isLogsExpanded}
                  onToggleExpand={() => setIsLogsExpanded(!isLogsExpanded)}
                  onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA LIBRARY */}
          {activeMainTab === "media-library" && (
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FolderOpen className="text-blue-400" /> Thư Viện Tệp Tin & Video Mẫu
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Chọn video mẫu có sẵn hoặc tải tệp video MP4/WebM từ máy của bạn để biên tập và tạo Vietsub.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsWebDramaModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" /> Nhập Link Web / Phim
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Tải Video Mới
                  </button>
                </div>
              </div>

              {/* Sample Videos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SAMPLE_VIDEOS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => {
                      handleSelectSample(sample);
                      setActiveMainTab("workspace-view");
                    }}
                    className={`p-4 rounded-xl glass-card transition cursor-pointer group ${
                      videoTitle === sample.title ? "border-blue-500 ring-1 ring-blue-500/40" : ""
                    }`}
                  >
                    <div className="aspect-video rounded-lg bg-slate-900 mb-3 overflow-hidden relative flex items-center justify-center border border-white/5">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 flex flex-col justify-end p-2.5">
                        <span className="text-[10px] text-blue-300 font-mono">{sample.duration}</span>
                      </div>
                      <Film className="w-10 h-10 text-slate-600 group-hover:text-blue-400 transition transform group-hover:scale-110" />
                    </div>
                    <h4 className="font-semibold text-sm text-white group-hover:text-blue-300 transition truncate">
                      {sample.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {sample.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SUBTITLES EDITOR TABLE */}
          {activeMainTab === "subtitles-editor" && (
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="text-purple-400" /> Bảng Biên Tập Phụ Đề Chi Tiết
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chỉnh sửa trực tiếp từng câu thoại, sửa dấu tiếng Việt, nghe thử và phân chia mốc thời gian.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddCue}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition flex items-center gap-1 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Câu
                  </button>
                  <button
                    onClick={handleRestoreVietnameseDiacritics}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Phục Hồi Dấu
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-slate-400 text-xs">
                      <th className="p-3 w-14">STT</th>
                      <th className="p-3 w-36">Thời gian</th>
                      <th className="p-3">Lời thoại gốc</th>
                      <th className="p-3">Bản dịch Tiếng Việt (Vietsub)</th>
                      <th className="p-3 text-center w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cues.map((cue, idx) => (
                      <tr key={cue.id} className="hover:bg-white/[0.03] transition">
                        <td className="p-3 font-mono text-xs text-slate-400">#{idx + 1}</td>
                        <td className="p-3 font-mono text-xs text-blue-300">
                          {cue.start}s - {cue.end}s
                        </td>
                        <td className="p-3 text-slate-300 text-xs max-w-[200px] truncate">
                          {cue.textOriginal || "(Không có)"}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={cue.textVi}
                            onChange={(e) => handleUpdateCueText(cue.id, e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none transition"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setCurrentTime(cue.start);
                                videoPlayerRef.current?.seekTo(cue.start);
                              }}
                              className="p-1 rounded hover:bg-blue-500/20 text-blue-400 transition"
                              title="Tua đến mốc này"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => handleDeleteCue(cue.id)}
                              className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition"
                              title="Xóa câu này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DEDICATED FULL-PAGE SYSTEM LOGS & TELEMETRY */}
          {activeMainTab === "system-logs" && (
            <div className="flex-1 flex flex-col gap-4">
              <SystemLogsTable
                logs={logs}
                onClearLogs={() => {
                  setLogs([]);
                  showToast("Đã dọn sạch lịch sử nhật ký hệ thống.", "info");
                }}
                isExpanded={true}
                onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      {/* RIGHT CONTROL PANEL */}
      <aside className="w-80 glass-panel flex flex-col z-30 shrink-0 border-l border-white/[0.08]">
        {/* Header / Tabs Navigation */}
        <div className="h-16 flex items-center px-3 border-b border-white/[0.08] bg-black/20">
          <div className="grid grid-cols-3 gap-1 w-full bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveRightTab("ai-tools")}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition text-center truncate ${
                activeRightTab === "ai-tools"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Công Cụ AI
            </button>
            <button
              onClick={() => setActiveRightTab("translate")}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition text-center truncate ${
                activeRightTab === "translate"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dịch AI
            </button>
            <button
              onClick={() => setActiveRightTab("download")}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition text-center truncate ${
                activeRightTab === "download"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tải Xuống
            </button>
          </div>
        </div>

        {/* Right Panel Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* TAB 1: CÔNG CỤ AI */}
          {activeRightTab === "ai-tools" && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1">
                Trí Tuệ Nhân Tạo (Gemini AI)
              </div>

              <button
                onClick={handleRestoreVietnameseDiacritics}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Phục Hồi Dấu Tiếng Việt</div>
                    <div className="text-[10px] text-slate-400">Tự sửa lỗi mất dấu, Telex/VNI</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              <button
                onClick={handleCinemaPolish}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Văn Phong Điện Ảnh Hollywood</div>
                    <div className="text-[10px] text-slate-400">Chuẩn hóa thoại tự nhiên, biểu cảm</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Chuyển Âm Thanh Thành Chữ</div>
                    <div className="text-[10px] text-slate-400">Tự động lắng nghe & tạo phụ đề</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              <button
                onClick={handleSmartSplitAll}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Tách Nhịp Câu Dài Thông Minh</div>
                    <div className="text-[10px] text-slate-400">Chia nhỏ theo nhịp thở tự nhiên</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => setIsAutoVoiceoverModalOpen(true)}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Nhận Diện Phân Vai Tự Động</div>
                    <div className="text-[10px] text-slate-400">Gán giọng Nam, Nữ, Già, Trẻ</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>
            </div>
          )}

          {/* TAB 2: DỊCH AI */}
          {activeRightTab === "translate" && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1">
                Cấu hình Dịch & Phụ Đề
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Hiển thị Vietsub:</span>
                  <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 text-[11px]">
                    <button
                      onClick={() => setSubtitleStyle((s) => ({ ...s, displayMode: "bilingual" }))}
                      className={`px-2 py-1 rounded transition ${
                        subtitleStyle.displayMode === "bilingual" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Song ngữ
                    </button>
                    <button
                      onClick={() => setSubtitleStyle((s) => ({ ...s, displayMode: "vi" }))}
                      className={`px-2 py-1 rounded transition ${
                        subtitleStyle.displayMode === "vi" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Chỉ Việt
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Font chữ:</span>
                  <span className="font-mono text-blue-400 text-xs">Plus Jakarta Sans</span>
                </div>
              </div>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2"
              >
                <Languages className="w-4 h-4" /> Dịch AI Toàn Bộ Sub
              </button>
            </div>
          )}

          {/* TAB 3: TẢI XUỐNG */}
          {activeRightTab === "download" && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1">
                Xuất Tệp Đầu Ra
              </div>

              <button
                onClick={() => handleExportFile("srt")}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Tải Xuống Tệp .SRT</div>
                    <div className="text-[10px] text-slate-400">Subtitle chuẩn quốc tế</div>
                  </div>
                </div>
                <ArrowDownToLine className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => handleExportFile("vtt")}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Tải Xuống Tệp .VTT</div>
                    <div className="text-[10px] text-slate-400">Web Video Text Track</div>
                  </div>
                </div>
                <ArrowDownToLine className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                <Video className="w-4 h-4" /> Xuất Video + Sub Ghép Nối
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Custom Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none">
          <div className="glass-panel px-4 py-3 rounded-2xl shadow-2xl border border-blue-500/30 bg-slate-900/95 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              {toast.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Info className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white">AI Studio Pro</div>
              <div className="text-xs text-slate-300">{toast.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
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

      <CapCutEditorModal
        isOpen={isCapCutModalOpen}
        onClose={() => setIsCapCutModalOpen(false)}
        style={subtitleStyle}
        onChangeStyle={setSubtitleStyle}
        audioConfig={audioConfig}
        onChangeAudioConfig={setAudioConfig}
      />

      <UniversalLinkTranslatorModal
        isOpen={isUniversalTranslatorModalOpen}
        onClose={() => setIsUniversalTranslatorModalOpen(false)}
        onImportSuccess={(result) => {
          setVideoUrl(result.videoUrl);
          setVideoTitle(result.title);
          if (result.duration) setVideoDuration(result.duration);
          if (result.initialCues && result.initialCues.length > 0) setCues(result.initialCues);
          showToast(`Đã nạp video: "${result.title}"`, "success");
        }}
        onAddLiveCues={(newCues) => setCues((prev) => [...prev, ...newCues])}
        onNotify={showToast}
      />

      <WebDramaImportModal
        isOpen={isWebDramaModalOpen}
        onClose={() => setIsWebDramaModalOpen(false)}
        onImportSuccess={(result) => {
          setVideoUrl(result.videoUrl);
          setVideoTitle(result.title);
          if (result.duration) setVideoDuration(result.duration);
          if (result.initialCues && result.initialCues.length > 0) setCues(result.initialCues);
          showToast(`Đã nạp phim: "${result.title}"`, "success");
        }}
        onImportVideo={(result) => {
          setVideoUrl(result.videoUrl);
          setVideoTitle(result.title);
          if (result.duration) setVideoDuration(result.duration);
          if (result.initialCues && result.initialCues.length > 0) setCues(result.initialCues);
          showToast(`Đã nạp phim: "${result.title}"`, "success");
        }}
        onNotify={showToast}
      />

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

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        isPinned={false}
        onTogglePin={() => {}}
      />

      <ExtensionsAndAppsHubModal
        isOpen={isAppsHubModalOpen}
        onClose={() => setIsAppsHubModalOpen(false)}
        onNotify={showToast}
      />

      <SystemArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        onNotify={showToast}
      />
    </div>
  );
};

export default App;
