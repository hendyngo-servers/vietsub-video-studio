import React from 'react';
import { VideoClip, AudioClip, SubtitleSegment } from '../types/editor';
import { Play, Pause } from 'lucide-react';

interface Props {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  subtitles: SubtitleSegment[];
}

export const Timeline: React.FC<Props> = ({
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  videoClips,
  audioClips,
  subtitles,
}) => {
  return (
    <div className="h-48 bg-slate-900 border-t border-slate-800 flex flex-col p-3 gap-2">
      <div className="flex items-center gap-4 text-xs text-slate-400 border-b border-slate-800 pb-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-amber-500 text-slate-950 p-1.5 rounded-full hover:bg-amber-400 transition"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <span>
          Time: <strong className="text-white">{currentTime.toFixed(2)}s</strong>
        </span>
      </div>

      <div
        className="flex-1 bg-slate-950 rounded p-2 overflow-x-auto relative border border-slate-800 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          setCurrentTime(Math.max(0, clickX / 20));
        }}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${currentTime * 20}px` }}
        />

        {/* Tracks */}
        <div className="space-y-2 text-xs">
          <div className="h-6 bg-slate-800/80 rounded relative flex items-center px-2 text-amber-300">
            📹 Video Track ({videoClips.length} clips)
          </div>
          <div className="h-6 bg-slate-800/80 rounded relative flex items-center px-2 text-emerald-300">
            🎵 Audio Matrix ({audioClips.length} clips)
          </div>
          <div className="h-6 bg-slate-800/80 rounded relative flex items-center px-2 text-indigo-300">
            💬 Vietsub Track ({subtitles.length} lines)
          </div>
        </div>
      </div>
    </div>
  );
};
