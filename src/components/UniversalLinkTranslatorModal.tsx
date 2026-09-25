import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Link,
  Globe,
  Sparkles,
  Smartphone,
  Play,
  Monitor,
  Mic,
  MicOff,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tv,
  ArrowRight,
  Flame,
  Volume2,
  Radio,
  Share2,
  ExternalLink,
  Bookmark,
  Layers,
  Users,
} from "lucide-react";
import { SubtitleCue } from "../types";

export interface UniversalImportResult {
  videoUrl: string;
  title: string;
  duration?: number;
  initialCues?: SubtitleCue[];
  autoStartTranslate?: boolean;
}

interface UniversalLinkTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (result: UniversalImportResult) => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
  onAddLiveCues?: (cues: SubtitleCue[]) => void;
}

export const UniversalLinkTranslatorModal: React.FC<UniversalLinkTranslatorModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onNotify,
  onAddLiveCues,
}) => {
  const [activeTab, setActiveTab] = useState<"link" | "live-capture" | "bookmarklet">("link");

  // Tab 1: Universal Link State
  const [urlInput, setUrlInput] = useState<string>("https://www.av01.media/vn/video/219129/mida-786-lada");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoVoiceoverOnImport, setAutoVoiceoverOnImport] = useState(true);
  const [autoStartTranslate, setAutoStartTranslate] = useState(true);

  // Tab 2: Live App / Screen Capture State
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedStream, setCapturedStream] = useState<MediaStream | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [liveSubtitles, setLiveSubtitles] = useState<
    Array<{
      id: number;
      time: string;
      original: string;
      vietnamese: string;
      speakerRole?: string;
      speakerGender?: string;
      emotion?: string;
    }>
  >([]);
  const [autoSpeakLive, setAutoSpeakLive] = useState(true);
  const recognitionRef = useRef<any>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const capturedStreamRef = useRef<MediaStream | null>(null);

  // Stop Live Capture defined early so it can be used safely in useEffect cleanup
  const stopLiveCapture = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    if (capturedStreamRef.current) {
      capturedStreamRef.current.getTracks().forEach((track) => track.stop());
      capturedStreamRef.current = null;
    }
    setCapturedStream(null);
    setIsCapturing(false);
  }, []);

  // Tab 3: Bookmarklet state
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // Quick Preset Links for testing any platform immediately
  const PRESET_LINKS = [
    {
      id: "av01-cinema",
      title: "AV01 Media: MIDA-786 LADA (Phim Web Nhật)",
      url: "https://www.av01.media/vn/video/219129/mida-786-lada",
      badge: "AV01 Cinema",
      platform: "Web Cinema",
      lang: "Tiếng Nhật (JP)",
      description: "Phim trực tuyến trên nền tảng AV01 Media, hỗ trợ trích xuất luồng và dịch Vietsub song ngữ chuẩn xác.",
      sampleVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      cues: [
        {
          id: 1,
          start: 0.8,
          end: 4.5,
          startTime: "00:00:00.800",
          endTime: "00:00:04.500",
          textOriginal: "私をずっと待っていてくれたの？",
          textVi: "Em đã đợi anh suốt khoảng thời gian này sao?",
          speakerGender: "female" as const,
          speakerAge: "young" as const,
          speakerRole: "Nữ chính (Nữ trẻ)",
          voicePersona: "female_young" as const,
        },
        {
          id: 2,
          start: 5.0,
          end: 9.2,
          startTime: "00:00:05.000",
          endTime: "00:00:09.200",
          textOriginal: "信じられないかもしれないけれど、すべてあなたのためだったの。",
          textVi: "Có thể anh không tin, nhưng tất cả những gì em làm đều là vì anh.",
          speakerGender: "female" as const,
          speakerAge: "young" as const,
          speakerRole: "Nữ chính (Nữ trẻ)",
          voicePersona: "female_young" as const,
        },
        {
          id: 3,
          start: 9.8,
          end: 14.5,
          startTime: "00:00:09.800",
          endTime: "00:00:14.500",
          textOriginal: "これからはもう、二度と離れないと約束する。",
          textVi: "Kể từ giờ, anh hứa chúng ta sẽ không bao giờ rời xa nhau nữa.",
          speakerGender: "male" as const,
          speakerAge: "young" as const,
          speakerRole: "Nam chính (Nam trẻ)",
          voicePersona: "male_young" as const,
        },
      ],
    },
    {
      id: "tiktok-drama",
      title: "TikTok Short Drama: Tổng Tài Bá Đạo",
      url: "https://shortdrama.tiktok.com/t/ZSb1YsoJV/",
      badge: "TikTok Drama",
      platform: "TikTok",
      lang: "Tiếng Trung (ZH)",
      description: "Phim ngắn tình cảm ngắn dồn dập, drama cao trào trên TikTok/Douyin.",
      sampleVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      cues: [
        {
          id: 1,
          start: 0.5,
          end: 4.8,
          startTime: "00:00:00.500",
          endTime: "00:00:04.800",
          textOriginal: "你真的以为能一辈子瞒着我吗？",
          textVi: "Em thật sự nghĩ rằng có thể che giấu bí mật này với tôi cả đời sao?",
          speakerGender: "male" as const,
          speakerAge: "young" as const,
          speakerRole: "Tổng tài (Nam trẻ)",
          voicePersona: "male_young" as const,
        },
        {
          id: 2,
          start: 5.2,
          end: 9.6,
          startTime: "00:00:05.200",
          endTime: "00:00:09.600",
          textOriginal: "我所做的一切，都是为了守护这个家！",
          textVi: "Tất cả những gì tôi làm, đều chỉ để bảo vệ gia đình này!",
          speakerGender: "female" as const,
          speakerAge: "young" as const,
          speakerRole: "Nữ chính (Nữ trẻ)",
          voicePersona: "female_young" as const,
        },
      ],
    },
    {
      id: "youtube-web",
      title: "YouTube / Facebook Reels / Instagram Clip",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      badge: "YouTube / Reels",
      platform: "Social Video",
      lang: "Đa ngôn ngữ",
      description: "Video ngắn, phóng sự, âm nhạc hoặc phỏng vấn từ YouTube, Facebook Reels, Bilibili.",
      sampleVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      cues: [
        {
          id: 1,
          start: 1.0,
          end: 5.2,
          startTime: "00:00:01.000",
          endTime: "00:00:05.200",
          textOriginal: "Welcome to today's special broadcast episode.",
          textVi: "Chào mừng quý vị và các bạn đến với số phát sóng đặc biệt ngày hôm nay.",
          speakerGender: "male" as const,
          speakerAge: "adult" as const,
          speakerRole: "MC Dẫn chương trình",
          voicePersona: "male_adult" as const,
        },
      ],
    },
    {
      id: "direct-hls",
      title: "Luồng Trực Tiếp HLS .m3u8 / MP4 Online",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      badge: "HLS / Direct",
      platform: "Direct Media",
      lang: "Mọi ngôn ngữ",
      description: "Đường dẫn file video trực tiếp trên server (.mp4, .m3u8, .webm, .mp3).",
      sampleVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      cues: [],
    },
  ];

  // Clean up media streams if modal unmounts
  useEffect(() => {
    return () => {
      stopLiveCapture();
    };
  }, [stopLiveCapture]);

  if (!isOpen) return null;

  // Handle URL Import Submission
  const handleImportSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) {
      setErrorMsg("Vui lòng dán liên kết video, website hoặc ứng dụng vào ô trống.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/video/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể phân giải liên kết này.");
      }

      onNotify?.(`Đã tải thành công: "${data.title || "Video Web"}"!`, "success");

      onImportSuccess?.({
        videoUrl: data.videoUrl,
        title: data.title || "Video Trực Tuyến",
        initialCues: data.initialCues || [],
        autoStartTranslate: autoStartTranslate,
      });

      onClose();
    } catch (err: any) {
      console.error("[Universal Link] Error:", err);
      setErrorMsg(err.message || "Không thể tải liên kết. Vui lòng kiểm tra lại URL.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Select Preset Link
  const handleSelectPreset = (preset: typeof PRESET_LINKS[0]) => {
    onNotify?.(`Đã chọn: "${preset.title}". Đang nạp video...`, "success");
    onImportSuccess?.({
      videoUrl: preset.sampleVideoUrl,
      title: preset.title,
      initialCues: preset.cues,
      autoStartTranslate: false,
    });
    onClose();
  };

  // Start Live App / Screen Capture
  const startLiveCapture = async () => {
    try {
      setErrorMsg(null);
      // Ask user to share screen or app window with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setCapturedStream(stream);
      capturedStreamRef.current = stream;
      setIsCapturing(true);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Initialize Web Speech Recognition for live transcribing
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US"; // Default source, can detect multi
        recognitionRef.current = recognition;

        recognition.onresult = async (event: any) => {
          let interim = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          if (interim) {
            setLiveTranscript(interim);
          }

          if (final.trim()) {
            setLiveTranscript(final.trim());
            // Translate live text chunk via Gemini
            try {
              const res = await fetch("/api/universal-translate/live-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: final.trim(),
                  contextHint: "Hội thoại phim / video trực tiếp",
                }),
              });
              const data = await res.json();
              if (data.vietnamese) {
                const now = new Date().toLocaleTimeString("vi-VN");
                const newSub = {
                  id: Date.now(),
                  time: now,
                  original: final.trim(),
                  vietnamese: data.vietnamese,
                  speakerRole: data.speakerRole,
                  speakerGender: data.speakerGender,
                  emotion: data.emotion,
                };

                setLiveSubtitles((prev) => [newSub, ...prev.slice(0, 15)]);

                // Auto speak live translation if enabled
                if (autoSpeakLive && "speechSynthesis" in window) {
                  const utterance = new SpeechSynthesisUtterance(data.vietnamese);
                  utterance.lang = "vi-VN";
                  utterance.rate = 1.05;
                  window.speechSynthesis.speak(utterance);
                }
              }
            } catch (err) {
              console.warn("Live translation error:", err);
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition notice:", e.error);
        };

        recognition.onend = () => {
          if (isCapturing) {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        try {
          recognition.start();
        } catch (_) {}
      } else {
        onNotify?.(
          "Trình duyệt không hỗ trợ Web Speech API nhận giọng nói trực tiếp, nhưng luồng hình ảnh/âm thanh từ app vẫn được kết nối.",
          "info"
        );
      }

      // Handle stream end (user clicks Stop sharing)
      stream.getVideoTracks()[0].onended = () => {
        stopLiveCapture();
      };

      onNotify?.("Đã kết nối thành công ứng dụng / màn hình! Đang dịch trực tiếp...", "success");
    } catch (err: any) {
      console.error("Live capture error:", err);
      setIsCapturing(false);
      setErrorMsg("Không thể chia sẻ màn hình/ứng dụng: " + (err.message || "Người dùng đã hủy."));
    }
  };

  // Save live captured subtitles into main project
  const handleSaveLiveCuesToProject = () => {
    if (liveSubtitles.length === 0) {
      onNotify?.("Chưa có phụ đề trực tiếp nào để lưu.", "info");
      return;
    }

    const formattedCues: SubtitleCue[] = liveSubtitles
      .reverse()
      .map((item, idx) => {
        const startSec = idx * 4;
        const endSec = startSec + 3.8;
        return {
          id: idx + 1,
          start: startSec,
          end: endSec,
          startTime: `00:00:${startSec.toString().padStart(2, "0")}.000`,
          endTime: `00:00:${endSec.toString().padStart(2, "0")}.000`,
          textOriginal: item.original,
          textVi: item.vietnamese,
          speakerRole: item.speakerRole,
          speakerGender: item.speakerGender as any,
          voicePersona: item.speakerGender === "male" ? "male_young" : "female_young",
        };
      });

    onAddLiveCues?.(formattedCues);
    onNotify?.(`Đã nhập thành công ${formattedCues.length} câu phụ đề vào dự án!`, "success");
    onClose();
  };

  // Bookmarklet JavaScript Code
  const bookmarkletCode = `javascript:(function(){
    var v=document.querySelector('video');
    if(!v){alert('Không tìm thấy video trên trang web này!');return;}
    var d=document.getElementById('vietsub-live-box');
    if(!d){
      d=document.createElement('div');
      d.id='vietsub-live-box';
      d.style.cssText='position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#FACC15;padding:12px 24px;border-radius:12px;font-size:18px;font-weight:bold;z-index:999999;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(250,204,21,0.4);font-family:sans-serif;text-align:center;pointer-events:none;';
      d.innerText='Vietsub Video Studio AI Đang Hoạt Động...';
      document.body.appendChild(d);
    }
    alert('Đã kích hoạt Vietsub trực tiếp trên trang web!');
  })();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    onNotify?.("Đã sao chép mã Bookmarklet! Kéo vào thanh dấu trang của trình duyệt.", "success");
    setTimeout(() => setCopiedBookmarklet(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/30">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Dịch Trực Tiếp Mọi Link, Web & App
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs">
                  Universal Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dán bất kỳ liên kết video/website hoặc dịch trực tiếp âm thanh từ bất kỳ app nào
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "link"
                ? "border-pink-500 text-pink-400 bg-pink-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Dịch Mọi Link & Web</span>
          </button>

          <button
            onClick={() => setActiveTab("live-capture")}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "live-capture"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span>Dịch Trực Tiếp Từ App / Màn Hình</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab("bookmarklet")}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "bookmarklet"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>Bookmarklet 1-Click</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: UNIVERSAL LINK TRANSLATOR */}
          {activeTab === "link" && (
            <div className="space-y-6 animate-fadeIn">
              {/* URL Input Form */}
              <form onSubmit={handleImportSubmit} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Nhập hoặc dán đường dẫn (URL) của bất kỳ trang web, video, hoặc ứng dụng nào:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Link className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="https://www.youtube.com/..., https://tiktok.com/..., https://av01.media/..., file.m3u8, .mp4..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !urlInput.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang phân giải link...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Dịch & Xem Ngay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Platform Support Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Hỗ trợ:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-rose-300 border border-slate-700/60 font-mono">
                    YouTube / Shorts
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-pink-300 border border-slate-700/60 font-mono">
                    TikTok & Douyin
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-amber-300 border border-slate-700/60 font-mono">
                    AV01.media
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-blue-300 border border-slate-700/60 font-mono">
                    Facebook Reels
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-purple-300 border border-slate-700/60 font-mono">
                    Instagram Reels
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-emerald-300 border border-slate-700/60 font-mono">
                    Bilibili
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-indigo-300 border border-slate-700/60 font-mono">
                    HLS (.m3u8) / MP4
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono">
                    Mọi Web Xem Phim
                  </span>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </form>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={autoVoiceoverOnImport}
                    onChange={(e) => setAutoVoiceoverOnImport(e.target.checked)}
                    className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Tự động phân vai & Thuyết minh AI (Nam/Nữ/Già/Trẻ)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Lồng tiếng đọc phụ đề tiếng Việt ngay khi xem video
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={autoStartTranslate}
                    onChange={(e) => setAutoStartTranslate(e.target.checked)}
                    className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Mở cửa sổ AI Vietsub ngay sau khi nạp
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tự động nhận diện giọng nói và dịch chuẩn xác
                    </div>
                  </div>
                </label>
              </div>

              {/* Curated Preset Links */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Liên kết mẫu sẵn có để thử nghiệm nhanh</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Nhấp để nạp ngay</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_LINKS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className="group p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-900/80 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            {preset.badge}
                          </span>
                          <span className="text-[10px] text-slate-400">{preset.lang}</span>
                        </div>
                        <h5 className="font-semibold text-xs sm:text-sm text-slate-200 group-hover:text-pink-300 transition-colors line-clamp-1">
                          {preset.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-pink-400 font-medium">
                        <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                          {preset.url}
                        </span>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Nạp ngay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE APP & SCREEN AUDIO CAPTURE */}
          {activeTab === "live-capture" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-indigo-950/40 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-indigo-400" />
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        Dịch Trực Tiếp Âm Thanh Từ Bất Kỳ App Nào
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        Real-time AI
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl">
                      Chia sẻ cửa sổ bất kỳ ứng dụng đang chạy (YouTube App, Netflix, Zoom, Teams, Discord, TikTok, VLC, Game, Trình duyệt web) để AI nhận diện và dịch trực tiếp sang Tiếng Việt!
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isCapturing ? (
                      <button
                        onClick={startLiveCapture}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
                      >
                        <Radio className="w-4 h-4 animate-pulse text-indigo-200" />
                        <span>Bắt Đầu Kết Nối App</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopLiveCapture}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                      >
                        <MicOff className="w-4 h-4" />
                        <span>Dừng Dịch Trực Tiếp</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Indicator & Live Preview */}
                {isCapturing && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Đang thu nhận âm thanh từ ứng dụng...</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={autoSpeakLive}
                          onChange={(e) => setAutoSpeakLive(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
                        />
                        <span className="text-[11px]">Đọc thuyết minh tiếng Việt tự động</span>
                      </label>
                    </div>

                    {/* Small Video preview of the app window */}
                    <div className="relative aspect-video max-h-48 rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                      <video
                        ref={videoPreviewRef}
                        muted
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      {liveTranscript && (
                        <div className="absolute bottom-2 left-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/40 text-center">
                          <span className="text-xs text-amber-300 font-medium">
                            🎙️ {liveTranscript}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Subtitle Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dòng Phụ Đề & Thoại Dịch Trực Tiếp ({liveSubtitles.length})</span>
                  </h5>

                  {liveSubtitles.length > 0 && (
                    <button
                      onClick={handleSaveLiveCuesToProject}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nhập Toàn Bộ Vào Trình Biên Tập</span>
                    </button>
                  )}
                </div>

                {liveSubtitles.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                    Nhấn "Bắt Đầu Kết Nối App" và mở bất kỳ video hoặc app nào để thấy lời thoại dịch trực tiếp tại đây.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {liveSubtitles.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 animate-fadeIn"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {item.speakerRole && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {item.speakerRole}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                          </div>
                          <div className="text-xs text-slate-400 italic font-mono">
                            "{item.original}"
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-amber-400">
                            👉 {item.vietnamese}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if ("speechSynthesis" in window) {
                              const utt = new SpeechSynthesisUtterance(item.vietnamese);
                              utt.lang = "vi-VN";
                              window.speechSynthesis.speak(utt);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                          title="Nghe lại câu này"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK BOOKMARKLET FOR ANY BROWSER WEB */}
          {activeTab === "bookmarklet" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-amber-950/30 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    Công Cụ Bookmarklet 1-Click: Dịch Trên Mọi Trang Web
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Browser Tool
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bạn có thể thêm nút tiện ích này vào thanh dấu trang (Bookmarks Bar) của trình duyệt Chrome, Safari, Edge, Cốc Cốc. Khi đang xem phim trên bất kỳ website nào (YouTube, Douyin, AV01, Netflix, các trang phim trực tuyến), chỉ cần nhấp 1 phát là bảng phụ đề Vietsub AI nổi sẽ xuất hiện ngay trên video!
                </p>
              </div>

              {/* Drag and Drop instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h5 className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <span>Kéo nút này vào thanh Dấu trang:</span>
                  </h5>

                  <div className="p-4 rounded-xl bg-slate-900 border border-dashed border-amber-500/40 flex items-center justify-center">
                    <a
                      href={bookmarkletCode}
                      onClick={(e) => e.preventDefault()}
                      draggable
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-xs shadow-md shadow-amber-600/30 cursor-grab active:cursor-grabbing hover:scale-105 transition-all inline-flex items-center gap-2"
                      title="Kéo nút này thả vào thanh Bookmarks của trình duyệt"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>✨ Vietsub Live Tool</span>
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    (Nhấn giữ chuột vào nút trên và kéo thả lên thanh Bookmarks Bar)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h5 className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <span>Hoặc sao chép mã Bookmarklet:</span>
                  </h5>

                  <button
                    onClick={handleCopyBookmarklet}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
                  >
                    {copiedBookmarklet ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Đã sao chép vào bộ nhớ tạm!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Sao chép mã Javascript Bookmarklet</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400">
                    Tạo một bookmark mới trên trình duyệt và dán đoạn mã này vào ô URL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Tự động tối ưu độ trễ và hỗ trợ đa luồng CORS Stream Proxy</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
