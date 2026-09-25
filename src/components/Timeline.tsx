import React, { useRef, useState } from "react";
import {
  Clock,
  Plus,
  Scissors,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Film,
  Mic2,
  ListOrdered,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Sliders,
} from "lucide-react";
import { SubtitleCue, AudioEditConfig } from "../types";
import { formatSecondsToDisplay } from "../utils/subtitleFormatters";

interface TimelineProps {
  currentTime: number;
  duration: number;
  setCurrentTime: (time: number) => void;
  cues: SubtitleCue[];
  selectedCueId?: number | null;
  onSelectCue?: (cueId: number, startTime: number) => void;
  onAddCue?: (time: number) => void;
  onSmartSplitCue?: (cueId: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  videoTitle?: string;
  audioConfig?: AudioEditConfig;
  onUpdateAudioConfig?: (newConfig: AudioEditConfig) => void;
  onOpenVoiceoverModal?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  setCurrentTime,
  cues,
  selectedCueId,
  onSelectCue,
  onAddCue,
  onSmartSplitCue,
  isPlaying,
  onTogglePlay,
  videoTitle = "Video Gốc",
  audioConfig,
  onUpdateAudioConfig,
  onOpenVoiceoverModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const safeDuration = duration > 0 ? duration : 30;
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(100);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * safeDuration;
    setCurrentTime(Number(newTime.toFixed(2)));
  };

  const progressPercent = Math.max(0, Math.min(100, (currentTime / safeDuration) * 100));

  const handleVolumeChange = (val: number) => {
    setAudioVolume(val);
    if (onUpdateAudioConfig && audioConfig) {
      onUpdateAudioConfig({
        ...audioConfig,
        volumeMultiplier: Number((val / 100).toFixed(2)),
      });
    }
  };

  return (
    <div
      className="timeline-root border-t border-slate-800/90 flex flex-col select-none relative z-10 shrink-0 overflow-hidden"
      style={{
        height: "var(--timeline-height, 250px)",
        backgroundColor: "var(--app-bg, #0b0f19)",
      }}
    >
      {/* Timeline Control Header Bar */}
      <div className="h-9 bg-[#090d17] border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play / Pause button */}
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="p-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1 font-semibold text-[11px] shadow-sm active:scale-95"
              title={isPlaying ? "Tạm dừng (Space)" : "Phát video (Space)"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPlaying ? "Dừng" : "Phát"}</span>
            </button>
          )}

          {/* Time display */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            <Clock className="w-3 h-3 text-rose-400" />
            <span className="text-rose-400 font-bold">{formatSecondsToDisplay(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatSecondsToDisplay(safeDuration)}</span>
          </div>

          {/* Quick jump */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <button
              onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              -5s
            </button>
            <button
              onClick={() => setCurrentTime(Math.min(safeDuration, currentTime + 5))}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              +5s
            </button>
          </div>
        </div>

        {/* Right side timeline actions */}
        <div className="flex items-center gap-2 text-xs">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              className="p-1 text-slate-400 hover:text-white"
              title="Thu nhỏ timeline"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-slate-400 text-[10px] w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1 text-slate-400 hover:text-white"
              title="Phóng to timeline"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Add cue button */}
          {onAddCue && (
            <button
              onClick={() => onAddCue(currentTime)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shadow-sm transition active:scale-95"
              title="Thêm phụ đề mới tại mốc thời gian hiện tại"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Multi-Track Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Headers column (Labels & Track controls) */}
        <div className="w-36 sm:w-44 bg-[#080c16] border-r border-slate-800/80 flex flex-col shrink-0 text-xs select-none">
          {/* Time ruler header empty space */}
          <div className="h-6 border-b border-slate-800/80 px-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>TRACK HỆ THỐNG</span>
          </div>

          {/* Track 1 Header: VIDEO */}
          <div className="h-12 border-b border-slate-800/80 px-2.5 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-semibold text-slate-200">Track Video</div>
                <div className="text-[9px] text-slate-500 truncate">{videoTitle}</div>
              </div>
            </div>
            <span className="text-[9px] px-1 rounded bg-blue-950 text-blue-300 font-mono">V1</span>
          </div>

          {/* Track 2 Header: AUDIO */}
          <div className="h-14 border-b border-slate-800/80 px-2.5 flex flex-col justify-center bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-200">Audio & AI</span>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-white"
                title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-purple-400" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="range"
                min="0"
                max="150"
                value={isMuted ? 0 : audioVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-[9px] font-mono text-slate-500 w-6 text-right">
                {isMuted ? 0 : audioVolume}%
              </span>
            </div>
          </div>

          {/* Track 3 Header: SUBTITLES */}
          <div className="h-16 px-2.5 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <ListOrdered className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-semibold text-slate-200">Phụ đề Vietsub</div>
                <div className="text-[9px] text-slate-400">{cues.length} câu đã khớp</div>
              </div>
            </div>
            <span className="text-[9px] px-1 rounded bg-rose-950 text-rose-300 font-mono font-bold">SUB</span>
          </div>
        </div>

        {/* Right Tracks Timeline Canvas Area */}
        <div
          ref={containerRef}
          onClick={handleTrackClick}
          className="flex-1 relative overflow-x-auto overflow-y-hidden cursor-pointer select-none group"
          style={{ transformOrigin: "left center" }}
        >
          {/* Time Ruler Top bar */}
          <div className="h-6 border-b border-slate-800/80 bg-[#090d17] relative flex items-center px-1 pointer-events-none">
            {Array.from({ length: 16 }).map((_, i) => {
              const sec = Math.round((safeDuration / 15) * i);
              const posPercent = (i / 15) * 100;
              return (
                <div
                  key={i}
                  style={{ left: `${posPercent}%` }}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-between py-0.5 -translate-x-1/2"
                >
                  <span className="text-[9px] font-mono text-slate-500">{sec}s</span>
                  <div className={`w-px bg-slate-700 ${i % 2 === 0 ? "h-2" : "h-1"}`} />
                </div>
              );
            })}
          </div>

          {/* Track 1 Area: VIDEO TRACK (--color-track-video: #1e293b) */}
          <div
            className="h-12 border-b border-slate-800/80 relative flex items-center px-1 overflow-hidden"
            style={{ backgroundColor: "var(--color-track-video, #1e293b)" }}
          >
            {/* Visual Video Block spanning entire video duration */}
            <div className="absolute inset-y-1.5 left-1 right-1 rounded-lg bg-blue-900/60 border border-blue-500/40 flex items-center px-3 justify-between shadow-inner">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 truncate">
                <Film className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">{videoTitle}</span>
              </div>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 shrink-0">
                00:00 - {formatSecondsToDisplay(safeDuration)}
              </span>
            </div>
          </div>

          {/* Track 2 Area: AUDIO TRACK (--color-track-audio: #131224) */}
          <div
            className="h-14 border-b border-slate-800/80 relative flex items-center px-1 overflow-hidden"
            style={{ backgroundColor: "var(--color-track-audio, #131224)" }}
          >
            {/* Audio Block */}
            <div className="absolute inset-y-1.5 left-1 right-1 rounded-lg bg-purple-950/70 border border-purple-500/40 flex items-center px-3 justify-between shadow-inner">
              <div className="flex items-center gap-2 text-xs text-purple-200 truncate">
                <Mic2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold truncate">Âm thanh gốc & Thuyết minh AI</span>
                {onOpenVoiceoverModal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVoiceoverModal();
                    }}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-purple-800/60 hover:bg-purple-700 text-purple-200 ml-2"
                  >
                    Phân vai
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-70">
                <span className="w-1.5 h-4 bg-purple-400/80 rounded-xs" />
                <span className="w-1.5 h-6 bg-purple-400/90 rounded-xs" />
                <span className="w-1.5 h-3 bg-purple-400/70 rounded-xs" />
                <span className="w-1.5 h-7 bg-purple-400 rounded-xs" />
                <span className="w-1.5 h-5 bg-purple-400/80 rounded-xs" />
              </div>
            </div>
          </div>

          {/* Track 3 Area: SUBTITLES TRACK (--color-track-subtitle: #1e1b4b) */}
          <div
            className="h-16 relative flex items-center px-1 overflow-hidden"
            style={{ backgroundColor: "var(--color-track-subtitle, #1e1b4b)" }}
          >
            {/* Interactive Subtitle Cues */}
            {cues.map((cue) => {
              const startRatio = Math.max(0, Math.min(1, cue.start / safeDuration));
              const endRatio = Math.max(0, Math.min(1, cue.end / safeDuration));
              const widthRatio = Math.max(0.012, endRatio - startRatio);

              const isSelected = selectedCueId === cue.id;
              const isCurrent = currentTime >= cue.start && currentTime <= cue.end;

              return (
                <div
                  key={cue.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCue?.(cue.id, cue.start);
                    setCurrentTime(cue.start);
                  }}
                  style={{
                    left: `${startRatio * 100}%`,
                    width: `${widthRatio * 100}%`,
                  }}
                  className={`pointer-events-auto absolute inset-y-1.5 rounded-lg text-[11px] px-2 flex items-center justify-between overflow-hidden cursor-pointer border transition-all duration-100 select-none ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-300 ring-2 ring-indigo-400/60 shadow-lg z-20 font-bold"
                      : isCurrent
                      ? "bg-rose-600 text-white border-rose-400 shadow-md font-semibold z-20"
                      : "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white"
                  }`}
                  title={`#${cue.id} (${formatSecondsToDisplay(cue.start)} - ${formatSecondsToDisplay(cue.end)}): ${cue.textVi || cue.textOriginal}`}
                >
                  <span className="truncate pr-1">
                    #{cue.id}: {cue.textVi || cue.textOriginal}
                  </span>

                  {onSmartSplitCue && cue.textVi && cue.textVi.length > 50 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSmartSplitCue(cue.id);
                      }}
                      className="p-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 shrink-0 ml-1 transition"
                      title="Tách câu dài"
                    >
                      <Scissors className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unified Playhead Red Line across All 3 Tracks */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none transition-[left] duration-75"
          >
            {/* Playhead Diamond Head */}
            <div className="w-3.5 h-3.5 bg-rose-500 rotate-45 -ml-[6px] -mt-[3px] shadow-lg shadow-rose-500/70" />
            <div className="absolute -top-5 -translate-x-1/2 bg-rose-600 text-white text-[9px] font-mono px-1 rounded shadow">
              {formatSecondsToDisplay(currentTime)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Timeline;
