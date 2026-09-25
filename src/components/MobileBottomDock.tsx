import React from 'react';
import {
  Film,
  ListOrdered,
  Play,
  Pause,
  Plus,
  Sparkles,
  Download,
  Columns,
  Maximize2,
  Sliders,
} from 'lucide-react';
import { WorkspaceTab } from '../hooks/useResponsiveLayout';

interface MobileBottomDockProps {
  activeTab: WorkspaceTab;
  onChangeTab: (tab: WorkspaceTab) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onAddCue: () => void;
  onOpenGenerateModal: () => void;
  onOpenExportModal: () => void;
  cuesCount: number;
  isTablet?: boolean;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  onChangeTab,
  isPlaying,
  onTogglePlay,
  onAddCue,
  onOpenGenerateModal,
  onOpenExportModal,
  cuesCount,
  isTablet = false,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1">
        {/* View Switcher: Video View */}
        <button
          type="button"
          onClick={() => onChangeTab('video')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'video'
              ? 'bg-rose-600/20 text-rose-400 font-bold border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span className="text-[10px] leading-none">Xem Video</span>
        </button>

        {/* View Switcher: Subtitles View */}
        <button
          type="button"
          onClick={() => onChangeTab('subtitles')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all relative ${
            activeTab === 'subtitles'
              ? 'bg-rose-600/20 text-rose-400 font-bold border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span className="text-[10px] leading-none">Phụ đề</span>
          {cuesCount > 0 && (
            <span className="absolute top-1 right-2 text-[9px] px-1 py-0 rounded-full bg-slate-800 text-slate-300 font-mono">
              {cuesCount}
            </span>
          )}
        </button>

        {/* Split View on Tablet */}
        {isTablet && (
          <button
            type="button"
            onClick={() => onChangeTab('split')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'split'
                ? 'bg-rose-600/20 text-rose-400 font-bold border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span className="text-[10px] leading-none">Chia đôi</span>
          </button>
        )}

        {/* Center Primary Action: Play/Pause or Quick Add */}
        <div className="flex items-center gap-1 px-1">
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-transform"
            title={isPlaying ? 'Tạm dừng video' : 'Phát video'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Add Cue Button */}
        <button
          type="button"
          onClick={onAddCue}
          className="flex-1 py-1.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
          title="Thêm phụ đề tại mốc hiện tại"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] leading-none">Thêm câu</span>
        </button>

        {/* Export / Actions Button */}
        <button
          type="button"
          onClick={onOpenExportModal}
          className="flex-1 py-1.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors"
          title="Xuất video & phụ đề"
        >
          <Download className="w-4 h-4 text-teal-400" />
          <span className="text-[10px] leading-none">Xuất Sub</span>
        </button>
      </div>
    </div>
  );
};
