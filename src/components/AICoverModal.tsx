import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Mic,
  Music,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Check,
  Disc,
  Radio,
  Share2,
  FileMusic,
  Wand2,
  Loader2,
  ChevronRight,
  ListMusic,
  Maximize2,
  AudioWaveform as WaveformIcon,
  Wind,
  Layers,
  Headphones,
} from "lucide-react";
import { SubtitleCue } from "../types";
import {
  AI_SINGERS,
  MUSIC_GENRES,
  DEFAULT_COVER_CONFIG,
  formatCuesToSongLyrics,
  generateAISongCover,
  GeneratedCoverResult,
} from "../utils/aiCoverEngine";

interface AICoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  videoTitle?: string;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const AICoverModal: React.FC<AICoverModalProps> = ({
  isOpen,
  onClose,
  cues,
  videoTitle = "video",
  onNotify,
}) => {
  const [config, setConfig] = useState(DEFAULT_COVER_CONFIG);
  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedResult, setGeneratedResult] = useState<GeneratedCoverResult | null>(null);

  // Multi-track player tab: "master" | "vocals" | "instrumental"
  const [activeTrack, setActiveTrack] = useState<"master" | "vocals" | "instrumental">("master");

  // Player state for generated cover
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Canvas visualizer ref
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize lyrics from cues when modal opens
  useEffect(() => {
    if (isOpen) {
      const extracted = formatCuesToSongLyrics(cues);
      setLyrics(
        extracted ||
          "Em ơi đừng khóc bóng tối trước mắt sẽ bắt em đi\nEm ơi đừng lo ngày mai nắng ấm sẽ mang nụ cười về lại..."
      );
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isOpen, cues]);

  // Audio time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const togglePlayCover = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(console.warn);
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Switch between master, vocals, and instrumental track
  const handleSwitchTrack = (track: "master" | "vocals" | "instrumental") => {
    if (!generatedResult) return;
    setActiveTrack(track);
    const wasPlaying = isPlaying;
    const curTime = audioRef.current?.currentTime || 0;

    let targetUrl = generatedResult.masterUrl;
    if (track === "vocals") targetUrl = generatedResult.vocalsUrl;
    if (track === "instrumental") targetUrl = generatedResult.instrumentalUrl;

    if (audioRef.current) {
      audioRef.current.src = targetUrl;
      audioRef.current.currentTime = curTime;
      if (wasPlaying) {
        audioRef.current.play().catch(console.warn);
      }
    }
  };

  // Simple waveform drawing effect while playing
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const numBars = 36;
      const barWidth = w / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 6;
        if (isPlaying) {
          const wave = Math.sin(phase + (i / numBars) * Math.PI * 4);
          const rand = Math.abs(Math.cos((phase * 1.5) + i));
          barHeight = Math.max(6, (wave * 0.5 + 0.5) * (h * 0.75) * rand + 4);
        }

        const x = i * (barWidth + 2);
        const y = h - barHeight;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, "#F43F5E");
        grad.addColorStop(0.6, "#A855F7");
        grad.addColorStop(1, "#3B82F6");

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      if (isPlaying) phase += 0.08;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  if (!isOpen) return null;

  const selectedSinger = AI_SINGERS.find((s) => s.id === config.singerId) || AI_SINGERS[0];
  const selectedGenre = MUSIC_GENRES.find((g) => g.id === config.genre) || MUSIC_GENRES[0];

  // Start Generation
  const handleStartGenerateCover = async () => {
    if (!lyrics.trim()) {
      if (onNotify) onNotify("Vui lòng nhập hoặc chọn lời bài hát để cover.", "error");
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsGenerating(true);
    setGenerationStep(`Đang hòa âm phong cách ${selectedGenre.name}...`);

    abortControllerRef.current = new AbortController();

    try {
      setTimeout(() => {
        setGenerationStep(
          config.humanVocalMode
            ? `Đang tạo luyến láy, lấy hơi tự nhiên & ngân rung cảm xúc như người thật...`
            : `Đang nạp giọng ca sĩ AI: ${selectedSinger.name}...`
        );
      }, 1200);

      setTimeout(() => {
        setGenerationStep(
          config.autoArrangement
            ? `Đang tự động phối khí đa nhạc cụ (Drums, Bass, Piano, Strings)...`
            : `Đang hoàn thiện âm thanh phòng thu...`
        );
      }, 2500);

      const result = await generateAISongCover(lyrics, config, abortControllerRef.current.signal);
      setGeneratedResult(result);
      setActiveTrack(result.hasArrangement ? "master" : "vocals");
      setIsGenerating(false);

      if (onNotify) {
        onNotify(`Đã tạo thành công bản cover bài hát bằng giọng ${selectedSinger.name}!`, "success");
      }
    } catch (err: any) {
      if (abortControllerRef.current?.signal.aborted) {
        if (onNotify) onNotify("Đã hủy tạo bài hát cover.", "info");
      } else {
        console.error("AI Cover generation error:", err);
        if (onNotify) onNotify(err.message || "Lỗi khi tạo cover bài hát.", "error");
      }
      setIsGenerating(false);
    }
  };

  const handleDownloadAudio = (trackType: "master" | "instrumental" | "vocals" = "master") => {
    if (!generatedResult) return;
    const safeTitle = videoTitle.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 25) || "song";
    let targetBlob = generatedResult.masterBlob;
    let suffix = "master_mix";

    if (trackType === "instrumental") {
      targetBlob = generatedResult.instrumentalBlob;
      suffix = "beat_instrumental";
    } else if (trackType === "vocals") {
      targetBlob = generatedResult.vocalsBlob;
      suffix = "vocals_only";
    }

    const filename = `${safeTitle}_cover_${config.singerId}_${config.genre}_${suffix}.wav`;

    const a = document.createElement("a");
    const blobUrl = URL.createObjectURL(targetBlob);
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    if (onNotify) onNotify(`Đã tải xuống ${filename}`, "success");
  };

  // Find active line in lyrics
  const lyricLines = lyrics.split("\n").filter((l) => l.trim().length > 0);
  const activeLineIndex =
    duration > 0
      ? Math.min(lyricLines.length - 1, Math.floor((currentTime / duration) * lyricLines.length))
      : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="ai-cover-modal-dialog"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Phòng Thu Cover Bài Hát Bằng Giọng AI
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  AI Vocal Singer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chuyển đổi bài hát sang phong cách ca sĩ AI yêu thích với giai điệu mượt mà, tách beat và chỉnh tông
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Choose AI Singer */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>1. Chọn Ca Sĩ AI Hát Cover:</span>
              </label>
              <span className="text-xs text-slate-400">
                Đang chọn: <strong className="text-rose-400">{selectedSinger.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AI_SINGERS.map((singer) => {
                const isSelected = config.singerId === singer.id;
                return (
                  <button
                    key={singer.id}
                    id={`btn-singer-${singer.id}`}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, singerId: singer.id }))}
                    className={`p-3 rounded-2xl border text-left relative transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? "bg-slate-800/90 border-rose-500 ring-2 ring-rose-500/30 shadow-lg"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${singer.color} text-white shadow-md`}
                      >
                        {singer.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs sm:text-sm truncate text-white">
                          {singer.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{singer.style}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {singer.description}
                    </div>

                    {/* Badge */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-rose-300">
                        {singer.badge}
                      </span>
                      {isSelected && (
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Đã chọn
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Music Genre & Vibe */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-white block mb-2">
              2. Phong Cách Hòa Âm & Thể Loại Nhạc:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MUSIC_GENRES.map((genre) => {
                const isSelected = config.genre === genre.id;
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, genre: genre.id as any }))}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-purple-950/50 border-purple-500 text-white font-bold shadow-md shadow-purple-950/30"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-base mb-0.5">{genre.icon}</div>
                    <div className="text-xs font-semibold">{genre.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{genre.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Tự Động Phối Nhạc Nền (Auto Music Arranger) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                <Music className="w-4 h-4 text-rose-400" />
                <span>3. Tự Động Phối Nhạc Nền Đa Nhạc Cụ (Auto Music Arranger)</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                  Phòng Thu Pro
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoArrangement}
                  onChange={(e) => setConfig((prev) => ({ ...prev, autoArrangement: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-rose-500 peer-checked:to-purple-500"></div>
              </label>
            </div>

            {config.autoArrangement ? (
              <div className="space-y-3 pt-1">
                {/* Visual instrumental badge for current genre */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5 text-xs">
                  <span className="text-lg">🎼</span>
                  <div className="flex-1">
                    <span className="font-semibold text-purple-300">Nhạc cụ phối tự động: </span>
                    <span className="text-slate-300">
                      {config.genre === "ballad" && "Grand Piano rải nốt + Dàn dây Strings ấm áp + Trống đệm ballad + Bassline du dương"}
                      {config.genre === "pop" && "Beat Pop/Trap hiện đại + 808 Sub-Bass đập chắc + Synth chords nảy + Hi-hats 16th"}
                      {config.genre === "acoustic" && "Guitar thùng Fingerpicking + Trống mộc Cajon + Shaker lắc + Bass gỗ mộc mạc"}
                      {config.genre === "lofi" && "Rhodes Piano ấm áp + Tiếng mưa & đĩa than Vinyl + Nhịp Boom-Bap thư giãn"}
                      {config.genre === "rock" && "Guitar điện Power Chords Overdrive + Bộ trống Rock mạnh mẽ + Bass điện dồn dập"}
                    </span>
                  </div>
                </div>

                {/* Volume Balance Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-purple-400" />
                        <span>Âm lượng Nhạc Phối (Beat):</span>
                      </span>
                      <span className="font-mono text-purple-400 font-bold">
                        {Math.round(config.instrumentalVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={config.instrumentalVolume}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, instrumentalVolume: parseFloat(e.target.value) }))
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        <span>Âm lượng Giọng Ca Sĩ AI:</span>
                      </span>
                      <span className="font-mono text-rose-400 font-bold">
                        {Math.round(config.vocalVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={config.vocalVolume}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, vocalVolume: parseFloat(e.target.value) }))
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Đang tắt phối nhạc tự động — chỉ xuất giọng hát mộc (A cappella) của ca sĩ AI.
              </p>
            )}
          </div>

          {/* Section 4: Kỹ Thuật Hát Như Người Thật (Human Vocal Performance) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-rose-950/20 to-slate-950 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                <Mic className="w-4 h-4 text-rose-400" />
                <span>4. Hát Sống Động Như Người Thật (Human Vocal & Emotions)</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                  Tự Nhiên
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.humanVocalMode}
                  onChange={(e) => setConfig((prev) => ({ ...prev, humanVocalMode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-rose-500 peer-checked:to-purple-500"></div>
              </label>
            </div>

            {config.humanVocalMode && (
              <div className="space-y-3 pt-1">
                {/* Nuance & Emotion Selector */}
                <div>
                  <div className="text-xs text-slate-300 mb-1.5 font-medium">Sắc thái cảm xúc ca sĩ:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "emotional_ballad", name: "Da Diết & Rung Ngân", icon: "💖", desc: "Vibrato sâu lắng" },
                      { id: "passionate", name: "Cháy Hết Mình", icon: "🔥", desc: "Nội lực cao trào" },
                      { id: "gentle_acoustic", name: "Mộc Mạc & Thì Thầm", icon: "🌿", desc: "Tự sự, êm dịu" },
                      { id: "rnb_flow", name: "Luyến Láy R&B", icon: "🌊", desc: "Melisma bắt tai" },
                    ].map((emo) => {
                      const isSelected = config.vocalEmotion === emo.id;
                      return (
                        <button
                          key={emo.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, vocalEmotion: emo.id as any }))}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-rose-950/60 border-rose-500 text-white shadow-md shadow-rose-950/40"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span>{emo.icon}</span>
                            <span className="truncate">{emo.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{emo.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Natural Breath Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <Wind className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-semibold text-slate-200">Tiếng thở & lấy hơi nhẹ tự nhiên</div>
                      <div className="text-[10px] text-slate-400">
                        Tái tạo hơi thở thật giữa các quãng nghỉ câu hát như ca sĩ phòng thu
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.humanBreathEffect}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, humanBreathEffect: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Studio FX & Pitch / Vocal Reducer */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>5. Tùy Chỉnh Phòng Thu & Hòa Âm (Studio Effects)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Pitch Shift (Key) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Chỉnh tông bài hát (Pitch):</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {config.pitchShift > 0 ? `+${config.pitchShift}` : config.pitchShift} bán âm
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[-2, -1, 0, 1, 2].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, pitchShift: tone }))}
                      className={`flex-1 py-1 text-xs rounded-lg border font-mono transition-colors ${
                        config.pitchShift === tone
                          ? "bg-purple-600 border-purple-400 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {tone > 0 ? `+${tone}` : tone}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Tăng/giảm tông phù hợp quãng giọng ca sĩ AI nam/nữ.
                </p>
              </div>

              {/* Vocal Reducer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Tách nhạc nền (Giảm giọng gốc):</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {Math.round(config.vocalReducerLevel * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.vocalReducerLevel}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, vocalReducerLevel: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-[10px] text-slate-500">
                  Làm mờ giọng ca sĩ gốc để tôn giọng ca sĩ AI Cover.
                </p>
              </div>

              {/* Tempo / Speed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Tốc độ hát (Tempo):</span>
                  <span className="font-mono text-purple-400 font-bold">{config.tempo.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.25"
                  step="0.05"
                  value={config.tempo}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, tempo: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-[10px] text-slate-500">
                  Điều chỉnh nhịp điệu bài hát nhanh hơn hoặc du dương hơn.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Lyrics to Sing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>4. Lời Bài Hát Cần Cover:</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLyrics(formatCuesToSongLyrics(cues))}
                  className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2"
                >
                  Lấy từ Vietsub video ({cues.length} câu)
                </button>
              </div>
            </div>

            <textarea
              id="textarea-cover-lyrics"
              rows={4}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Nhập lời bài hát (mỗi câu một dòng)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/30 resize-y font-sans leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              💡 Bạn có thể sửa lời bài hát, thêm lời Việt mới hoặc dịch lại trước khi bấm tạo cover.
            </p>
          </div>

          {/* Section 5: Generated Cover Player & Karaoke View */}
          {generatedResult && (
            <div
              id="cover-player-container"
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-purple-950/30 border border-purple-500/40 shadow-xl space-y-4 animate-fadeIn"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-rose-500/20 animate-spin-slow">
                    <Disc className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        Bản Cover: {generatedResult.singerName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {selectedGenre.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Đã hòa âm giọng hát AI với hiệu ứng phòng thu chất lượng cao
                    </p>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="flex items-center gap-2">
                  <button
                    id="btn-download-cover-audio"
                    type="button"
                    onClick={handleDownloadAudio}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Audio (.WAV)</span>
                  </button>
                </div>
              </div>

              {/* Visualizer Canvas & Live Karaoke Line */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-3">
                {/* Visualizer bars */}
                <canvas
                  ref={visualizerCanvasRef}
                  width={600}
                  height={50}
                  className="w-full h-12 rounded-lg bg-slate-900/60"
                />

                {/* Karaoke Active Line */}
                <div className="text-center min-h-[48px] flex flex-col items-center justify-center px-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    🎤 Karaoke Lời Bài Hát
                  </span>
                  <p className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-300 to-indigo-300 drop-shadow-md">
                    {lyricLines[activeLineIndex] || "Đang phát bài hát cover..."}
                  </p>
                </div>

                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={generatedResult.audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  onLoadedMetadata={handleTimeUpdate}
                />

                {/* Player Controls Bar */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                  <button
                    id="btn-play-pause-cover"
                    type="button"
                    onClick={togglePlayCover}
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-purple-500 hover:from-rose-400 hover:to-purple-400 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  {/* Scrubber */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 w-9 text-right">
                      {Math.floor(currentTime)}s
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={duration || 10}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <span className="text-[11px] font-mono text-slate-400 w-9">
                      {Math.floor(duration)}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Đóng
          </button>

          <button
            id="btn-confirm-generate-cover"
            type="button"
            onClick={handleStartGenerateCover}
            disabled={isGenerating || !lyrics.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generationStep || "Đang tạo bản cover..."}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Bắt Đầu Cover Bài Hát Bằng AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
