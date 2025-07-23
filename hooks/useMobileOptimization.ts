import { useState, useEffect } from 'react';

export interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  orientation: 'portrait' | 'landscape';
}

export const useMobileOptimization = (): MobileState => {
  const [state, setState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    orientation: 'portrait',
  });

  useEffect(() => {
    const checkDevice = (): void => {
      const width = window.innerWidth;
      setState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        orientation: window.innerWidth < window.innerHeight ? 'portrait' : 'landscape',
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return state;
};