import React, { useEffect, useRef } from 'react';
import { VideoClip, SubtitleSegment, AspectRatio } from '../types/editor';
import { VideoRenderer } from '../utils/videoRenderer';

interface Props {
  currentTime: number;
  videoClips: VideoClip[];
  subtitles: SubtitleSegment[];
  aspectRatio: AspectRatio;
}

export const CanvasPreview: React.FC<Props> = ({ currentTime, videoClips, subtitles, aspectRatio }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const aspectClasses = {
    '16:9': 'w-[640px] h-[360px]',
    '9:16': 'w-[270px] h-[480px]',
    '1:1': 'w-[400px] h-[400px]',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    VideoRenderer.renderFrame(ctx, currentTime, videoClips, subtitles, canvas.width, canvas.height);
  }, [currentTime, videoClips, subtitles, aspectRatio]);

  return (
    <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`relative bg-black rounded-lg overflow-hidden border border-slate-800 shadow-2xl ${aspectClasses[aspectRatio]}`}>
        <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />
      </div>
    </div>
  );
};
