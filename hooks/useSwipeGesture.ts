/**
 * Hook for handling swipe gestures on touch devices
 * Supports horizontal and vertical swipes with customizable thresholds
 */
'use client';

import { useEffect, useRef } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface UseSwipeGestureOptions {
  threshold?: number;
  preventScrollOnSwipe?: boolean;
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  handlers: SwipeHandlers,
  options: UseSwipeGestureOptions = {}
) {
  const touchStartRef = useRef<TouchPosition | null>(null);
  const touchEndRef = useRef<TouchPosition | null>(null);
  const { threshold = 50, preventScrollOnSwipe = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let isSwipeIntent = false;

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };
      touchEndRef.current = null;
      isSwipeIntent = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      touchEndRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };

      // Check if this is a swipe intent (moved more than 10px)
      const distanceX = Math.abs(touchStartRef.current.x - touchEndRef.current.x);
      const distanceY = Math.abs(touchStartRef.current.y - touchEndRef.current.y);
      
      if (distanceX > 10 || distanceY > 10) {
        isSwipeIntent = true;
      }

      // Prevent scrolling if this is a horizontal swipe
      if (preventScrollOnSwipe && isSwipeIntent && distanceX > distanceY) {
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;

      const distanceX = touchStartRef.current.x - touchEndRef.current.x;
      const distanceY = touchStartRef.current.y - touchEndRef.current.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

      // Horizontal swipes
      if (isHorizontalSwipe && Math.abs(distanceX) > threshold) {
        if (distanceX > 0) {
          handlers.onSwipeLeft?.();
        } else {
          handlers.onSwipeRight?.();
        }
      }
      
      // Vertical swipes
      else if (!isHorizontalSwipe && Math.abs(distanceY) > threshold) {
        if (distanceY > 0) {
          handlers.onSwipeUp?.();
        } else {
          handlers.onSwipeDown?.();
        }
      }

      // Reset
      touchStartRef.current = null;
      touchEndRef.current = null;
    };

    element.addEventListener('touchstart', onTouchStart, { passive: !preventScrollOnSwipe });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventScrollOnSwipe });
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [elementRef, handlers, threshold, preventScrollOnSwipe]);
}

interface UseEdgeSwipeOptions {
  edgeThreshold?: number;
  swipeThreshold?: number;
  preventScrollOnSwipe?: boolean;
}

interface EdgeSwipeHandlers {
  onEdgeSwipeLeft?: () => void;
  onEdgeSwipeRight?: () => void;
}

/**
 * Hook for handling edge swipes - swipes that start from the edge of the screen
 * Useful for navigation drawers and mobile interfaces
 */
export function useEdgeSwipe(
  elementRef: React.RefObject<HTMLElement>,
  handlers: EdgeSwipeHandlers,
  options: UseEdgeSwipeOptions = {}
) {
  const touchStartRef = useRef<TouchPosition | null>(null);
  const touchEndRef = useRef<TouchPosition | null>(null);
  const { edgeThreshold = 20, swipeThreshold = 100, preventScrollOnSwipe = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.targetTouches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
      touchEndRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      touchEndRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };

      // Prevent scrolling during edge swipe
      if (preventScrollOnSwipe) {
        const distanceX = Math.abs(touchStartRef.current.x - touchEndRef.current.x);
        const distanceY = Math.abs(touchStartRef.current.y - touchEndRef.current.y);
        
        if (distanceX > distanceY && distanceX > 10) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;

      const startX = touchStartRef.current.x;
      const endX = touchEndRef.current.x;
      const distanceX = endX - startX;
      const elementWidth = element.getBoundingClientRect().width;

      // Check if the swipe started from the edge
      const startedFromLeftEdge = startX <= edgeThreshold;
      const startedFromRightEdge = startX >= (elementWidth - edgeThreshold);

      // Check if the swipe was long enough
      if (Math.abs(distanceX) > swipeThreshold) {
        if (startedFromLeftEdge && distanceX > 0) {
          handlers.onEdgeSwipeRight?.();
        } else if (startedFromRightEdge && distanceX < 0) {
          handlers.onEdgeSwipeLeft?.();
        }
      }

      // Reset
      touchStartRef.current = null;
      touchEndRef.current = null;
    };

    element.addEventListener('touchstart', onTouchStart, { passive: !preventScrollOnSwipe });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventScrollOnSwipe });
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [elementRef, handlers, edgeThreshold, swipeThreshold, preventScrollOnSwipe]);
}