import React from "react";
import { X, Play, Clock, Sparkles } from "lucide-react";
import { SAMPLE_VIDEOS } from "../data/sampleVideos";
import { SampleVideo } from "../types";

interface SampleVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleVideo) => void;
}

export const SampleVideosModal: React.FC<SampleVideosModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="sample-videos-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Video mẫu để thử nghiệm</h3>
              <p className="text-xs text-slate-400">Chọn một video mẫu để trải nghiệm Vietsub ngay lập tức</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Cards list */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[65vh]">
          {SAMPLE_VIDEOS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="group p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-rose-500/60 hover:bg-slate-900/80 cursor-pointer transition-all flex items-start justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-rose-400 transition-colors">
                    {sample.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                    {sample.duration}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {sample.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span>Tác giả: {sample.author}</span>
                  <span>•</span>
                  <span className="text-amber-400/90 font-medium">{sample.language}</span>
                  {sample.initialCues && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400/90">{sample.initialCues.length} câu phụ đề sẵn</span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-rose-600 text-slate-300 group-hover:text-white flex items-center justify-center shrink-0 transition-all shadow-md mt-1">
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
