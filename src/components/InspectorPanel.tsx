import React from 'react';
import { SubtitleSegment } from '../types/editor';
import { Sparkles } from 'lucide-react';

interface Props {
  subtitles: SubtitleSegment[];
  setSubtitles: React.Dispatch<React.SetStateAction<SubtitleSegment[]>>;
}

export const InspectorPanel: React.FC<Props> = ({ subtitles, setSubtitles }) => {
  const handleEnhanceVietnamese = async (id: string, currentText: string) => {
    try {
      const res = await fetch('/api/gemini/enhance-vietnamese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setSubtitles((prev) =>
          prev.map((sub) => (sub.id === id ? { ...sub, text: data.enhancedText } : sub))
        );
      }
    } catch (e) {
      alert('Lỗi tối ưu Vietsub!');
    }
  };

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-300 text-xs overflow-y-auto">
      <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-3">Clip & Vietsub Polish</h3>

      <div className="space-y-3">
        {subtitles.map((sub) => (
          <div key={sub.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>{sub.start}s - {sub.end}s</span>
              <button
                onClick={() => handleEnhanceVietnamese(sub.id, sub.text)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <Sparkles size={12} /> AI Polish
              </button>
            </div>
            <input
              type="text"
              value={sub.text}
              onChange={(e) => {
                const val = e.target.value;
                setSubtitles((prev) => prev.map((s) => (s.id === sub.id ? { ...s, text: val } : s)));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        ))}
      </div>
    </aside>
  );
};
