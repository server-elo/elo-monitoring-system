import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  enabled?: boolean;
  focusOnMount?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onTab?: (direction: 'forward' | 'backward') => void;
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

  const previousFocusRef = useRef<HTMLElement | null>(null);

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
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }, [containerRef]);

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Focus the next focusable element
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex === -1) {
      focusFirst();
    } else if (currentIndex === focusableElements.length - 1) {
      if (trapFocus) {
        focusFirst();
      }
    } else {
      focusableElements[currentIndex + 1].focus();
    }
  }, [getFocusableElements, focusFirst, trapFocus]);

  // Focus the previous focusable element
  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex === -1) {
      focusLast();
    } else if (currentIndex === 0) {
      if (trapFocus) {
        focusLast();
      }
    } else {
      focusableElements[currentIndex - 1].focus();
    }
  }, [getFocusableElements, focusLast, trapFocus]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;

      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;

      case 'Tab':
        if (trapFocus) {
          event.preventDefault();
          if (event.shiftKey) {
            focusPrevious();
          } else {
            focusNext();
          }
        }
        if (onTab) {
          onTab(event.shiftKey ? 'backward' : 'forward');
        }
        break;

      case 'ArrowUp':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('up');
        }
        break;

      case 'ArrowDown':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('down');
        }
        break;

      case 'ArrowLeft':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('left');
        }
        break;

      case 'ArrowRight':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('right');
        }
        break;

      case 'Home':
        event.preventDefault();
        focusFirst();
        break;

      case 'End':
        event.preventDefault();
        focusLast();
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
      focusFirst();
    }

    // Add keyboard event listener
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore previous focus
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
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
  onClose: () => void
) {
  return useKeyboardNavigation(containerRef, {
    enabled: isOpen,
    focusOnMount: true,
    trapFocus: true,
    restoreFocus: true,
    onEscape: onClose,
    onArrowKeys: (direction) => {
      if (direction === 'up') {
        // Focus previous item
      } else if (direction === 'down') {
        // Focus next item
      }
    }
  });
}

// Hook for managing focus within a form
export function useFormFocus(
  containerRef: React.RefObject<HTMLElement>,
  onSubmit?: () => void
) {
  return useKeyboardNavigation(containerRef, {
    enabled: true,
    onEnter: () => {
      // Submit form if Enter is pressed on a button
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement?.tagName === 'BUTTON' && onSubmit) {
        onSubmit();
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
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }, [containerRef]);

  return useKeyboardNavigation(containerRef, {
    enabled: true,
    onArrowKeys: (direction) => {
      const focusableElements = getFocusableElements();
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (direction) {
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

      if (nextIndex >= 0 && nextIndex < focusableElements.length) {
        focusableElements[nextIndex].focus();
      }
    }
  });
}
