import React from 'react';
import {
  Monitor,
  Laptop,
  Smartphone,
  Apple,
  Globe,
  Keyboard,
  Sliders,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { PlatformInfo } from '../hooks/usePWAInstall';
import { ResponsiveLayoutState } from '../hooks/useResponsiveLayout';

interface CrossPlatformBarProps {
  platformInfo: PlatformInfo;
  layout: ResponsiveLayoutState;
  onOpenShortcuts: () => void;
  onOpenInstallGuide?: () => void;
}

export const CrossPlatformBar: React.FC<CrossPlatformBarProps> = ({
  platformInfo,
  layout,
  onOpenShortcuts,
}) => {
  const getOSIcon = () => {
    switch (platformInfo.os) {
      case 'mac':
        return <Laptop className="w-3 h-3 text-slate-300" />;
      case 'windows':
        return <Monitor className="w-3 h-3 text-blue-400" />;
      case 'linux':
        return <Laptop className="w-3 h-3 text-amber-400" />;
      case 'android':
        return <Smartphone className="w-3 h-3 text-emerald-400" />;
      case 'ios':
        return <Apple className="w-3 h-3 text-slate-200" />;
      default:
        return <Globe className="w-3 h-3 text-teal-400" />;
    }
  };

  return (
    <div className="hidden sm:flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-900 text-[11px] text-slate-400">
      {/* Left: Cross-Platform System Status */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          {getOSIcon()}
          <span>Hệ điều hành:</span>
          <span className="font-semibold text-white">{platformInfo.osName}</span>
        </div>

        <span className="text-slate-700">&bull;</span>

        <div className="flex items-center gap-1 text-slate-400">
          <span>Giao diện:</span>
          <span className="text-emerald-400 font-mono font-medium">
            {layout.isMobile
              ? 'Điện thoại (Mobile)'
              : layout.isTablet
              ? 'Máy tính bảng (Tablet)'
              : layout.isWide
              ? 'Màn hình rộng (Ultra-Wide)'
              : 'Máy tính để bàn (Desktop)'}
          </span>
          <span className="text-slate-600 font-mono text-[10px]">
            ({layout.width}&times;{layout.height}px)
          </span>
        </div>
      </div>

      {/* Right: Platform-adapted Shortcuts Tip */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Phím tắt {platformInfo.osName}:</span>
          <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-amber-300">
            {platformInfo.modifierKey} + Space
          </span>
          <span className="text-slate-500">Phát/Dừng</span>
          <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-amber-300">
            {platformInfo.modifierKey} + Enter
          </span>
          <span className="text-slate-500">Lưu sub</span>
        </div>

        <button
          type="button"
          onClick={onOpenShortcuts}
          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <Keyboard className="w-3 h-3" />
          <span>Tất cả phím tắt (?)</span>
        </button>
      </div>
    </div>
  );
};
