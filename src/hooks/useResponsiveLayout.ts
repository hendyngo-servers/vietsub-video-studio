import { useEffect, useState } from 'react';

export type ScreenBreakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';
export type WorkspaceTab = 'video' | 'subtitles' | 'split';

export interface ResponsiveLayoutState {
  width: number;
  height: number;
  breakpoint: ScreenBreakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
}

export function useResponsiveLayout(): ResponsiveLayoutState {
  const [layout, setLayout] = useState<ResponsiveLayoutState>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;
    const isDesktop = w >= 1024 && w < 1440;
    const isWide = w >= 1440;
    const breakpoint: ScreenBreakpoint = isMobile
      ? 'mobile'
      : isTablet
      ? 'tablet'
      : isWide
      ? 'wide'
      : 'desktop';
    const isLandscape = w > h;
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    return {
      width: w,
      height: h,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop,
      isWide,
      isLandscape,
      isTouchDevice,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768;
      const isTablet = w >= 768 && w < 1024;
      const isDesktop = w >= 1024 && w < 1440;
      const isWide = w >= 1440;
      const breakpoint: ScreenBreakpoint = isMobile
        ? 'mobile'
        : isTablet
        ? 'tablet'
        : isWide
        ? 'wide'
        : 'desktop';
      const isLandscape = w > h;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setLayout({
        width: w,
        height: h,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        isWide,
        isLandscape,
        isTouchDevice,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return layout;
}
