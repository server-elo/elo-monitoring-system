import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false
  } = options;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if this is a horizontal or vertical swipe
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (absDeltaX > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (absDeltaY > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventDefaultTouchmoveEvent]);

  return elementRef;
}

// Hook for detecting outside clicks/taps (useful for closing mobile menus)
export function useOutsideClick(callback: () => void) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [callback]);

  return ref;
}

// Hook for handling keyboard navigation in mobile menus
export function useKeyboardNavigation(
  isOpen: boolean,
  onClose: () => void,
  itemCount: number
) {
  const currentIndexRef = useRef(-1);

  useEffect(() => {
    if (!isOpen) {
      currentIndexRef.current = -1;
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          currentIndexRef.current = Math.min(currentIndexRef.current + 1, itemCount - 1);
          // Focus the current item
          const nextItem = document.querySelector(`[data-nav-index="${currentIndexRef.current}"]`) as HTMLElement;
          nextItem?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          currentIndexRef.current = Math.max(currentIndexRef.current - 1, 0);
          // Focus the current item
          const prevItem = document.querySelector(`[data-nav-index="${currentIndexRef.current}"]`) as HTMLElement;
          prevItem?.focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const currentItem = document.querySelector(`[data-nav-index="${currentIndexRef.current}"]`) as HTMLElement;
          currentItem?.click();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, itemCount]);

  return currentIndexRef;
}
