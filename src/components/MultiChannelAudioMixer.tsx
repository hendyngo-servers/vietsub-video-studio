import React from 'react';
import { AudioClip } from '../types/editor';
import { Volume2 } from 'lucide-react';

interface Props {
  audioClips: AudioClip[];
  setAudioClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
}

const TRACK_NAMES = ['Background Music (BGM)', 'Sound Effects (SFX)', 'AI Voiceover (TTS)', 'Auxiliary Track'];

export const MultiChannelAudioMixer: React.FC<Props> = ({ audioClips, setAudioClips }) => {
  const handleVolumeChange = (trackIndex: number, vol: number) => {
    setAudioClips((prev) =>
      prev.map((clip) => (clip.trackIndex === trackIndex ? { ...clip, volume: vol } : clip))
    );
  };

  return (
    <div className="h-36 bg-slate-900/90 border-t border-slate-800 p-3 grid grid-cols-4 gap-4 text-xs text-slate-300">
      {[0, 1, 2, 3].map((trackIdx) => {
        const trackClips = audioClips.filter((c) => c.trackIndex === trackIdx);
        const currentVol = trackClips[0]?.volume ?? 0.8;

        return (
          <div key={trackIdx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span className="truncate">{TRACK_NAMES[trackIdx]}</span>
              <Volume2 size={14} className="text-amber-400" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={currentVol}
                onChange={(e) => handleVolumeChange(trackIdx, parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="w-8 text-right font-mono text-slate-400">{Math.round(currentVol * 100)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
