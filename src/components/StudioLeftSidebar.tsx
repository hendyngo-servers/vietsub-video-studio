import React from "react";
import {
  Film,
  ListOrdered,
  Sparkles,
  Globe,
  Mic2,
  Sliders,
  Scissors,
  Download,
  Smartphone,
  Keyboard,
  Cloud,
  Image as ImageIcon,
  FolderOpen,
} from "lucide-react";

interface StudioLeftSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenFilePicker: () => void;
  onOpenVoiceoverModal: () => void;
  onOpenStyleModal: () => void;
  onOpenCapCutModal: () => void;
  onOpenCoverModal: () => void;
  onOpenExportModal: () => void;
  onOpenAppsHub: () => void;
  onOpenShortcuts: () => void;
  onOpenCloudflare: () => void;
}

export const StudioLeftSidebar: React.FC<StudioLeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenFilePicker,
  onOpenVoiceoverModal,
  onOpenStyleModal,
  onOpenCapCutModal,
  onOpenCoverModal,
  onOpenExportModal,
  onOpenAppsHub,
  onOpenShortcuts,
  onOpenCloudflare,
}) => {
  return (
    <aside
      className="bg-[#080d1a] border-r border-slate-800/80 flex flex-col items-center py-3 select-none z-20 shrink-0 justify-between h-full"
      style={{ width: "var(--sidebar-width, 60px)" }}
    >
      {/* Top Tools Group */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Open video file */}
        <button
          type="button"
          onClick={onOpenFilePicker}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-800 transition-all hover:scale-105 group relative"
          title="Chọn video từ máy (Mở file)"
        >
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Mở video
          </span>
        </button>

        <div className="w-8 h-px bg-slate-800 my-1" />

        {/* Phụ đề */}
        <button
          type="button"
          onClick={() => onSelectTab("subtitles")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
            activeTab === "subtitles"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-bold"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title="Danh sách phụ đề"
        >
          <ListOrdered className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Phụ đề
          </span>
        </button>

        {/* Công cụ AI */}
        <button
          type="button"
          onClick={() => onSelectTab("ai_tools")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
            activeTab === "ai_tools"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title="Công cụ AI (Tách câu, Tối ưu, Dọn mốc)"
        >
          <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Công cụ AI
          </span>
        </button>

        {/* Dịch AI */}
        <button
          type="button"
          onClick={() => onSelectTab("ai_translate")}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
            activeTab === "ai_translate"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title="Dịch thuật AI đa ngôn ngữ"
        >
          <Globe className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Dịch AI
          </span>
        </button>

        {/* Phân vai lồng tiếng */}
        <button
          type="button"
          onClick={onOpenVoiceoverModal}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-all group relative"
          title="Thuyết minh & Lồng tiếng đa giọng đọc"
        >
          <Mic2 className="w-4 h-4 text-purple-400" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Lồng tiếng AI
          </span>
        </button>

        {/* Phong cách phụ đề */}
        <button
          type="button"
          onClick={onOpenStyleModal}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-all group relative"
          title="Tùy chỉnh kiểu chữ & Font phụ đề"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Kiểu chữ phụ đề
          </span>
        </button>

        {/* CapCut preset */}
        <button
          type="button"
          onClick={onOpenCapCutModal}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-all group relative"
          title="CapCut Karaoke Preset"
        >
          <Film className="w-4 h-4 text-emerald-400" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            CapCut Karaoke
          </span>
        </button>

        {/* Ảnh bìa Hook AI */}
        <button
          type="button"
          onClick={onOpenCoverModal}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-all group relative"
          title="Tạo ảnh bìa Hook / Thumbnail AI"
        >
          <ImageIcon className="w-4 h-4 text-pink-400" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Ảnh bìa AI
          </span>
        </button>
      </div>

      {/* Bottom Tools Group */}
      <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-slate-800/80">
        {/* Tải xuống / Xuất file */}
        <button
          type="button"
          onClick={() => {
            onSelectTab("download");
            onOpenExportModal();
          }}
          className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white flex items-center justify-center border border-emerald-500/30 transition-all group relative"
          title="Xuất file phụ đề & Video hardsub"
        >
          <Download className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Tải xuống & Xuất
          </span>
        </button>

        {/* CH Play & App Store Hub */}
        <button
          type="button"
          onClick={onOpenAppsHub}
          className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white flex items-center justify-center border border-indigo-500/30 transition-all group relative"
          title="Cài đặt trên điện thoại CH Play & App Store"
        >
          <Smartphone className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            CH Play & App Store
          </span>
        </button>

        {/* Phím tắt (?) */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all group relative"
          title="Bảng phím tắt (?)"
        >
          <Keyboard className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Phím tắt (?)
          </span>
        </button>

        {/* Cloudflare Edge Settings */}
        <button
          type="button"
          onClick={onOpenCloudflare}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all group relative"
          title="Cloudflare Workers AI Edge"
        >
          <Cloud className="w-4 h-4 text-orange-400" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Cloudflare Edge
          </span>
        </button>
      </div>
    </aside>
  );
};
export default StudioLeftSidebar;
