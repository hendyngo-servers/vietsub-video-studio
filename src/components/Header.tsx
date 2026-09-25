import React from 'react';
import { AspectRatio } from '../types/editor';
import { Monitor, Smartphone, Square, Sparkles, Download } from 'lucide-react';

interface Props {
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  onOpenAiModal: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<Props> = ({ aspectRatio, setAspectRatio, onOpenAiModal, onOpenExportModal }) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white">
      <div className="flex items-center gap-2 font-bold text-lg text-amber-400">
        🎬 Vietsub Video Studio
      </div>

      <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
        <button
          onClick={() => setAspectRatio('16:9')}
          className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${aspectRatio === '16:9' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
        >
          <Monitor size={14} /> 16:9
        </button>
        <button
          onClick={() => setAspectRatio('9:16')}
          className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${aspectRatio === '9:16' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
        >
          <Smartphone size={14} /> 9:16
        </button>
        <button
          onClick={() => setAspectRatio('1:1')}
          className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${aspectRatio === '1:1' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
        >
          <Square size={14} /> 1:1
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAiModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition"
        >
          <Sparkles size={16} /> AI Studio
        </button>
        <button
          onClick={onOpenExportModal}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition"
        >
          <Download size={16} /> Export
        </button>
      </div>
    </header>
  );
};
