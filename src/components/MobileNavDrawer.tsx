import React from 'react';
import {
  X,
  Sparkles,
  Users,
  Mic,
  Film,
  Zap,
  Cloud,
  Radio,
  Sliders,
  Keyboard,
  Download,
  PlaySquare,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { PlatformInfo } from '../hooks/usePWAInstall';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  platformInfo: PlatformInfo;
  onOpenGenerateModal: () => void;
  onOpenDirectLinkModal: () => void;
  onOpenVoiceoverModal: () => void;
  onOpenCapCutModal: () => void;
  onOpenCoverModal: () => void;
  onOpenCloudflareModal: () => void;
  onOpenExportModal: () => void;
  onOpenSampleVideosModal: () => void;
  onOpenStyleModal: () => void;
  onOpenShortcutsModal: () => void;
  onInstallApp?: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  platformInfo,
  onOpenGenerateModal,
  onOpenDirectLinkModal,
  onOpenVoiceoverModal,
  onOpenCapCutModal,
  onOpenCoverModal,
  onOpenCloudflareModal,
  onOpenExportModal,
  onOpenSampleVideosModal,
  onOpenStyleModal,
  onOpenShortcutsModal,
}) => {
  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Background dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-md max-h-[85vh] bg-slate-900 border-t sm:border border-slate-800 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 z-10">
        {/* Drag Handle & Header */}
        <div className="pt-3 px-4 pb-3 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Menu & Công cụ Studio</h3>
              <p className="text-[11px] text-slate-400">
                Tối ưu cho {platformInfo.osName} ({platformInfo.isMobile ? 'Cảm ứng' : 'Chuột & Phím'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 text-xs">
          {/* Main AI Generator */}
          <button
            type="button"
            onClick={() => handleAction(onOpenGenerateModal)}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-rose-600/30 to-amber-600/30 hover:from-rose-600/50 hover:to-amber-600/50 border border-rose-500/40 text-left flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">Tạo Vietsub AI</div>
                <div className="text-[11px] text-rose-200/80">
                  Dịch thuật điện ảnh, khớp mốc phụ đề siêu chuẩn
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-300" />
          </button>

          {/* Voiceover Nam/Nữ/Già/Trẻ */}
          <button
            type="button"
            onClick={() => handleAction(onOpenVoiceoverModal)}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200">Thuyết Minh Phân Vai AI</div>
                <div className="text-[11px] text-slate-400">
                  Tự nhận diện Nam / Nữ / Già / Trẻ đọc tiếng Việt tự nhiên
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* Direct Screen & Link Capture */}
          <button
            type="button"
            onClick={() => handleAction(onOpenDirectLinkModal)}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-600/30 text-red-300 border border-red-500/40 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200">Dịch Trực Tiếp Link, Web & App</div>
                <div className="text-[11px] text-slate-400">
                  YouTube, TikTok, Facebook Reels, Bilibili, HLS, Quay màn hình
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* CapCut Pro */}
          <button
            type="button"
            onClick={() => handleAction(onOpenCapCutModal)}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200">CapCut & Audio Pro</div>
                <div className="text-[11px] text-slate-400">
                  Preset phụ đề hot TikTok/Reels, Safe Zone & bộ chỉnh âm
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* AI Cover */}
          <button
            type="button"
            onClick={() => handleAction(onOpenCoverModal)}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-600/30 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200">Cover Bài Hát AI</div>
                <div className="text-[11px] text-slate-400">
                  Giọng ca sĩ Sơn Tùng, Diva Ballad, Vũ, R&B...
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* Cloudflare Deploy */}
          <button
            type="button"
            onClick={() => handleAction(onOpenCloudflareModal)}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-600/30 text-orange-300 border border-orange-500/40 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200">Cloudflare Workers AI</div>
                <div className="text-[11px] text-slate-400">
                  MeloTTS, Whisper AI & Hướng dẫn Deploy lên Dash Cloudflare
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* Sample Videos */}
          <button
            type="button"
            onClick={() => handleAction(onOpenSampleVideosModal)}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <PlaySquare className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200">Thư viện Video Mẫu</div>
                <div className="text-[11px] text-slate-400">
                  Steve Jobs, Du lịch Kyoto, Anime Trailer có sẵn phụ đề
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* Quick Subtitle Styler & Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAction(onOpenStyleModal)}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center gap-2 text-slate-300 font-medium"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Chỉnh Font chữ</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(onOpenShortcutsModal)}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center gap-2 text-slate-300 font-medium"
            >
              <Keyboard className="w-4 h-4 text-indigo-400" />
              <span>Phím tắt (?)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleAction(onOpenExportModal)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Video & Phụ đề</span>
          </button>
        </div>
      </div>
    </div>
  );
};
