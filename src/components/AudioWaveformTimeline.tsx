import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Volume2,
  Clock,
  Sparkles,
  Scissors,
  Plus,
  Play,
  Pause,
  Sliders,
} from "lucide-react";
import { SubtitleCue } from "../types";

interface AudioWaveformTimelineProps {
  videoUrl: string;
  cues: SubtitleCue[];
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onUpdateCue: (updated: SubtitleCue) => void;
  onAddCue?: (atTime: number) => void;
  onSmartSplitCue?: (cueId: number) => void;
  isPlaying?: boolean;
}

export const AudioWaveformTimeline: React.FC<AudioWaveformTimelineProps> = ({
  videoUrl,
  cues,
  currentTime,
  duration,
  onSeek,
  onUpdateCue,
  onAddCue,
  onSmartSplitCue,
  isPlaying = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom level: 1x (fits whole duration), 2x, 4x, 8x
  const [zoom, setZoom] = useState<number>(1);
  const [isExtractingWaveform, setIsExtractingWaveform] = useState(false);
  const [wavePeaks, setWavePeaks] = useState<number[]>([]);

  // Active dragged cue edge: cueId and edge ('start' | 'end' | 'move')
  const [dragging, setDragging] = useState<{
    cueId: number;
    edge: "start" | "end" | "move";
    startX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const [hoveredCueId, setHoveredCueId] = useState<number | null>(null);

  // Extract or generate audio waveform peaks
  useEffect(() => {
    let isCancelled = false;

    const extractAudioPeaks = async () => {
      if (!videoUrl) return;
      setIsExtractingWaveform(true);

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(videoUrl);
        const arrayBuffer = await response.arrayBuffer();

        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        const channelData = audioBuffer.getChannelData(0);
        const totalSamples = 300; // Number of peak bars across the track
        const blockSize = Math.floor(channelData.length / totalSamples);
        const peaks: number[] = [];

        for (let i = 0; i < totalSamples; i++) {
          let sum = 0;
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channelData.length);
          for (let j = start; j < end; j += 4) {
            sum += Math.abs(channelData[j]);
          }
          const avg = sum / ((end - start) / 4);
          peaks.push(Math.min(1, avg * 2.8));
        }

        setWavePeaks(peaks);
        audioCtx.close().catch(console.warn);
      } catch (err) {
        // Fallback procedural waveform peaks if decoding media fails
        console.warn("AudioContext decode fallback:", err);
        const pseudoPeaks: number[] = [];
        for (let i = 0; i < 300; i++) {
          const t = i / 300;
          // Create musical speech cadence simulation with natural rises and speech rhythm
          const wave =
            Math.sin(t * 40) * 0.35 +
            Math.sin(t * 12) * 0.25 +
            Math.cos(t * 80) * 0.15 +
            0.35;
          pseudoPeaks.push(Math.max(0.08, Math.min(0.95, wave)));
        }
        setWavePeaks(pseudoPeaks);
      } finally {
        if (!isCancelled) setIsExtractingWaveform(false);
      }
    };

    extractAudioPeaks();
    return () => {
      isCancelled = true;
    };
  }, [videoUrl]);

  // Total width of the timeline canvas based on zoom
  const effectiveDuration = duration > 0 ? duration : 30;

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Timeline background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#090d16");
    bgGrad.addColorStop(1, "#040711");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal center grid line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Time progress boundary
    const playheadX = (currentTime / effectiveDuration) * width;

    // Draw waveform bars
    const peaks = wavePeaks.length > 0 ? wavePeaks : Array(150).fill(0.2);
    const numBars = peaks.length;
    const barWidth = width / numBars;

    for (let i = 0; i < numBars; i++) {
      const x = i * barWidth;
      const peak = peaks[i];
      const barHeight = Math.max(4, peak * (height - 24));
      const y = (height - barHeight) / 2;

      // Color before playhead: vibrant rose/amber
      // Color after playhead: slate/indigo
      if (x < playheadX) {
        const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        barGrad.addColorStop(0, "#f43f5e");
        barGrad.addColorStop(0.5, "#fb7185");
        barGrad.addColorStop(1, "#fbbf24");
        ctx.fillStyle = barGrad;
      } else {
        const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        barGrad.addColorStop(0, "#6366f1");
        barGrad.addColorStop(0.5, "#4338ca");
        barGrad.addColorStop(1, "#312e81");
        ctx.fillStyle = barGrad;
      }

      ctx.beginPath();
      ctx.roundRect(x + 1, y, Math.max(1.5, barWidth - 1.5), barHeight, 2);
      ctx.fill();
    }

    // Draw seconds tick marks on timeline top
    const tickInterval = zoom >= 4 ? 1 : zoom >= 2 ? 2 : 5;
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.font = "9px monospace";

    for (let sec = 0; sec <= effectiveDuration; sec += tickInterval) {
      const secX = (sec / effectiveDuration) * width;
      ctx.fillRect(secX, 0, 1, 6);
      const mins = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      const label = `${mins}:${s < 10 ? "0" : ""}${s}`;
      ctx.fillText(label, secX + 3, 9);
    }
  }, [wavePeaks, currentTime, effectiveDuration, zoom]);

  // Handle clicking or scrubbing on timeline
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = pct * effectiveDuration;
    onSeek(targetSeconds);
  };

  // Dragging Cue Handles to resize start/end or move
  const handleStartDrag = (
    e: React.MouseEvent,
    cue: SubtitleCue,
    edge: "start" | "end" | "move"
  ) => {
    e.stopPropagation();
    setDragging({
      cueId: cue.id,
      edge,
      startX: e.clientX,
      initialStart: cue.start,
      initialEnd: cue.end,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragging.startX;
      const deltaSeconds = (deltaX / rect.width) * effectiveDuration;

      const targetCue = cues.find((c) => c.id === dragging.cueId);
      if (!targetCue) return;

      if (dragging.edge === "start") {
        const newStart = Math.max(0, Math.min(targetCue.end - 0.2, dragging.initialStart + deltaSeconds));
        onUpdateCue({
          ...targetCue,
          start: Number(newStart.toFixed(2)),
          startTime: `00:00:${Math.floor(newStart)}.${Math.round((newStart % 1) * 1000)}`,
        });
      } else if (dragging.edge === "end") {
        const newEnd = Math.min(
          effectiveDuration,
          Math.max(targetCue.start + 0.2, dragging.initialEnd + deltaSeconds)
        );
        onUpdateCue({
          ...targetCue,
          end: Number(newEnd.toFixed(2)),
          endTime: `00:00:${Math.floor(newEnd)}.${Math.round((newEnd % 1) * 1000)}`,
        });
      } else if (dragging.edge === "move") {
        const durationLength = dragging.initialEnd - dragging.initialStart;
        const newStart = Math.max(
          0,
          Math.min(effectiveDuration - durationLength, dragging.initialStart + deltaSeconds)
        );
        const newEnd = newStart + durationLength;
        onUpdateCue({
          ...targetCue,
          start: Number(newStart.toFixed(2)),
          end: Number(newEnd.toFixed(2)),
          startTime: `00:00:${Math.floor(newStart)}.${Math.round((newStart % 1) * 1000)}`,
          endTime: `00:00:${Math.floor(newEnd)}.${Math.round((newEnd % 1) * 1000)}`,
        });
      }
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(null);
      }
    };

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, cues, effectiveDuration, onUpdateCue]);

  // Active cue being played
  const activeCue = useMemo(
    () => cues.find((c) => currentTime >= c.start && currentTime <= c.end),
    [cues, currentTime]
  );

  return (
    <div
      id="audio-waveform-timeline"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-xl select-none"
    >
      {/* Top Waveform Header Bar */}
      <div className="flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-200">Dải Sóng Âm Thanh (Audio Waveform)</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60 hidden sm:inline-block">
            Căn chỉnh phụ đề chuẩn nhịp
          </span>
          {isExtractingWaveform && (
            <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Đang giải mã sóng âm...
            </span>
          )}
        </div>

        {/* Zoom & Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setZoom(1)}
              className={`px-2 py-0.5 rounded ${
                zoom === 1 ? "bg-rose-500/20 text-rose-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
              title="Vừa khung hình 1x"
            >
              1x
            </button>
            <button
              onClick={() => setZoom(2)}
              className={`px-2 py-0.5 rounded ${
                zoom === 2 ? "bg-rose-500/20 text-rose-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
              title="Phóng to 2x"
            >
              2x
            </button>
            <button
              onClick={() => setZoom(4)}
              className={`px-2 py-0.5 rounded ${
                zoom === 4 ? "bg-rose-500/20 text-rose-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
              title="Phóng to 4x (Soi từng nốt / từng từ)"
            >
              4x
            </button>
          </div>

          {onSmartSplitCue && activeCue && (
            <button
              id="btn-timeline-smart-split"
              onClick={() => onSmartSplitCue(activeCue.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold border border-rose-500/50 shadow-sm transition-all"
              title={`Tách câu #${activeCue.id} theo nhịp nói tự nhiên (Smart Split)`}
            >
              <Scissors className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Tách câu #{activeCue.id}</span>
            </button>
          )}

          {onAddCue && (
            <button
              onClick={() => onAddCue(currentTime)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-all"
              title="Thêm phụ đề ngay tại thời điểm đang phát"
            >
              <Plus className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Thêm tại mốc</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Waveform Scroll Container */}
      <div
        className="relative overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/60 pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        <div
          ref={containerRef}
          onClick={handleTimelineClick}
          className="relative h-24 cursor-pointer"
          style={{ width: `${zoom * 100}%`, minWidth: "100%" }}
        >
          {/* Waveform Canvas */}
          <canvas
            ref={canvasRef}
            width={1200 * zoom}
            height={96}
            className="w-full h-full block"
          />

          {/* Subtitle Cue Overlay Blocks */}
          <div className="absolute inset-0 pointer-events-none">
            {cues.map((cue) => {
              const startPct = (cue.start / effectiveDuration) * 100;
              const widthPct = Math.max(0.8, ((cue.end - cue.start) / effectiveDuration) * 100);
              const isActive = activeCue?.id === cue.id;
              const isHovered = hoveredCueId === cue.id;

              return (
                <div
                  key={cue.id}
                  onMouseEnter={() => setHoveredCueId(cue.id)}
                  onMouseLeave={() => setHoveredCueId(null)}
                  className={`absolute top-5 bottom-1 rounded-md border pointer-events-auto transition-all ${
                    isActive
                      ? "bg-rose-500/30 border-rose-400 shadow-md shadow-rose-950/50 ring-1 ring-rose-400 z-10"
                      : isHovered
                      ? "bg-purple-600/30 border-purple-400 z-5"
                      : "bg-purple-900/25 border-purple-600/40 hover:border-purple-400"
                  }`}
                  style={{
                    left: `${startPct}%`,
                    width: `${widthPct}%`,
                  }}
                  title={`[#${cue.id}] ${cue.start.toFixed(2)}s - ${cue.end.toFixed(2)}s: ${
                    cue.textVi || cue.textOriginal
                  }`}
                >
                  {/* Left Resizing Drag Handle */}
                  <div
                    onMouseDown={(e) => handleStartDrag(e, cue, "start")}
                    className="absolute left-0 top-0 bottom-0 w-2 hover:w-3 cursor-ew-resize bg-rose-500/50 hover:bg-rose-400 rounded-l transition-all z-20"
                    title="Kéo để chỉnh mốc Bắt Đầu"
                  />

                  {/* Center Drag to move */}
                  <div
                    onMouseDown={(e) => handleStartDrag(e, cue, "move")}
                    className="absolute inset-x-2 top-0 bottom-0 cursor-grab active:cursor-grabbing flex items-center px-1 overflow-hidden"
                  >
                    <span className="text-[10px] text-white font-semibold truncate leading-tight drop-shadow-md select-none">
                      #{cue.id}: {cue.textVi}
                    </span>
                  </div>

                  {/* Right Resizing Drag Handle */}
                  <div
                    onMouseDown={(e) => handleStartDrag(e, cue, "end")}
                    className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 cursor-ew-resize bg-rose-500/50 hover:bg-rose-400 rounded-r transition-all z-20"
                    title="Kéo để chỉnh mốc Kết Thúc"
                  />
                </div>
              );
            })}
          </div>

          {/* Current Time Playhead Scrubber */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 transition-none"
            style={{
              left: `${(currentTime / effectiveDuration) * 100}%`,
            }}
          >
            <div className="w-0.5 h-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,1)] relative">
              <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-rose-500 rounded-full border border-white shadow flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
              <div className="absolute top-8 left-1.5 bg-rose-950/90 text-rose-200 text-[10px] font-mono px-1 py-0.2 rounded border border-rose-500/40 whitespace-nowrap shadow-sm pointer-events-none">
                {currentTime.toFixed(2)}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Visualizer Tip & Beat Markers */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span>Đoạn đã phát</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80 inline-block"></span>
            <span>Âm thanh sắp tới</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/60 inline-block border border-purple-400"></span>
            <span>Khối phụ đề</span>
          </span>
        </div>

        <div className="text-slate-400 flex items-center gap-1 text-[10px]">
          <Scissors className="w-3 h-3 text-rose-400" />
          <span>Kéo 2 đầu khối phụ đề trên sóng âm để khớp chuẩn từng từ và nhịp điệu!</span>
        </div>
      </div>
    </div>
  );
};
