import React from 'react';
import { SubtitleExporter } from '../utils/subtitleExporter';
import { AppDownloader } from '../utils/appDownloader';
import { SubtitleSegment } from '../types/editor';
import { X, FileText, Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleSegment[];
}

export const ExportModal: React.FC<Props> = ({ isOpen, onClose, subtitles }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 text-white">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="font-bold text-lg text-amber-400">Xuất Bán & Đóng Gói App</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => SubtitleExporter.downloadFile(SubtitleExporter.toSRT(subtitles), 'vietsub.srt')}
            className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-sm flex items-center justify-between border border-slate-700"
          >
            <span className="flex items-center gap-2"><FileText size={16} className="text-amber-400" /> Xuất File Phụ Đề SRT</span>
            <Download size={16} />
          </button>

          <button
            onClick={() => AppDownloader.downloadNativeBinary('win')}
            className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-sm flex items-center justify-between border border-slate-700"
          >
            <span className="flex items-center gap-2"><Download size={16} className="text-blue-400" /> Tải Bộ Cài Desktop Windows (.exe)</span>
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
