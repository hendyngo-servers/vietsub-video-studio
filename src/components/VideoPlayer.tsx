import React, { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Sliders,
  Zap,
  Sparkles,
  Users,
  Mic,
} from "lucide-react";
import { SubtitleCue, SubtitleStyle, AudioEditConfig, VoiceoverConfig } from "../types";
import { formatSecondsToDisplay } from "../utils/subtitleFormatters";
import {
  previewSpeakerPersona,
  getPersonaInfo,
} from "../utils/voiceoverEngine";

export interface VideoPlayerHandle {
  togglePlay: () => void;
  seekRelative: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  toggleSubtitles: () => void;
}

export interface VideoPlayerProps {
  videoUrl: string;
  cues: SubtitleCue[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  subtitleStyle: SubtitleStyle;
  onOpenStyleModal: () => void;
  onSeek: (time: number) => void;
  audioConfig?: AudioEditConfig;
  onOpenCapCutModal?: () => void;
  voiceoverConfig?: VoiceoverConfig;
  onOpenVoiceoverModal?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({
  videoUrl,
  cues,
  currentTime,
  onTimeUpdate,
  subtitleStyle,
  onOpenStyleModal,
  onSeek,
  audioConfig,
  onOpenCapCutModal,
  voiceoverConfig,
  onOpenVoiceoverModal,
  onPlayStateChange,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSpokenCueIdRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const hideControlsTimerRef = useRef<any>(null);

  // Sync video currentTime when seek requested from outside
  useEffect(() => {
    if (videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.4) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime]);

  // Sync audioConfig (playback speed, volume boost, etc.)
  useEffect(() => {
    if (videoRef.current && audioConfig) {
      if (audioConfig.playbackSpeed && audioConfig.playbackSpeed !== playbackRate) {
        setPlaybackRate(audioConfig.playbackSpeed);
        videoRef.current.playbackRate = audioConfig.playbackSpeed;
      }
      if (audioConfig.volumeMultiplier !== undefined && !isMuted) {
        const effectiveVol = Math.min(1, volume * audioConfig.volumeMultiplier);
        videoRef.current.volume = effectiveVol;
      }
    }
  }, [audioConfig, playbackRate, isMuted, volume]);

  // Notify parent of playback state changes
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Find active subtitle
  const activeCue = useMemo(() => {
    if (!showSubtitles || !cues.length) return null;
    return cues.find((c) => currentTime >= c.start && currentTime <= c.end) || null;
  }, [cues, currentTime, showSubtitles]);

  // Synchronized Multi-Voice Voiceover Playback with Audio Ducking
  useEffect(() => {
    if (!voiceoverConfig?.enabled || !isPlaying || !activeCue) return;

    if (lastSpokenCueIdRef.current === activeCue.id) return;
    lastSpokenCueIdRef.current = activeCue.id;

    const persona =
      activeCue.voicePersona ||
      (activeCue.speakerGender === "male"
        ? activeCue.speakerAge === "elderly"
          ? "male_elderly"
          : "male_young"
        : activeCue.speakerAge === "elderly"
        ? "female_elderly"
        : "female_young");

    const textToSpeak =
      voiceoverConfig.readMode === "original"
        ? activeCue.textOriginal
        : activeCue.textVi || activeCue.textOriginal;

    if (!textToSpeak.trim()) return;

    // Apply audio ducking to background video volume while speaking
    if (videoRef.current && voiceoverConfig.originalVolumeDucking !== undefined) {
      const origVol = videoRef.current.volume;
      const duckedVol = Math.max(0.05, origVol * (voiceoverConfig.originalVolumeDucking || 0.25));
      videoRef.current.volume = duckedVol;

      previewSpeakerPersona(persona, textToSpeak, () => {
        if (videoRef.current && !isMuted) {
          videoRef.current.volume = origVol;
        }
      });
    } else {
      previewSpeakerPersona(persona, textToSpeak);
    }
  }, [activeCue, isPlaying, voiceoverConfig, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.warn);
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const jumpSeconds = (sec: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(0, videoRef.current.currentTime + sec), duration);
    videoRef.current.currentTime = newTime;
    onSeek(newTime);
  };

  // Expose imperative handle for global keyboard events
  useImperativeHandle(ref, () => ({
    togglePlay,
    seekRelative: (sec: number) => jumpSeconds(sec),
    play: () => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(console.warn);
        setIsPlaying(true);
      }
    },
    pause: () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    },
    toggleMute: () => {
      if (videoRef.current) {
        const nextMuted = !videoRef.current.muted;
        videoRef.current.muted = nextMuted;
        setIsMuted(nextMuted);
      }
    },
    toggleSubtitles: () => {
      setShowSubtitles((prev) => !prev);
    },
  }));

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onSeek(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 0.8;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
      }
    }, 2800);
  };

  // Subtitle styling classes
  const fontClass =
    subtitleStyle.fontFamily === "serif"
      ? "font-serif"
      : subtitleStyle.fontFamily === "bebas"
      ? "font-['Bebas_Neue'] tracking-wide"
      : "font-sans";

  const sizeClass = {
    sm: "text-sm sm:text-base",
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl md:text-2xl",
    xl: "text-xl sm:text-2xl md:text-3xl",
    "2xl": "text-2xl sm:text-3xl md:text-4xl",
  }[subtitleStyle.fontSize];

  const positionClass = {
    bottom: "bottom-14 sm:bottom-16",
    middle: "top-1/2 -translate-y-1/2",
    top: "top-8 sm:top-12",
  }[subtitleStyle.position];

  const bgBoxClass = {
    none: "",
    "translucent-black": "bg-black/75 backdrop-blur-xs px-4 py-2 rounded-lg",
    "solid-black": "bg-black px-4 py-2 rounded-lg",
    "shadow-only": "px-3 py-1",
  }[subtitleStyle.backgroundColor];

  // CapCut Pro animations & styling
  const animationClass = {
    none: "",
    bounce: "animate-bounce",
    fade: "animate-fadeIn",
    "karaoke-glow": "animate-pulse drop-shadow-[0_0_15px_rgba(250,204,21,0.9)]",
    "zoom-in": "scale-105 transition-transform duration-200",
    typewriter: "tracking-wider",
  }[subtitleStyle.animation || "none"];

  const fontModifiers = `${subtitleStyle.bold ? "font-extrabold" : "font-semibold"} ${
    subtitleStyle.italic ? "italic" : ""
  } ${subtitleStyle.uppercase ? "uppercase tracking-wider" : ""}`;

  const textStrokeStyle: React.CSSProperties =
    subtitleStyle.strokeWidth && subtitleStyle.strokeWidth > 0
      ? {
          WebkitTextStroke: `${subtitleStyle.strokeWidth * 1.2}px ${
            subtitleStyle.strokeColor || "#000000"
          }`,
        }
      : {};

  const aspectRatioClass = {
    "16:9": "aspect-video w-full",
    "9:16": "aspect-[9/16] w-auto max-h-[72vh] mx-auto",
    "1:1": "aspect-square w-auto max-h-[66vh] mx-auto",
    "4:5": "aspect-[4/5] w-auto max-h-[70vh] mx-auto",
  }[subtitleStyle.aspectRatio || "16:9"];

  return (
    <div
      ref={containerRef}
      id="video-player-container"
      onMouseMove={handleMouseMove}
      className={`relative ${aspectRatioClass} bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 group select-none flex items-center justify-center transition-all duration-300`}
    >
      <video
        ref={videoRef}
        id="main-video-element"
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* TikTok / Shorts Safe Zone Overlay */}
      {subtitleStyle.showTikTokSafeZone && (
        <div className="absolute inset-0 pointer-events-none z-15 border-2 border-dashed border-rose-500/40 rounded-2xl flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-[10px] text-rose-300 font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs w-fit">
            <span>Vùng an toàn TikTok (Safe Zone)</span>
          </div>
          <div className="self-end space-y-3 opacity-60 text-right pr-2">
            <div className="text-[10px] bg-black/70 px-2 py-1 rounded text-slate-300">
              [Vùng nút Like / Share / Comment]
            </div>
          </div>
          <div className="text-[10px] text-slate-400 bg-black/70 px-2.5 py-1 rounded w-fit">
            [Vùng Caption & Tên Kênh TikTok]
          </div>
        </div>
      )}

      {/* Subtitle Overlay */}
      {showSubtitles && activeCue && (
        <div
          id="subtitle-overlay"
          className={`absolute left-0 right-0 ${positionClass} flex flex-col items-center justify-center px-6 z-20 pointer-events-none transition-all duration-150`}
        >
          {/* Speaker Persona & Character Role Overlay Badge */}
          {activeCue.speakerRole && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full text-[11px] font-semibold bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 shadow-lg animate-fadeIn">
              <span>{getPersonaInfo(activeCue.voicePersona || (activeCue.speakerGender === "male" ? "male_young" : "female_young")).icon}</span>
              <span>{activeCue.speakerRole}</span>
            </div>
          )}

          <div
            className={`max-w-[92%] sm:max-w-[85%] text-center leading-snug ${bgBoxClass} ${fontClass} ${fontModifiers} ${animationClass} transition-all`}
            style={{
              color: subtitleStyle.textColor,
              textShadow: subtitleStyle.textShadow
                ? "0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                : "none",
              ...textStrokeStyle,
            }}
          >
            {/* Bilingual: show original language text on top if mode is bilingual */}
            {subtitleStyle.displayMode === "bilingual" && activeCue.textOriginal && (
              <div className="text-xs sm:text-sm md:text-base font-medium opacity-85 mb-0.5 tracking-wide text-white">
                {activeCue.textOriginal}
              </div>
            )}

            {/* Vietnamese main subtitle or original based on mode */}
            {subtitleStyle.displayMode === "original" ? (
              <div className={`${sizeClass}`}>
                {activeCue.textOriginal || activeCue.textVi}
              </div>
            ) : (
              <div className={`${sizeClass}`}>
                {activeCue.textVi}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center Big Play Button when paused */}
      {!isPlaying && (
        <button
          id="btn-center-play"
          onClick={togglePlay}
          className="absolute z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl hover:bg-rose-500 hover:scale-105 active:scale-95 transition-all backdrop-blur-xs"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
        </button>
      )}

      {/* Player Controls Bar */}
      <div
        id="video-controls-bar"
        className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-8 pb-3 px-3 sm:px-5 transition-opacity duration-300 ${
          isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Slider */}
        <div className="flex items-center gap-3 mb-2">
          <input
            id="video-seek-slider"
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 sm:h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:h-2.5 transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-200">
          {/* Left Controls: Play, Jump, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-toggle-play"
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all text-white"
              title={isPlaying ? "Tạm dừng (Space)" : "Phát (Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              id="btn-rewind-5s"
              onClick={() => jumpSeconds(-5)}
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all text-slate-300 hover:text-white"
              title="Lùi 5 giây"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="btn-forward-5s"
              onClick={() => jumpSeconds(5)}
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all text-slate-300 hover:text-white"
              title="Tua tới 5 giây"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time display */}
            <div className="font-mono text-[11px] sm:text-xs text-slate-400 pl-1">
              <span className="text-white font-semibold">{formatSecondsToDisplay(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatSecondsToDisplay(duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-1 pl-2">
              <button
                id="btn-toggle-mute"
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Bật/Tắt âm thanh"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                id="video-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Right Controls: Subtitle Toggle, Style, Speed, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Toggle Subtitles On/Off */}
            <button
              id="btn-toggle-subtitles"
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                showSubtitles
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title="Bật/Tắt hiển thị phụ đề"
            >
              {showSubtitles ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Vietsub</span>
            </button>

            {/* Voiceover & Speaker Casting Modal Trigger */}
            {onOpenVoiceoverModal && (
              <button
                id="btn-open-voiceover-modal"
                onClick={onOpenVoiceoverModal}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all shadow-sm ${
                  voiceoverConfig?.enabled
                    ? "bg-rose-600 text-white shadow-rose-600/30"
                    : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                }`}
                title="Cài đặt nhận diện giọng nói Nam/Nữ/Già/Trẻ & Thuyết minh Tiếng Việt"
              >
                <Users className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden md:inline">Thuyết minh AI</span>
              </button>
            )}

            {/* CapCut & Audio Editing modal trigger */}
            {onOpenCapCutModal && (
              <button
                id="btn-open-capcut-modal"
                onClick={onOpenCapCutModal}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/40 hover:border-purple-400 hover:text-white transition-all shadow-sm"
                title="Mở Bộ công cụ CapCut & Edit Âm thanh Pro"
              >
                <Zap className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span className="hidden md:inline">CapCut</span>
              </button>
            )}

            {/* Subtitle Style modal trigger */}
            <button
              id="btn-open-style-modal"
              onClick={onOpenStyleModal}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              title="Tùy chỉnh kiểu chữ & vị trí phụ đề"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Speed selection */}
            <select
              id="select-playback-speed"
              value={playbackRate}
              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
              className="bg-slate-800/90 text-slate-200 hover:text-white text-xs rounded-md px-1.5 py-1 border border-slate-700 focus:outline-none focus:border-rose-500 cursor-pointer"
              title="Tốc độ phát"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>

            {/* Fullscreen */}
            <button
              id="btn-toggle-fullscreen"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
VideoPlayer.displayName = "VideoPlayer";
