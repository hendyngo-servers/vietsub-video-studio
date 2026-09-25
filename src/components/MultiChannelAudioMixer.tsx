import React, { useState } from "react";
import { Volume2, VolumeX, Sliders, Music, Mic2, Sparkles } from "lucide-react";
import { AudioEditConfig } from "../types";

interface MultiChannelAudioMixerProps {
  audioConfig?: AudioEditConfig;
  onUpdateAudioConfig?: (newConfig: AudioEditConfig) => void;
}

export const MultiChannelAudioMixer: React.FC<MultiChannelAudioMixerProps> = ({
  audioConfig,
  onUpdateAudioConfig,
}) => {
  const [volumes, setVolumes] = useState<number[]>([100, 85, 75, 90]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const channelLabels = [
    { name: "Video Gốc", icon: Music },
    { name: "Lồng tiếng AI", icon: Mic2 },
    { name: "Nhạc nền", icon: Volume2 },
    { name: "Hiệu ứng SFX", icon: Sparkles },
  ];

  const handleVolumeChange = (idx: number, val: number) => {
    setVolumes((prev) => prev.map((v, i) => (i === idx ? val : v)));
    if (idx === 0 && onUpdateAudioConfig && audioConfig) {
      onUpdateAudioConfig({
        ...audioConfig,
        volumeMultiplier: Number((val / 100).toFixed(2)),
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border-t border-slate-800/80 px-3 sm:px-5 py-2.5 flex flex-col gap-2 select-none text-xs transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh (Mute)"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
          <span className="font-semibold text-slate-300 hidden sm:inline">Kênh âm thanh:</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {isMuted ? "Đã tắt tiếng" : `${volumes[0]}%`}
          </span>
        </div>

        {/* Volume tracks horizontal slider list */}
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto py-1 scrollbar-thin">
          {volumes.map((vol, idx) => {
            const ChannelIcon = channelLabels[idx]?.icon || Volume2;
            const label = channelLabels[idx]?.name || `Track ${idx + 1}`;
            return (
              <div key={idx} className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <ChannelIcon className="w-3 h-3 text-indigo-400" />
                  <span className="hidden md:inline">{label}</span>
                  <span className="md:hidden">T{idx + 1}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={isMuted ? 0 : vol}
                  onChange={(e) => handleVolumeChange(idx, Number(e.target.value))}
                  className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400"
                />
                <span className="text-[10px] text-slate-500 w-7 font-mono text-right">
                  {isMuted ? 0 : vol}%
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Mở rộng tùy chỉnh âm thanh"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {isExpanded && audioConfig && onUpdateAudioConfig && (
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={audioConfig.noiseReduction}
              onChange={(e) =>
                onUpdateAudioConfig({ ...audioConfig, noiseReduction: e.target.checked })
              }
              className="rounded accent-rose-500"
            />
            <span>Lọc tiếng ồn (Noise Reduction)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={audioConfig.vocalEnhance}
              onChange={(e) =>
                onUpdateAudioConfig({ ...audioConfig, vocalEnhance: e.target.checked })
              }
              className="rounded accent-rose-500"
            />
            <span>Làm rõ giọng nói (Vocal Boost)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={audioConfig.audioDucking}
              onChange={(e) =>
                onUpdateAudioConfig({ ...audioConfig, audioDucking: e.target.checked })
              }
              className="rounded accent-rose-500"
            />
            <span>Auto Ducking (Tự giảm nhạc khi có giọng nói)</span>
          </label>
        </div>
      )}
    </div>
  );
};
export default MultiChannelAudioMixer;
