import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Mic,
  Sliders,
  Sparkles,
  Film,
  CheckCircle2,
  Layers,
  Radio,
  Eye,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  SubtitleCue,
  SubtitleStyle,
  VoiceoverConfig,
  SpeakerVoicePersona,
} from "../types";
import {
  AVAILABLE_VOICES,
  getCueSpeechText,
  getPersonaInfo,
  findBestWebSpeechVoice,
} from "../utils/voiceoverEngine";

interface ExportPreviewPlayerProps {
  videoUrl: string;
  cues: SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  voiceover: VoiceoverConfig;
  onChangeVoiceover: (cfg: VoiceoverConfig | ((prev: VoiceoverConfig) => VoiceoverConfig)) => void;
  onProceedExport: () => void;
}

export const ExportPreviewPlayer: React.FC<ExportPreviewPlayerProps> = ({
  videoUrl,
  cues,
  subtitleStyle,
  voiceover,
  onChangeVoiceover,
  onProceedExport,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDucking, setIsDucking] = useState(false);
  const [previewVolume, setPreviewVolume] = useState(1);
  const [previewMuted, setPreviewMuted] = useState(false);

  const lastSpokenCueIdRef = useRef<number | null>(null);
  const cuesContainerRef = useRef<HTMLDivElement>(null);

  // Find currently active cue based on current video time
  const activeCue = useMemo(() => {
    return cues.find((c) => currentTime >= c.start && currentTime <= c.end) || null;
  }, [cues, currentTime]);

  // Handle Voiceover synchronization & Audio Ducking
  useEffect(() => {
    if (!videoRef.current) return;

    if (!activeCue || !voiceover.enabled || !isPlaying) {
      if (isDucking) {
        setIsDucking(false);
        if (videoRef.current) {
          videoRef.current.volume = previewMuted ? 0 : previewVolume;
        }
      }
      return;
    }

    // Only speak once per cue
    if (lastSpokenCueIdRef.current === activeCue.id) return;
    lastSpokenCueIdRef.current = activeCue.id;

    const speechText = getCueSpeechText(activeCue, voiceover.readMode);
    if (!speechText) return;

    // Apply audio ducking: lower video audio volume while voiceover is talking
    const duckedVol = (voiceover.originalVolumeDucking ?? 0.25) * previewVolume;
    videoRef.current.volume = previewMuted ? 0 : Math.max(0, duckedVol);
    setIsDucking(true);

    // Speak via browser SpeechSynthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = "vi-VN";
      utterance.rate = voiceover.speechRate || 1.0;

      // Persona voice tuning if multi-voice is enabled
      if (voiceover.autoMultiVoice && activeCue.voicePersona) {
        const personaMeta = getPersonaInfo(activeCue.voicePersona);
        utterance.pitch = personaMeta.pitch;
        utterance.rate = (voiceover.speechRate || 1.0) * personaMeta.rate;
        const bestVoice = findBestWebSpeechVoice(personaMeta.gender === "male" ? "male" : "female");
        if (bestVoice) utterance.voice = bestVoice;
      } else {
        const bestVoice = findBestWebSpeechVoice(voiceover.voiceId.includes("female") ? "female" : "male");
        if (bestVoice) utterance.voice = bestVoice;
      }

      utterance.onend = () => {
        setIsDucking(false);
        if (videoRef.current) {
          videoRef.current.volume = previewMuted ? 0 : previewVolume;
        }
      };

      utterance.onerror = () => {
        setIsDucking(false);
        if (videoRef.current) {
          videoRef.current.volume = previewMuted ? 0 : previewVolume;
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [
    activeCue,
    voiceover.enabled,
    isPlaying,
    voiceover.readMode,
    voiceover.speechRate,
    voiceover.originalVolumeDucking,
    voiceover.autoMultiVoice,
    voiceover.voiceId,
    previewVolume,
    previewMuted,
    isDucking,
  ]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll active cue into view
  useEffect(() => {
    if (activeCue && cuesContainerRef.current) {
      const el = document.getElementById(`preview-cue-item-${activeCue.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeCue]);

  // Player controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const handleSeek = (timeInSeconds: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(timeInSeconds, duration || 9999));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
    lastSpokenCueIdRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const jumpToCue = (cue: SubtitleCue) => {
    handleSeek(cue.start);
    if (!isPlaying && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const jumpPrevCue = () => {
    const prev = cues.filter((c) => c.start < currentTime - 0.5).pop();
    if (prev) {
      jumpToCue(prev);
    } else {
      handleSeek(0);
    }
  };

  const jumpNextCue = () => {
    const next = cues.find((c) => c.start > currentTime + 0.1);
    if (next) {
      jumpToCue(next);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Build Subtitle CSS styles matching subtitleStyle exactly
  const getSubtitleCSS = () => {
    const sizeMap = {
      sm: "text-xs sm:text-sm",
      base: "text-sm sm:text-base",
      lg: "text-base sm:text-lg",
      xl: "text-lg sm:text-xl",
      "2xl": "text-xl sm:text-2xl",
    };

    const fontMap = {
      sans: "font-sans",
      serif: "font-serif",
      bebas: "font-['Bebas_Neue',sans-serif] tracking-wider",
    };

    const bgMap = {
      none: "bg-transparent",
      "translucent-black": "bg-black/75 px-3 py-1.5 rounded-lg backdrop-blur-xs",
      "solid-black": "bg-black px-3 py-1.5 rounded-lg",
      "shadow-only": "bg-transparent",
    };

    return {
      fontSizeClass: sizeMap[subtitleStyle.fontSize] || "text-base sm:text-lg",
      fontFamilyClass: fontMap[subtitleStyle.fontFamily] || "font-sans",
      bgClass: bgMap[subtitleStyle.backgroundColor] || "bg-black/75",
      isBold: subtitleStyle.bold,
      isItalic: subtitleStyle.italic,
      isUpper: subtitleStyle.uppercase,
      color: subtitleStyle.textColor || "#FFFFFF",
      stroke: subtitleStyle.strokeWidth
        ? `${subtitleStyle.strokeWidth}px ${subtitleStyle.strokeColor || "#000000"}`
        : undefined,
    };
  };

  const styleCSS = getSubtitleCSS();

  return (
    <div className="space-y-4">
      {/* Top Banner Notice */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300">
            Bạn đang ở chế độ <strong>Xem & Nghe Trước Thành Phẩm</strong>. Video phát với chữ phụ đề, màu sắc, vị trí và giọng thuyết minh AI khớp từng giây giống hệt video xuất ra.
          </span>
        </div>
        <button
          onClick={onProceedExport}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <span>Xuất video ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Video Theater Player (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group">
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Live Burned Subtitle Preview Overlay */}
            {activeCue && (
              <div
                className={`absolute left-0 right-0 px-4 text-center pointer-events-none transition-all duration-150 z-20 flex justify-center ${
                  subtitleStyle.position === "top"
                    ? "top-6"
                    : subtitleStyle.position === "middle"
                    ? "top-1/2 -translate-y-1/2"
                    : "bottom-6"
                }`}
              >
                <div
                  className={`inline-block max-w-[92%] ${styleCSS.bgClass} ${styleCSS.fontFamilyClass} ${styleCSS.fontSizeClass} ${
                    styleCSS.isBold ? "font-bold" : "font-medium"
                  } ${styleCSS.isItalic ? "italic" : ""} ${
                    styleCSS.isUpper ? "uppercase" : ""
                  } leading-snug drop-shadow-md`}
                  style={{
                    color: styleCSS.color,
                    WebkitTextStroke: styleCSS.stroke,
                  }}
                >
                  {/* Bilingual original line */}
                  {(subtitleStyle.displayMode === "bilingual" ||
                    voiceover.readMode === "bilingual") &&
                    activeCue.textOriginal && (
                      <div className="text-[11px] sm:text-xs text-slate-300 opacity-90 italic mb-0.5">
                        {activeCue.textOriginal}
                      </div>
                    )}
                  {/* Main subtitle line */}
                  <div>
                    {subtitleStyle.displayMode === "original"
                      ? activeCue.textOriginal
                      : activeCue.textVi}
                  </div>
                  {/* Speaker Persona Badge */}
                  {activeCue.speakerRole && (
                    <div className="text-[9px] font-mono opacity-80 mt-0.5 text-amber-300">
                      🎭 {activeCue.speakerRole}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ducking Audio Wave Overlay Badge */}
            {isDucking && voiceover.enabled && (
              <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs animate-pulse">
                <Mic className="w-3.5 h-3.5" />
                <span>Thuyết minh AI đang đọc (Đã giảm âm gốc)</span>
              </div>
            )}

            {/* Play/Pause center overlay when hovered or paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-10"
                title="Bấm để phát xem trước"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
            )}
          </div>

          {/* Player Media Controls Bar */}
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
            {/* Seeker Slider */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-400 w-11 shrink-0">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="font-mono text-xs text-slate-400 w-11 shrink-0 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={jumpPrevCue}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Nhảy đến câu phụ đề trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md"
                  title={isPlaying ? "Tạm dừng" : "Phát video"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={jumpNextCue}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Nhảy đến câu phụ đề kế tiếp"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSeek(0)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                  title="Xem lại từ đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Volume & Ducking Control */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <button
                    onClick={() => {
                      if (!videoRef.current) return;
                      const nextMute = !previewMuted;
                      setPreviewMuted(nextMute);
                      videoRef.current.volume = nextMute ? 0 : previewVolume;
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    {previewMuted || previewVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={previewMuted ? 0 : previewVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setPreviewVolume(v);
                      setPreviewMuted(false);
                      if (videoRef.current) videoRef.current.volume = v;
                    }}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  <span>Ducking:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Math.round((voiceover.originalVolumeDucking ?? 0.25) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subtitle Inspector & Quick Settings (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          {/* Subtitle Inspector Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col h-[280px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-white">Danh Sách Câu Phụ Đề ({cues.length})</span>
              </div>
              <span className="text-[10px] text-slate-500">Nhấp để nghe thử câu đó</span>
            </div>

            <div
              ref={cuesContainerRef}
              className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs"
            >
              {cues.map((cue) => {
                const isActive = activeCue?.id === cue.id;
                return (
                  <div
                    key={cue.id}
                    id={`preview-cue-item-${cue.id}`}
                    onClick={() => jumpToCue(cue)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? "bg-emerald-950/70 border-emerald-500/80 text-white shadow-md"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono font-semibold text-emerald-400">
                        {cue.startTime.slice(3, 8)} - {cue.endTime.slice(3, 8)}
                      </span>
                      {cue.speakerRole && (
                        <span className="bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded font-medium">
                          {cue.speakerRole}
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-slate-100 line-clamp-2">
                      {cue.textVi}
                    </div>
                    {cue.textOriginal && (
                      <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                        {cue.textOriginal}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Voiceover Tweaker in Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thuyết minh AI:</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeVoiceover((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  voiceover.enabled
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {voiceover.enabled ? "Đang Bật" : "Đã Tắt"}
              </button>
            </div>

            {voiceover.enabled && (
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Giọng đọc chính:</label>
                  <select
                    value={voiceover.voiceId}
                    onChange={(e) =>
                      onChangeVoiceover((prev) => ({ ...prev, voiceId: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  >
                    {AVAILABLE_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Phân vai đa nhân vật:</span>
                  <input
                    type="checkbox"
                    checked={voiceover.autoMultiVoice}
                    onChange={(e) =>
                      onChangeVoiceover((prev) => ({
                        ...prev,
                        autoMultiVoice: e.target.checked,
                      }))
                    }
                    className="accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
