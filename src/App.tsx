import React, { useState, useEffect } from 'react';
import { VideoClip, AudioClip, SubtitleSegment, AspectRatio } from './types/editor';
import { Header } from './components/Header';
import { AssetSidebar } from './components/AssetSidebar';
import { CanvasPreview } from './components/CanvasPreview';
import { InspectorPanel } from './components/InspectorPanel';
import { Timeline } from './components/Timeline';
import { MultiChannelAudioMixer } from './components/MultiChannelAudioMixer';
import { AiVideoCreationModal } from './components/AiVideoCreationModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([
    { id: '1', start: 0, end: 4, text: 'Chào mừng bạn đến với Vietsub Video Studio' },
  ]);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Timeline Playback Loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden font-sans select-none">
      <Header
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <AssetSidebar
          setVideoClips={setVideoClips}
          setAudioClips={setAudioClips}
          setSubtitles={setSubtitles}
        />

        <CanvasPreview
          currentTime={currentTime}
          videoClips={videoClips}
          subtitles={subtitles}
          aspectRatio={aspectRatio}
        />

        <InspectorPanel subtitles={subtitles} setSubtitles={setSubtitles} />
      </div>

      <Timeline
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        videoClips={videoClips}
        audioClips={audioClips}
        subtitles={subtitles}
      />

      <MultiChannelAudioMixer audioClips={audioClips} setAudioClips={setAudioClips} />

      <AiVideoCreationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onScriptGenerated={(script) => {
          if (script.scenes) {
            const newSubs = script.scenes.map((scene: any, idx: number) => ({
              id: Date.now().toString() + idx,
              start: idx * 4,
              end: (idx + 1) * 4,
              text: scene.audio || scene.visual,
            }));
            setSubtitles(newSubs);
          }
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        subtitles={subtitles}
      />
    </div>
  );
}
