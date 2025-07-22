/**;
 * Media Query Hook
 *
 * React hook for responsive design that listens to media query changes
 * and returns whether the query matches.
 *
 * @module hooks/useMediaQuery
 */
import { useState, useEffect } from 'react'
/**
 * Hook that returns true if the given media query matches
 *
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid SSR hydration mismatch
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') {
      return
    }
    // Create media query list
    const mediaQuery = window.matchMedia(query)
    // Set initial value
    setMatches(mediaQuery.matches)
    // Define listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    // Add listener
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(listener)
    }
    // Cleanup
    return () => {
      // Modern browsers
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener)
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(listener)
      }
    }
  }, [query])
  return matches
}
/**
 * Preset media queries for common breakpoints
 */
export const mediaQueries = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  // Tailwind CSS breakpoints
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  // Features
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  highContrast: '(prefers-contrast: high)',
  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
} as const
/**
 * Hook that returns common device type checks
 */
export function useDeviceType(): void {
  const isMobile = useMediaQuery(mediaQueries.mobile)
  const isTablet = useMediaQuery(mediaQueries.tablet)
  const isDesktop = useMediaQuery(mediaQueries.desktop)
  const hasTouch = useMediaQuery(mediaQueries.touch)
  const hasHover = useMediaQuery(mediaQueries.hover)
  const prefersReducedMotion = useMediaQuery(mediaQueries.reducedMotion)
  const prefersDarkMode = useMediaQuery(mediaQueries.darkMode)
  const isPortrait = useMediaQuery(mediaQueries.portrait)
  const isLandscape = useMediaQuery(mediaQueries.landscape)
  return {
    isMobile,
    isTablet,
    isDesktop,
    hasTouch,
    hasHover,
    prefersReducedMotion,
    prefersDarkMode,
    isPortrait,
    isLandscape,
    // Computed properties
    isTouchDevice: hasTouch && !hasHover,
    isDesktopOrTablet: isDesktop || isTablet,
  }
}
