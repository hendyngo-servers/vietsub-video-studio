import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PlatformInfo {
  os: 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'unknown';
  osName: string;
  isMobile: boolean;
  modifierKey: 'Cmd' | 'Ctrl';
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined') {
    return { os: 'unknown', osName: 'Trình duyệt', isMobile: false, modifierKey: 'Ctrl' };
  }

  const userAgent = (navigator.userAgent || '').toLowerCase();
  const platform = ((navigator as any).userAgentData?.platform || navigator.platform || '').toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
    return { os: 'ios', osName: 'iOS / iPadOS', isMobile: true, modifierKey: 'Cmd' };
  }
  if (/android/.test(userAgent)) {
    return { os: 'android', osName: 'Android', isMobile: true, modifierKey: 'Ctrl' };
  }
  if (/mac/.test(platform) || /macintosh|mac os x/.test(userAgent)) {
    return { os: 'mac', osName: 'macOS', isMobile: false, modifierKey: 'Cmd' };
  }
  if (/win/.test(platform) || /windows/.test(userAgent)) {
    return { os: 'windows', osName: 'Windows', isMobile: false, modifierKey: 'Ctrl' };
  }
  if (/linux/.test(platform) || /linux/.test(userAgent)) {
    return { os: 'linux', osName: 'Linux', isMobile: false, modifierKey: 'Ctrl' };
  }

  return { os: 'unknown', osName: 'Trình duyệt đa nền tảng', isMobile: false, modifierKey: 'Ctrl' };
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    os: 'unknown',
    osName: 'Web App',
    isMobile: false,
    modifierKey: 'Ctrl',
  });

  useEffect(() => {
    // Detect platform
    const pInfo = detectPlatform();
    setPlatformInfo(pInfo);

    // Detect standalone mode (already installed as PWA or native web app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('PWA install error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS: platformInfo.os === 'ios',
    platformInfo,
    install,
  };
}
