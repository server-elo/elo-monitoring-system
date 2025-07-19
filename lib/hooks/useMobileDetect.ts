import { useState, useEffect } from 'react';

interface MobileDetectResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  deviceType: 'ios' | 'android' | 'windows' | 'mac' | 'other';
  orientation: 'portrait' | 'landscape';
}

export function useMobileDetect(): MobileDetectResult {
  const [result, setResult] = useState<MobileDetectResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'desktop',
    deviceType: 'other',
    orientation: 'landscape'
  });

  useEffect(() => {
    const checkDevice = () => {
      // Check screen width
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Check touch capability
      const isTouchDevice = 
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(any-hover: none)').matches);

      // Detect device type from user agent
      const userAgent = navigator.userAgent.toLowerCase();
      let deviceType: MobileDetectResult['deviceType'] = 'other';
      
      if (/iphone|ipad|ipod/.test(userAgent)) {
        deviceType = 'ios';
      } else if (/android/.test(userAgent)) {
        deviceType = 'android';
      } else if (/windows phone|windows/.test(userAgent)) {
        deviceType = 'windows';
      } else if (/mac/.test(userAgent)) {
        deviceType = 'mac';
      }

      // Check orientation
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

      // Determine screen size category
      let screenSize: MobileDetectResult['screenSize'] = 'desktop';
      if (isMobile) screenSize = 'mobile';
      else if (isTablet) screenSize = 'tablet';

      setResult({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        deviceType,
        orientation
      });
    };

    // Initial check
    checkDevice();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    // Also check on visibility change (for when app comes back to foreground)
    document.addEventListener('visibilitychange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
      document.removeEventListener('visibilitychange', checkDevice);
    };
  }, []);

  return result;
}

// Hook for responsive breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('xl');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else if (width < 1536) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

// Hook for detecting PWA installation
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  };

  return {
    isInstalled,
    isInstallable,
    install
  };
}