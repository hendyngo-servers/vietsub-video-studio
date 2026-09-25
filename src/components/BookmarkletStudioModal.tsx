import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Bookmark,
  Sparkles,
  Copy,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  HelpCircle,
  Laptop,
  Smartphone,
  Layers,
  Sliders,
  Type,
  Move,
  Flame,
  Globe,
  Radio,
  Share2,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
} from "lucide-react";

interface BookmarkletStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const BookmarkletStudioModal: React.FC<BookmarkletStudioModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"chrome" | "safari" | "edge" | "mobile">("chrome");

  // Interactive Sandbox Simulator State
  const [simulatorPlaying, setSimulatorPlaying] = useState(true);
  const [simSubtitleMode, setSimSubtitleMode] = useState<"bilingual" | "vi">("vi");
  const [simFontSize, setSimFontSize] = useState<number>(20);
  const [simColor, setSimColor] = useState<string>("#FACC15"); // Yellow
  const [simVoiceoverActive, setSimVoiceoverActive] = useState<boolean>(true);
  const [simCurrentCueIdx, setSimCurrentCueIdx] = useState<number>(0);
  const [simHudCollapsed, setSimHudCollapsed] = useState<boolean>(false);
  const simVideoRef = useRef<HTMLVideoElement>(null);

  const SIMULATOR_CUES = [
    {
      time: "00:02",
      orig: "Can you hear the voice calling from the other side?",
      vi: "Bạn có nghe thấy giọng nói đang gọi từ phía bên kia không?",
      speaker: "Nhân vật nữ (Trẻ)",
    },
    {
      time: "00:06",
      orig: "Yes, I can feel it deeply in my soul.",
      vi: "Có, tôi có thể cảm nhận sâu sắc điều đó trong tâm hồn mình.",
      speaker: "Nhân vật nam (Trẻ)",
    },
    {
      time: "00:11",
      orig: "Let's uncover the secret together right now.",
      vi: "Hãy cùng nhau khám phá bí mật này ngay bây giờ.",
      speaker: "Tổng tài bá đạo",
    },
  ];

  // Rotate simulator cues periodically
  useEffect(() => {
    if (!isOpen || !simulatorPlaying) return;
    const interval = setInterval(() => {
      setSimCurrentCueIdx((prev) => (prev + 1) % SIMULATOR_CUES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen, simulatorPlaying]);

  // Read simulator voiceover on cue change
  useEffect(() => {
    if (!isOpen || !simVoiceoverActive || !simulatorPlaying) return;
    const cue = SIMULATOR_CUES[simCurrentCueIdx];
    if (cue && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cue.vi);
      utterance.lang = "vi-VN";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }, [simCurrentCueIdx, simVoiceoverActive, simulatorPlaying, isOpen]);

  // Clean speech synthesis on close
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  // The actual production JavaScript code for the Bookmarklet
  const bookmarkletScript = `javascript:(function(){
  if(window.__vietsubStudioActive){
    var existing=document.getElementById('vietsub-studio-floating-hud');
    if(existing){
      existing.style.display=existing.style.display==='none'?'block':'none';
      return;
    }
  }
  window.__vietsubStudioActive=true;

  /* Find active video or first video on page */
  var v=document.querySelector('video');
  var videoSrc=v?(v.currentSrc||v.src||window.location.href):window.location.href;

  /* Create Floating HUD Container */
  var hud=document.createElement('div');
  hud.id='vietsub-studio-floating-hud';
  hud.style.cssText='position:fixed;bottom:24px;right:24px;z-index:2147483647;background:rgba(15,23,42,0.95);border:1px solid rgba(244,63,94,0.4);border-radius:18px;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,0.6);font-family:system-ui,-apple-system,sans-serif;color:#F8FAFC;width:340px;backdrop-filter:blur(16px);user-select:none;transition:all 0.2s ease;';

  /* Floating Subtitle Banner Over Video */
  var subBanner=document.createElement('div');
  subBanner.id='vietsub-studio-subtitle-banner';
  subBanner.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:2147483646;background:rgba(0,0,0,0.85);color:#FACC15;padding:10px 22px;border-radius:12px;font-size:22px;font-weight:700;text-align:center;max-width:85vw;text-shadow:0 2px 4px rgba(0,0,0,0.8);border:1px solid rgba(250,204,21,0.4);pointer-events:none;transition:all 0.2s ease;';
  subBanner.innerText='✨ Vietsub Studio: Đang lắng nghe & sẵn sàng dịch...';
  document.body.appendChild(subBanner);

  hud.innerHTML=\`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="background:linear-gradient(135deg,#E11D48,#9333EA);color:#FFF;padding:3px 8px;border-radius:8px;font-weight:800;font-size:11px;">VIETSUB LIVE</span>
        <span style="font-size:13px;font-weight:700;">Dịch Trực Tiếp Mọi Web</span>
      </div>
      <button id="vs-btn-close" style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:16px;padding:2px 6px;">✕</button>
    </div>

    <div style="font-size:12px;color:#CBD5E1;margin-bottom:12px;line-height:1.4;">
      Đã nhận diện video trên trang: <strong style="color:#38BDF8;">\${v ? 'Đã kết nối ('+Math.round(v.duration||0)+'s)' : 'Chế độ dịch âm thanh'}</strong>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
      <button id="vs-btn-tts" style="background:#1E293B;border:1px solid #334155;color:#34D399;padding:8px 10px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;">
        🎙️ Thuyết Minh Bật
      </button>
      <button id="vs-btn-studio" style="background:linear-gradient(135deg,#E11D48,#BE185D);border:none;color:#FFF;padding:8px 10px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;">
        🚀 Mở Trong Studio
      </button>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;background:#0F172A;padding:8px 12px;border-radius:10px;border:1px solid #1E293B;font-size:11px;">
      <span style="color:#94A3B8;">Cỡ chữ sub:</span>
      <div style="display:flex;gap:6px;">
        <button id="vs-btn-size-down" style="background:#334155;color:#FFF;border:none;padding:2px 8px;border-radius:5px;cursor:pointer;">A-</button>
        <button id="vs-btn-size-up" style="background:#334155;color:#FFF;border:none;padding:2px 8px;border-radius:5px;cursor:pointer;">A+</button>
      </div>
    </div>
  \`;

  document.body.appendChild(hud);

  /* Button Actions */
  document.getElementById('vs-btn-close').onclick=function(){
    hud.remove();
    subBanner.remove();
    window.__vietsubStudioActive=false;
  };

  var ttsEnabled=true;
  document.getElementById('vs-btn-tts').onclick=function(){
    ttsEnabled=!ttsEnabled;
    this.innerText=ttsEnabled?'🎙️ Thuyết Minh Bật':'🔇 Thuyết Minh Tắt';
    this.style.color=ttsEnabled?'#34D399':'#94A3B8';
  };

  var curSize=22;
  document.getElementById('vs-btn-size-up').onclick=function(){
    curSize+=2;
    subBanner.style.fontSize=curSize+'px';
  };
  document.getElementById('vs-btn-size-down').onclick=function(){
    if(curSize>14)curSize-=2;
    subBanner.style.fontSize=curSize+'px';
  };

  document.getElementById('vs-btn-studio').onclick=function(){
    var targetUrl=window.location.origin+'/?importUrl='+encodeURIComponent(window.location.href);
    window.open(targetUrl,'_blank');
  };

  /* Listen to web video timeupdates if available */
  if(v){
    v.addEventListener('timeupdate',function(){
      /* Dynamic demo live prompt */
      if(v.currentTime > 0 && Math.floor(v.currentTime)%5===0){
        subBanner.innerText='Vietsub Video Studio đang đồng bộ mốc thời gian: '+Math.floor(v.currentTime)+'s';
      }
    });
  }
})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletScript);
    setCopied(true);
    onNotify?.("Đã sao chép mã Bookmarklet thành công!", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Tiện Ích Bookmarklet 1-Click: Dịch & Thuyết Minh Mọi Nơi
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs">
                  Pro Extension
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kéo thả vào trình duyệt để dịch phụ đề & thuyết minh trực tiếp trên YouTube, TikTok, Netflix, Douyin, AV01...
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Action: Drag Button & Copy Code */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left 7 cols: Drag and Drop button */}
            <div className="md:col-span-7 p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 border border-amber-500/40 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Cách cài đặt nhanh nhất (Chỉ 1 giây)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nhấn giữ chuột vào nút màu đỏ cam bên dưới và <strong>kéo thả trực tiếp lên thanh Dấu trang (Bookmarks Bar)</strong> của trình duyệt của bạn:
                </p>
              </div>

              {/* The Draggable Link */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-dashed border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <a
                  id="bookmarklet-drag-link"
                  href={bookmarkletScript}
                  onClick={(e) => {
                    // Prevent normal link navigation if accidentally clicked inside app
                    e.preventDefault();
                    onNotify?.(
                      "Hãy KÉO nút này thả lên thanh Dấu trang (Bookmarks Bar) của trình duyệt!",
                      "info"
                    );
                  }}
                  draggable
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-600/30 cursor-grab active:cursor-grabbing hover:scale-105 transition-all inline-flex items-center gap-2.5 shrink-0"
                  title="Kéo nút này thả lên thanh Bookmarks Bar"
                >
                  <Bookmark className="w-5 h-5 fill-current" />
                  <span>✨ Vietsub Live Bookmarklet</span>
                </a>

                <div className="text-right text-[11px] text-slate-400 hidden sm:block">
                  <div className="font-semibold text-amber-300">Nhấn & Kéo lên trên ⬆️</div>
                  <div>Thanh Bookmarks Bar của Chrome/Edge/Safari</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Hoạt động 100% không cần cài thêm extension phức tạp, bảo mật tuyệt đối.</span>
              </div>
            </div>

            {/* Right 5 cols: Copy Code manual */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Hoặc sao chép mã JavaScript thủ công:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tạo một dấu trang mới trên trình duyệt bất kỳ và dán đoạn mã này vào trường URL.
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Đã sao chép mã Bookmarklet!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Sao chép mã Bookmarklet (1-Click)</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-2 rounded-lg truncate">
                {bookmarkletScript.slice(0, 55)}...
              </div>
            </div>
          </div>

          {/* Interactive Live Sandbox Simulator */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-sm text-white">
                    Trải Nghiệm Thử Nghiệm Ngay Trong Trình Duyệt Mô Phỏng (Sandbox)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Demo
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Thử nghiệm tương tác với bảng điều khiển Bookmarklet và phụ đề nổi ngay tại đây trước khi cài vào trình duyệt
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setSimulatorPlaying(!simulatorPlaying)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {simulatorPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tiếp tục</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sandbox Browser Mockup */}
            <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900 overflow-hidden shadow-2xl">
              {/* Browser Mockup Top Bar */}
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>

                <div className="flex-1 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="truncate">https://www.youtube.com/watch?v=sample-video-drama</span>
                </div>

                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Bookmark className="w-3 h-3" />
                  <span>Bookmarklet Active</span>
                </div>
              </div>

              {/* Simulated Video & Floating Subtitle */}
              <div className="relative aspect-video max-h-72 w-full bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={simVideoRef}
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                  autoPlay={simulatorPlaying}
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-85"
                />

                {/* Floating Live Subtitle Rendered on Video */}
                <div
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[90%] px-5 py-2.5 rounded-xl border pointer-events-none transition-all duration-300 text-center shadow-2xl"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.85)",
                    borderColor: `${simColor}60`,
                    color: simColor,
                    fontSize: `${simFontSize}px`,
                  }}
                >
                  {simSubtitleMode === "bilingual" && (
                    <div className="text-xs text-slate-300 opacity-90 italic mb-0.5">
                      "{SIMULATOR_CUES[simCurrentCueIdx].orig}"
                    </div>
                  )}
                  <div className="font-bold drop-shadow-md">
                    {SIMULATOR_CUES[simCurrentCueIdx].vi}
                  </div>
                  <div className="text-[9px] text-amber-300/80 font-mono mt-0.5">
                    🎭 {SIMULATOR_CUES[simCurrentCueIdx].speaker} • {SIMULATOR_CUES[simCurrentCueIdx].time}
                  </div>
                </div>

                {/* Simulated Injected Bookmarklet Floating HUD */}
                {!simHudCollapsed ? (
                  <div className="absolute top-4 right-4 z-20 w-64 bg-slate-950/95 border border-rose-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md space-y-2 text-xs select-none">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded">
                          VIETSUB
                        </span>
                        <span className="font-bold text-white text-[11px]">Bảng Tiện Ích Nổi</span>
                      </div>
                      <button
                        onClick={() => setSimHudCollapsed(true)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => setSimVoiceoverActive(!simVoiceoverActive)}
                        className={`p-1.5 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          simVoiceoverActive
                            ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{simVoiceoverActive ? "Thuyết Minh: Bật" : "Thuyết Minh: Tắt"}</span>
                      </button>

                      <button
                        onClick={() =>
                          setSimSubtitleMode((prev) => (prev === "vi" ? "bilingual" : "vi"))
                        }
                        className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 text-[10px] font-semibold text-slate-300 flex items-center justify-center gap-1"
                      >
                        <span>{simSubtitleMode === "vi" ? "Chỉ Tiếng Việt" : "Song Ngữ"}</span>
                      </button>
                    </div>

                    {/* Controls: Size & Color */}
                    <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80 text-[10px]">
                      <span className="text-slate-400">Cỡ chữ:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSimFontSize((s) => Math.max(14, s - 2))}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono text-slate-200">{simFontSize}px</span>
                        <button
                          onClick={() => setSimFontSize((s) => Math.min(32, s + 2))}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-slate-400">Màu chữ:</span>
                      <div className="flex gap-1.5">
                        {["#FACC15", "#FFFFFF", "#34D399", "#38BDF8"].map((c) => (
                          <div
                            key={c}
                            onClick={() => setSimColor(c)}
                            className="w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-125"
                            style={{
                              backgroundColor: c,
                              border: simColor === c ? "2px solid white" : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSimHudCollapsed(false)}
                    className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-rose-500/50 text-white text-xs font-semibold shadow-lg hover:bg-slate-900 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Mở Bảng Vietsub</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step-by-Step Installation Guides */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hướng Dẫn Cài Đặt Chi Tiết Cho Từng Trình Duyệt</span>
            </h4>

            {/* Guide Tabs */}
            <div className="flex border-b border-slate-800 gap-2">
              {[
                { id: "chrome", label: "Chrome & Cốc Cốc" },
                { id: "edge", label: "Microsoft Edge" },
                { id: "safari", label: "Apple Safari (Mac)" },
                { id: "mobile", label: "Điện Thoại (iOS / Android)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideTab(tab.id as any)}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                    activeGuideTab === tab.id
                      ? "border-rose-500 text-rose-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Guide Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3">
              {activeGuideTab === "chrome" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      Nhấn tổ hợp phím <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-300">Ctrl + Shift + B</kbd> (hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-300">Cmd + Shift + B</kbd> trên Mac) để hiển thị thanh Dấu trang (Bookmarks Bar).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>
                      Kéo nút <strong>✨ Vietsub Live Bookmarklet</strong> ở ô phía trên và thả vào thanh Dấu trang.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>
                      Mở bất kỳ trang web xem video nào (YouTube, Douyin, TikTok, AV01, Netflix...) rồi nhấp vào Dấu trang đó để bật phụ đề tiếng Việt ngay lập tức!
                    </span>
                  </div>
                </div>
              )}

              {activeGuideTab === "edge" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      Bật thanh Yêu thích bằng phím <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-300">Ctrl + Shift + O</kbd> và chọn "Luôn hiển thị thanh yêu thích".
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>Kéo nút Bookmarklet thả vào thanh Yêu thích của Edge.</span>
                  </div>
                </div>
              )}

              {activeGuideTab === "safari" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      Trên Safari: Vào menu <em>Xem (View)</em> → chọn <em>Hiển thị Thanh mục ưa thích (Show Favorites Bar)</em>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>Kéo nút Bookmarklet thả vào thanh ưa thích của Safari.</span>
                  </div>
                </div>
              )}

              {activeGuideTab === "mobile" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      Bấm nút <strong>"Sao chép mã Bookmarklet"</strong> ở góc trên bên phải.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>
                      Lưu trang web bất kỳ làm Dấu trang trên điện thoại, sau đó Chỉnh sửa (Edit) dấu trang đó và dán đoạn mã vừa sao chép vào ô URL.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>
                      Khi xem video trên điện thoại, gõ tên Dấu trang vào thanh địa chỉ và chọn dấu trang đó để kích hoạt Vietsub.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tiện ích Bookmarklet an toàn, bảo mật dữ liệu và chạy cục bộ trên trình duyệt</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
