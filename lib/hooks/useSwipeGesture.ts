import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: (_) => void;
  onSwipeRight?: (_) => void;
  onSwipeUp?: (_) => void;
  onSwipeDown?: (_) => void;
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

export function useSwipeGesture(_options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false
  } = options;

  const touchStartRef = useRef<{ x: number; y: number } | null>(_null);
  const elementRef = useRef<HTMLElement | null>(_null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (_e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchMove = (_e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault(_);
      }
    };

    const handleTouchEnd = (_e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const absDeltaX = Math.abs(_deltaX);
      const absDeltaY = Math.abs(_deltaY);

      // Determine if this is a horizontal or vertical swipe
      if (_absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (_absDeltaX > threshold) {
          if (_deltaX > 0) {
            onSwipeRight?.(_);
          } else {
            onSwipeLeft?.(_);
          }
        }
      } else {
        // Vertical swipe
        if (_absDeltaY > threshold) {
          if (_deltaY > 0) {
            onSwipeDown?.(_);
          } else {
            onSwipeUp?.(_);
          }
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener( 'touchstart', handleTouchStart, { passive: true });
    element.addEventListener( 'touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener( 'touchend', handleTouchEnd, { passive: true });

    return (_) => {
      element.removeEventListener( 'touchstart', handleTouchStart);
      element.removeEventListener( 'touchmove', handleTouchMove);
      element.removeEventListener( 'touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventDefaultTouchmoveEvent]);

  return elementRef;
}

// Hook for detecting outside clicks/taps (_useful for closing mobile menus)
export function useOutsideClick(_callback: () => void) {
  const ref = useRef<HTMLElement | null>(_null);

  useEffect(() => {
    const handleClick = (_event: MouseEvent | TouchEvent) => {
      if (_ref.current && !ref.current.contains(event.target as Node)) {
        callback(_);
      }
    };

    document.addEventListener( 'mousedown', handleClick);
    document.addEventListener( 'touchstart', handleClick);

    return (_) => {
      document.removeEventListener( 'mousedown', handleClick);
      document.removeEventListener( 'touchstart', handleClick);
    };
  }, [callback]);

  return ref;
}

// Hook for handling keyboard navigation in mobile menus
export function useKeyboardNavigation(
  isOpen: boolean,
  onClose: (_) => void,
  itemCount: number
) {
  const currentIndexRef = useRef(_-1);

  useEffect(() => {
    if (!isOpen) {
      currentIndexRef.current = -1;
      return;
    }

    const handleKeyDown = (_e: KeyboardEvent) => {
      switch (_e.key) {
        case 'Escape':
          onClose(_);
          break;
        case 'ArrowDown':
          e.preventDefault(_);
          currentIndexRef.current = Math.min(currentIndexRef.current + 1, itemCount - 1);
          // Focus the current item
          const nextItem = document.querySelector(_`[data-nav-index="${currentIndexRef.current}"]`) as HTMLElement;
          nextItem?.focus(_);
          break;
        case 'ArrowUp':
          e.preventDefault(_);
          currentIndexRef.current = Math.max(currentIndexRef.current - 1, 0);
          // Focus the current item
          const prevItem = document.querySelector(_`[data-nav-index="${currentIndexRef.current}"]`) as HTMLElement;
          prevItem?.focus(_);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault(_);
          const currentItem = document.querySelector(_`[data-nav-index="${currentIndexRef.current}"]`) as HTMLElement;
          currentItem?.click(_);
          break;
      }
    };

    document.addEventListener( 'keydown', handleKeyDown);

    return (_) => {
      document.removeEventListener( 'keydown', handleKeyDown);
    };
  }, [isOpen, onClose, itemCount]);

  return currentIndexRef;
}
