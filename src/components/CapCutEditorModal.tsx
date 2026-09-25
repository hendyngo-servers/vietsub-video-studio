import React, { useState } from "react";
import {
  X,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Type,
  Maximize,
  Smartphone,
  Monitor,
  Flame,
  Music,
  Check,
  Disc,
  Zap,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  SubtitleStyle,
  CapCutPreset,
  CapCutAnimation,
  AspectRatio,
  AudioEditConfig,
} from "../types";

interface CapCutEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  style: SubtitleStyle;
  onChangeStyle: (newStyle: SubtitleStyle) => void;
  audioConfig: AudioEditConfig;
  onChangeAudioConfig: (newAudioConfig: AudioEditConfig) => void;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const CapCutEditorModal: React.FC<CapCutEditorModalProps> = ({
  isOpen,
  onClose,
  style,
  onChangeStyle,
  audioConfig,
  onChangeAudioConfig,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<"capcut-subtitles" | "audio-editing">("capcut-subtitles");

  if (!isOpen) return null;

  // Preset definitions
  const CAPCUT_PRESETS: {
    id: CapCutPreset;
    name: string;
    tag: string;
    icon: string;
    description: string;
    styleProps: Partial<SubtitleStyle>;
  }[] = [
    {
      id: "tiktok-bold",
      name: "TikTok 3D Bold Stroke",
      tag: "Trending CapCut",
      icon: "🔥",
      description: "Chữ trắng viền đen dày 3D đặc trưng video triệu view TikTok / Shorts",
      styleProps: {
        capcutPreset: "tiktok-bold",
        textColor: "#FFFFFF",
        strokeColor: "#000000",
        strokeWidth: 3,
        bold: true,
        uppercase: true,
        backgroundColor: "none",
        textShadow: true,
        fontFamily: "sans",
        fontSize: "xl",
        animation: "bounce",
      },
    },
    {
      id: "karaoke-glow",
      name: "Karaoke Glow Party",
      tag: "Âm nhạc & Lời hát",
      icon: "✨",
      description: "Hiệu ứng chữ phát sáng neon rực rỡ bùng nổ theo nhịp điệu",
      styleProps: {
        capcutPreset: "karaoke-glow",
        textColor: "#FACC15",
        glowColor: "rgba(250, 204, 21, 0.9)",
        strokeColor: "#000000",
        strokeWidth: 2,
        bold: true,
        backgroundColor: "translucent-black",
        textShadow: true,
        fontSize: "xl",
        animation: "karaoke-glow",
      },
    },
    {
      id: "cinema-yellow",
      name: "Cinema Yellow (Điện Ảnh)",
      tag: "Netflix / Phim Rạp",
      icon: "🎬",
      description: "Màu vàng điện ảnh kinh điển chuẩn Netflix, dễ đọc trên mọi cảnh quay",
      styleProps: {
        capcutPreset: "cinema-yellow",
        textColor: "#FACC15",
        strokeColor: "#000000",
        strokeWidth: 2,
        bold: true,
        backgroundColor: "shadow-only",
        textShadow: true,
        fontFamily: "sans",
        fontSize: "lg",
        animation: "fade",
      },
    },
    {
      id: "cyberpunk-neon",
      name: "Cyberpunk Neon Pop",
      tag: "Vlog / Game / EDM",
      icon: "⚡",
      description: "Viền tím hồng Neon tương phản xanh Cyan cực kỳ nổi bật",
      styleProps: {
        capcutPreset: "cyberpunk-neon",
        textColor: "#06B6D4",
        strokeColor: "#D946EF",
        strokeWidth: 2,
        glowColor: "rgba(217, 70, 239, 0.8)",
        bold: true,
        uppercase: true,
        backgroundColor: "none",
        textShadow: true,
        fontSize: "xl",
        animation: "zoom-in",
      },
    },
    {
      id: "box-highlight",
      name: "Modern Box Highlight",
      tag: "Review / Phim Ngắn",
      icon: "📦",
      description: "Hộp phụ đề bo góc đen kính mờ chống lóa, hiện đại và tinh tế",
      styleProps: {
        capcutPreset: "box-highlight",
        textColor: "#FFFFFF",
        strokeWidth: 0,
        backgroundColor: "translucent-black",
        textShadow: false,
        bold: true,
        fontSize: "base",
        animation: "none",
      },
    },
  ];

  const handleApplyPreset = (preset: typeof CAPCUT_PRESETS[0]) => {
    onChangeStyle({
      ...style,
      ...preset.styleProps,
    });
    if (onNotify) onNotify(`Đã áp dụng mẫu chữ CapCut: "${preset.name}"!`, "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="capcut-modal-dialog"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Bộ Công Cụ CapCut & Edit Âm Thanh</h3>
                <span className="text-[10px] bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hiệu ứng chữ thịnh hành CapCut, tỉ lệ khung hình TikTok và bộ lọc xử lý âm thanh chuyên nghiệp
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("capcut-subtitles")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "capcut-subtitles"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Mẫu Chữ CapCut & Khung Hình</span>
          </button>
          <button
            onClick={() => setActiveTab("audio-editing")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === "audio-editing"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Xử Lý Âm Thanh Chuyên Sâu (CapCut Audio)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "capcut-subtitles" && (
            <div className="space-y-6">
              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Chọn mẫu phong cách phụ đề CapCut thịnh hành:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CAPCUT_PRESETS.map((preset) => {
                    const isSelected = style.capcutPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? "bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 shadow-lg shadow-purple-950/50"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-base">{preset.icon}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                              {preset.tag}
                            </span>
                          </div>
                          <div className="font-bold text-sm text-slate-100">{preset.name}</div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-1 text-[11px] text-purple-400 font-bold">
                            <Check className="w-3.5 h-3.5" /> Đang kích hoạt
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspect Ratio & Safe Zone Selector */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-rose-400" />
                    <span>Tỉ lệ khung hình Video & Khung an toàn CapCut:</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "16:9", label: "16:9 Ngang", sub: "YouTube / Web Phim", icon: Monitor },
                    { id: "9:16", label: "9:16 Dọc", sub: "TikTok / Reels / Shorts", icon: Smartphone },
                    { id: "1:1", label: "1:1 Vuông", sub: "Facebook / Instagram", icon: Maximize },
                    { id: "4:5", label: "4:5 Dọc vừa", sub: "Feeds / Threads", icon: Smartphone },
                  ].map((ratio) => {
                    const isSelected = (style.aspectRatio || "16:9") === ratio.id;
                    const IconComp = ratio.icon;
                    return (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => onChangeStyle({ ...style, aspectRatio: ratio.id as AspectRatio })}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "bg-rose-950/50 border-rose-500 text-white shadow-md shadow-rose-950/40"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <IconComp className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                        <div className="font-bold text-xs">{ratio.label}</div>
                        <div className="text-[10px] text-slate-500">{ratio.sub}</div>
                      </button>
                    );
                  })}
                </div>

                {/* TikTok Safe Zone toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-rose-300">Bật lưới an toàn TikTok (Safe Zone): </span>
                    <span className="text-slate-400 text-[11px] block sm:inline">
                      Cảnh báo vùng bị nút Like, Comment & Caption che khuất để phụ đề luôn đọc rõ.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={style.showTikTokSafeZone || false}
                      onChange={(e) =>
                        onChangeStyle({ ...style, showTikTokSafeZone: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              </div>

              {/* CapCut Text Animation Selector */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-200">
                  Hiệu ứng xuất hiện chữ (Text Animation):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "none", label: "Tĩnh (Mặc định)" },
                    { id: "bounce", label: "Nhún nảy (Bounce Pop)" },
                    { id: "karaoke-glow", label: "Phát sáng Karaoke" },
                    { id: "fade", label: "Mờ dần điện ảnh (Fade In)" },
                    { id: "typewriter", label: "Gõ máy tính (Typewriter)" },
                    { id: "zoom-in", label: "Phóng to bắt mắt (Zoom In)" },
                  ].map((anim) => {
                    const isSelected = (style.animation || "none") === anim.id;
                    return (
                      <button
                        key={anim.id}
                        type="button"
                        onClick={() =>
                          onChangeStyle({ ...style, animation: anim.id as CapCutAnimation })
                        }
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-purple-950/50 border-purple-500 text-purple-200"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {anim.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "audio-editing" && (
            <div className="space-y-5">
              {/* Volume Boost Slider */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-slate-200">Khuếch đại âm lượng (Volume Boost CapCut):</span>
                  </div>
                  <span className="font-mono text-purple-400 font-bold text-sm">
                    {Math.round(audioConfig.volumeMultiplier * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={audioConfig.volumeMultiplier}
                  onChange={(e) =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      volumeMultiplier: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Tắt tiếng (0%)</span>
                  <span>Gốc (100%)</span>
                  <span>Kích âm 150%</span>
                  <span className="text-purple-400 font-bold">Max 250% (Chống vỡ)</span>
                </div>
              </div>

              {/* Audio Enhancement Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vocal Enhancer */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Làm trong giọng nói (Vocal Clarifier)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tăng cường dải âm trung để lời thoại diễn viên rõ ràng hơn
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioConfig.vocalEnhance}
                    onChange={(e) =>
                      onChangeAudioConfig({ ...audioConfig, vocalEnhance: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-500 accent-purple-500 cursor-pointer ml-2"
                  />
                </div>

                {/* Bass Boost */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-rose-400" />
                      <span>Tăng âm trầm (Bass Boost)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tạo hiệu ứng âm bass sâu lắng, ấm áp chuẩn rạp phim
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioConfig.bassBoost}
                    onChange={(e) =>
                      onChangeAudioConfig({ ...audioConfig, bassBoost: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-500 accent-purple-500 cursor-pointer ml-2"
                  />
                </div>

                {/* Noise Reduction */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>Lọc tiếng ồn nền (Noise Reduction)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Khử tiếng gió, tiếng xì xào và tạp âm môi trường quay ngoài trời
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioConfig.noiseReduction}
                    onChange={(e) =>
                      onChangeAudioConfig({ ...audioConfig, noiseReduction: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-500 accent-purple-500 cursor-pointer ml-2"
                  />
                </div>

                {/* Audio Ducking */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tự động giảm nhạc nền khi nói (Audio Ducking)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Hạ nhỏ nhạc nền khi nhân vật hoặc giọng thuyết minh cất lời
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioConfig.audioDucking}
                    onChange={(e) =>
                      onChangeAudioConfig({ ...audioConfig, audioDucking: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-500 accent-purple-500 cursor-pointer ml-2"
                  />
                </div>
              </div>

              {/* Studio Reverb */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  Hiệu ứng không gian phòng thu (Reverb FX):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "none", label: "Mộc (Không vang)" },
                    { id: "studio", label: "Phòng Thu Studio" },
                    { id: "room", label: "Phòng Ấm (Warm Room)" },
                    { id: "hall", label: "Hội Trường / Rạp Hát" },
                  ].map((rev) => {
                    const isSelected = audioConfig.reverb === rev.id;
                    return (
                      <button
                        key={rev.id}
                        type="button"
                        onClick={() =>
                          onChangeAudioConfig({ ...audioConfig, reverb: rev.id as any })
                        }
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-purple-950/60 border-purple-500 text-purple-200 font-bold"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {rev.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={() => {
              onChangeAudioConfig({
                volumeMultiplier: 1.0,
                vocalEnhance: false,
                bassBoost: false,
                noiseReduction: false,
                audioDucking: false,
                playbackSpeed: 1.0,
                reverb: "none",
              });
              if (onNotify) onNotify("Đã đặt lại thông số âm thanh về mặc định!", "info");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại mặc định</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 hover:opacity-95 transition-all"
          >
            Hoàn tất & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
