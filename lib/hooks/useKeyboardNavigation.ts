import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  enabled?: boolean;
  focusOnMount?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  onEscape?: (_) => void;
  onEnter?: (_) => void;
  onArrowKeys?: (_direction: 'up' | 'down' | 'left' | 'right') => void;
  onTab?: (_direction: 'forward' | 'backward') => void;
}

export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) {
  const {
    enabled = true,
    focusOnMount = false,
    trapFocus = false,
    restoreFocus = false,
    onEscape,
    onEnter,
    onArrowKeys,
    onTab
  } = options;

  const previousFocusRef = useRef<HTMLElement | null>(_null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join( ', ');

    return Array.from(
      containerRef.current.querySelectorAll(_focusableSelectors)
    ) as HTMLElement[];
  }, [containerRef]);

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements(_);
    if (_focusableElements.length > 0) {
      focusableElements[0].focus(_);
    }
  }, [getFocusableElements]);

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements(_);
    if (_focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus(_);
    }
  }, [getFocusableElements]);

  // Focus the next focusable element
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements(_);
    const currentIndex = focusableElements.indexOf(_document.activeElement as HTMLElement);
    
    if (_currentIndex === -1) {
      focusFirst(_);
    } else if (_currentIndex === focusableElements.length - 1) {
      if (trapFocus) {
        focusFirst(_);
      }
    } else {
      focusableElements[currentIndex + 1].focus(_);
    }
  }, [getFocusableElements, focusFirst, trapFocus]);

  // Focus the previous focusable element
  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements(_);
    const currentIndex = focusableElements.indexOf(_document.activeElement as HTMLElement);
    
    if (_currentIndex === -1) {
      focusLast(_);
    } else if (_currentIndex === 0) {
      if (trapFocus) {
        focusLast(_);
      }
    } else {
      focusableElements[currentIndex - 1].focus(_);
    }
  }, [getFocusableElements, focusLast, trapFocus]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    switch (_event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault(_);
          onEscape(_);
        }
        break;

      case 'Enter':
        if (onEnter) {
          event.preventDefault(_);
          onEnter(_);
        }
        break;

      case 'Tab':
        if (trapFocus) {
          event.preventDefault(_);
          if (_event.shiftKey) {
            focusPrevious(_);
          } else {
            focusNext(_);
          }
        }
        if (onTab) {
          onTab(_event.shiftKey ? 'backward' : 'forward');
        }
        break;

      case 'ArrowUp':
        if (onArrowKeys) {
          event.preventDefault(_);
          onArrowKeys('up');
        }
        break;

      case 'ArrowDown':
        if (onArrowKeys) {
          event.preventDefault(_);
          onArrowKeys('down');
        }
        break;

      case 'ArrowLeft':
        if (onArrowKeys) {
          event.preventDefault(_);
          onArrowKeys('left');
        }
        break;

      case 'ArrowRight':
        if (onArrowKeys) {
          event.preventDefault(_);
          onArrowKeys('right');
        }
        break;

      case 'Home':
        event.preventDefault(_);
        focusFirst(_);
        break;

      case 'End':
        event.preventDefault(_);
        focusLast(_);
        break;
    }
  }, [
    enabled,
    containerRef,
    onEscape,
    onEnter,
    onArrowKeys,
    onTab,
    trapFocus,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  ]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Store previous focus for restoration
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Focus first element on mount if requested
    if (focusOnMount) {
      focusFirst(_);
    }

    // Add keyboard event listener
    container.addEventListener( 'keydown', handleKeyDown);

    return (_) => {
      container.removeEventListener( 'keydown', handleKeyDown);
      
      // Restore previous focus
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus(_);
      }
    };
  }, [enabled, containerRef, focusOnMount, restoreFocus, focusFirst, handleKeyDown]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements
  };
}

// Hook for managing focus within a modal or dialog
export function useModalFocus(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement>
) {
  return useKeyboardNavigation(containerRef, {
    enabled: isOpen,
    focusOnMount: true,
    trapFocus: true,
    restoreFocus: true
  });
}

// Hook for managing focus within a dropdown menu
export function useDropdownFocus(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement>,
  onClose: (_) => void
) {
  return useKeyboardNavigation(containerRef, {
    enabled: isOpen,
    focusOnMount: true,
    trapFocus: true,
    restoreFocus: true,
    onEscape: onClose,
    onArrowKeys: (_direction) => {
      if (_direction === 'up') {
        // Focus previous item
      } else if (_direction === 'down') {
        // Focus next item
      }
    }
  });
}

// Hook for managing focus within a form
export function useFormFocus(
  containerRef: React.RefObject<HTMLElement>,
  onSubmit?: (_) => void
) {
  return useKeyboardNavigation(containerRef, {
    enabled: true,
    onEnter: (_) => {
      // Submit form if Enter is pressed on a button
      const activeElement = document.activeElement as HTMLElement;
      if (_activeElement?.tagName === 'BUTTON' && onSubmit) {
        onSubmit(_);
      }
    }
  });
}

// Hook for managing focus within a grid or list
export function useGridFocus(
  containerRef: React.RefObject<HTMLElement>,
  columns: number = 1
) {
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join( ', ');

    return Array.from(
      containerRef.current.querySelectorAll(_focusableSelectors)
    ) as HTMLElement[];
  }, [containerRef]);

  return useKeyboardNavigation(containerRef, {
    enabled: true,
    onArrowKeys: (_direction) => {
      const focusableElements = getFocusableElements(_);
      const currentIndex = focusableElements.indexOf(_document.activeElement as HTMLElement);
      
      if (_currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (_direction) {
        case 'up':
          nextIndex = currentIndex - columns;
          break;
        case 'down':
          nextIndex = currentIndex + columns;
          break;
        case 'left':
          nextIndex = currentIndex - 1;
          break;
        case 'right':
          nextIndex = currentIndex + 1;
          break;
      }

      if (_nextIndex >= 0 && nextIndex < focusableElements.length) {
        focusableElements[nextIndex].focus(_);
      }
    }
  });
}
