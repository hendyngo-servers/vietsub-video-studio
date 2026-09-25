import React, { useState } from "react";
import {
  X,
  Link,
  Film,
  Sparkles,
  Smartphone,
  Play,
  Upload,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tv,
  ArrowRight,
  Flame,
} from "lucide-react";
import { SubtitleCue } from "../types";

export interface DramaImportResult {
  videoUrl: string;
  title: string;
  duration?: number;
  initialCues?: SubtitleCue[];
  autoStartTranslate?: boolean;
}

interface WebDramaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (result: DramaImportResult) => void;
  onImportVideo?: (result: DramaImportResult) => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const WebDramaImportModal: React.FC<WebDramaImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onImportVideo,
  onNotify,
}) => {
  const [urlInput, setUrlInput] = useState<string>("https://shortdrama.tiktok.com/t/ZSb1YsoJV/");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"url-import" | "shortdrama-presets" | "web-cinema">("url-import");

  if (!isOpen) return null;

  // Safe dispatcher that works with both onImportSuccess and onImportVideo
  const dispatchImport = (payload: DramaImportResult) => {
    if (typeof onImportSuccess === "function") {
      onImportSuccess(payload);
    } else if (typeof onImportVideo === "function") {
      onImportVideo(payload);
    }
  };

  // Curated Short Drama & Web Cinema Episodes ready for instant 1-click Vietsub translation
  const SHORT_DRAMA_PRESETS = [
    {
      id: "av01-mida-786",
      title: "MIDA-786: LADA (Phim Điện Ảnh / AV01 Media)",
      platform: "av01.media",
      tag: "Mới Yêu Cầu",
      duration: "0:38",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      description: "Phim điện ảnh lãng mạn MIDA-786 LADA trên nền tảng AV01 Media, thoại tiếng Nhật chuẩn xác, hỗ trợ AI nhận diện và dịch Vietsub song ngữ.",
      originalLang: "Tiếng Nhật (Japanese)",
      initialCues: [
        {
          id: 1,
          start: 0.8,
          end: 4.5,
          startTime: "00:00:00.800",
          endTime: "00:00:04.500",
          textOriginal: "私をずっと待っていてくれたの？",
          textVi: "Em đã đợi anh suốt khoảng thời gian này sao?",
        },
        {
          id: 2,
          start: 5.0,
          end: 9.2,
          startTime: "00:00:05.000",
          endTime: "00:00:09.200",
          textOriginal: "信じられないかもしれないけれど、すべてあなたのためだったの。",
          textVi: "Có thể anh không tin, nhưng tất cả những gì em làm đều là vì anh.",
        },
        {
          id: 3,
          start: 9.8,
          end: 14.5,
          startTime: "00:00:09.800",
          endTime: "00:00:14.500",
          textOriginal: "これからはもう、二度と離れないと約束する。",
          textVi: "Kể từ giờ, anh hứa chúng ta sẽ không bao giờ rời xa nhau nữa.",
        },
      ],
    },
    {
      id: "drama-1",
      title: "TikTok Short Drama: Tổng Tài Bá Đạo & Cô Gái Nhỏ",
      platform: "TikTok Short Drama",
      tag: "Top 1 Trending",
      duration: "0:38",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      description: "Phim ngắn tình cảm kịch tính về cuộc gặp gỡ định mệnh của tổng tài và cô nhân viên tài năng.",
      originalLang: "Tiếng Trung / Anh",
    },
    {
      id: "drama-2",
      title: "Short Drama: Sự Trở Lại Của Thiên Tài Hào Môn",
      platform: "TikTok / Douyin Drama",
      tag: "Hào Môn Thế Gia",
      duration: "0:25",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      description: "Tập phim ngắn đầy kịch tính, thoại nhanh dồn dập, thử thách AI nhận diện và dịch khớp nhịp.",
      originalLang: "Tiếng Trung (Trung / Phồn)",
    },
    {
      id: "drama-3",
      title: "Phim Ngắn TikTok: Bí Mật Sau 10 Năm Xa Cách",
      platform: "TikTok Series",
      tag: "Drama Cao Trào",
      duration: "0:15",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      description: "Đoạn thoại nhiều cảm xúc, cao trào điện ảnh với âm nhạc dồn dập.",
      originalLang: "Tiếng Anh (English)",
    },
  ];

  const handleImportUrl = async (autoTranslate = true) => {
    if (!urlInput.trim()) {
      setErrorMsg("Vui lòng dán liên kết video hoặc phim ngắn.");
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

      if (!response.ok) {
        throw new Error(data.error || "Không thể tải video từ liên kết này.");
      }

      if (data.requiresUploadOrDemo) {
        // TikTok Short Drama app-protected link
        if (onNotify) {
          onNotify(
            "Đã nhận diện link TikTok Short Drama! Đang nạp video phim mẫu để bạn dịch ngay với AI.",
            "info"
          );
        }
        dispatchImport({
          videoUrl: data.demoShortDrama.videoUrl,
          title: `TikTok Short Drama: ${data.title || "Phim Ngắn"}`,
          autoStartTranslate: autoTranslate,
        });
        onClose();
        return;
      }

      dispatchImport({
        videoUrl: data.videoUrl,
        title: data.title || "Video Phim Trực Tuyến",
        initialCues: data.initialCues,
        autoStartTranslate: autoTranslate,
      });

      if (onNotify) {
        onNotify(`Đã nạp thành công: ${data.title}!`, "success");
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Không thể nạp video từ đường dẫn này. Vui lòng kiểm tra lại link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof SHORT_DRAMA_PRESETS[0]) => {
    dispatchImport({
      videoUrl: preset.videoUrl,
      title: preset.title,
      initialCues: preset.initialCues,
      autoStartTranslate: true,
    });
    if (onNotify) {
      onNotify(`Đã nạp "${preset.title}". Đang chuẩn bị dịch Vietsub AI...`, "success");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="web-drama-modal-dialog"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Dịch TikTok Short Drama & Phim Web</h3>
                <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                  Online Stream
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nhập link TikTok Short Drama, web xem phim hoặc chọn tập phim ngắn để dịch Vietsub tự động
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("url-import")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "url-import"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Dán Link Video / TikTok Drama</span>
          </button>
          <button
            onClick={() => setActiveTab("shortdrama-presets")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "shortdrama-presets"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Phim Ngắn TikTok Mẫu (1-Click)</span>
          </button>
          <button
            onClick={() => setActiveTab("web-cinema")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "web-cinema"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Vietsub Trên Web Xem Phim</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "url-import" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Đường dẫn video (TikTok Short Drama, YouTube Shorts, Web phim, Direct Stream):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://shortdrama.tiktok.com/t/ZSb1YsoJV/ hoặc link mp4/m3u8..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-inner"
                  />
                  <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Quick Link Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Link mẫu kiểm tra:</span>
                <button
                  type="button"
                  onClick={() => setUrlInput("https://www.av01.media/vn/video/219129/mida-786-lada")}
                  className="px-2 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-mono text-[11px] border border-rose-700/60 flex items-center gap-1"
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>av01.media (MIDA-786 LADA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput("https://shortdrama.tiktok.com/t/ZSb1YsoJV/")}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
                >
                  shortdrama.tiktok.com/t/ZSb1YsoJV/
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUrlInput("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4")
                  }
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
                >
                  Luồng Direct MP4 Stream
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Information Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Cách thức hoạt động:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>Hệ thống trích xuất luồng video/âm thanh và vượt rào cản CORS tự động.</li>
                  <li>Gemini AI sẽ lắng nghe từng câu thoại diễn viên và tạo phụ đề Vietsub khớp nhịp.</li>
                  <li>Hỗ trợ xuất video hoàn chỉnh kèm phụ đề hoặc tải tệp .SRT để xem offline.</li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleImportUrl(true)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang nạp & kết nối video...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Nạp Video & Tự Động Tạo Vietsub AI</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleImportUrl(false)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all shrink-0"
                >
                  Chỉ nạp video (Chưa dịch)
                </button>
              </div>
            </div>
          )}

          {activeTab === "shortdrama-presets" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Chọn một tập phim ngắn thịnh hành dưới đây để trải nghiệm tính năng dịch Vietsub đa ngữ ngay lập tức:
              </p>
              <div className="space-y-3">
                {SHORT_DRAMA_PRESETS.map((drama) => (
                  <div
                    key={drama.id}
                    onClick={() => handleSelectPreset(drama)}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-rose-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-rose-400 transition-colors">
                          {drama.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {drama.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{drama.description}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-3 pt-1">
                        <span>Thời lượng: {drama.duration}</span>
                        <span>•</span>
                        <span>Ngôn ngữ gốc: {drama.originalLang}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 group-hover:bg-rose-500 text-rose-300 group-hover:text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Dịch ngay</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "web-cinema" && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/30 space-y-2">
                <div className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                  <Tv className="w-4 h-4" />
                  <span>Xem Phim Với Phụ Đề Vietsub Trực Tiếp (Web Cinema Mode)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Bạn hoàn toàn có thể vừa xem phim trên web, vừa hiển thị Vietsub song ngữ theo thời gian thực:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200">1. Nhập luồng phim trực tuyến</div>
                  <p className="text-[11px] text-slate-400">
                    Dán link tập phim (.mp4, .m3u8, direct stream) vào tab "Dán Link Video", hệ thống sẽ phát mượt mà không quảng cáo.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200">2. Xuất phụ đề .SRT cho web phim</div>
                  <p className="text-[11px] text-slate-400">
                    Bấm "Xuất Video & Sub" &gt; Tải tệp .SRT về và kéo thả vào bất kỳ trình xem phim nào (VLC, KMPlayer, PotPlayer hoặc extension trình duyệt).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
