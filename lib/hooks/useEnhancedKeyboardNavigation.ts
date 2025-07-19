import { useEffect, useCallback, useRef } from 'react';
import { announceToScreenReader } from '@/lib/utils/accessibility';

export interface EnhancedKeyboardNavigationOptions {
  enabled?: boolean;
  focusOnMount?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  announceNavigation?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onTab?: (direction: 'forward' | 'backward') => void;
  customSelectors?: string[];
}

export function useEnhancedKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: EnhancedKeyboardNavigationOptions = {}
) {
  const {
    enabled = true,
    focusOnMount = false,
    trapFocus = false,
    restoreFocus = false,
    announceNavigation = false,
    onEscape,
    onEnter,
    onArrowKeys,
    onTab,
    customSelectors = []
  } = options;

  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Default focusable selectors
  const defaultSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="tab"]:not([disabled])'
  ];

  const allSelectors = [...defaultSelectors, ...customSelectors];

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const elements = containerRef.current.querySelectorAll(
      allSelectors.join(', ')
    ) as NodeListOf<HTMLElement>;
    
    return Array.from(elements).filter(element => {
      // Check if element is visible and not hidden
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.offsetParent !== null
      );
    });
  }, [containerRef, allSelectors]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
      if (announceNavigation) {
        announceToScreenReader(`Focused first element: ${elements[0].getAttribute('aria-label') || elements[0].textContent || 'interactive element'}`);
      }
    }
  }, [getFocusableElements, announceNavigation]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      const lastElement = elements[elements.length - 1];
      lastElement.focus();
      if (announceNavigation) {
        announceToScreenReader(`Focused last element: ${lastElement.getAttribute('aria-label') || lastElement.textContent || 'interactive element'}`);
      }
    }
  }, [getFocusableElements, announceNavigation]);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex === -1) {
      focusFirst();
      return;
    }

    const nextIndex = (currentIndex + 1) % elements.length;
    elements[nextIndex].focus();
    
    if (announceNavigation) {
      announceToScreenReader(`Focused next element: ${elements[nextIndex].getAttribute('aria-label') || elements[nextIndex].textContent || 'interactive element'}`);
    }
  }, [getFocusableElements, focusFirst, announceNavigation]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex === -1) {
      focusLast();
      return;
    }

    const prevIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
    elements[prevIndex].focus();
    
    if (announceNavigation) {
      announceToScreenReader(`Focused previous element: ${elements[prevIndex].getAttribute('aria-label') || elements[prevIndex].textContent || 'interactive element'}`);
    }
  }, [getFocusableElements, focusLast, announceNavigation]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

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

// Specialized hooks for common use cases
export function useModalKeyboardNavigation(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement>,
  onClose?: () => void
) {
  return useEnhancedKeyboardNavigation(containerRef, {
    enabled: isOpen,
    focusOnMount: true,
    trapFocus: true,
    restoreFocus: true,
    announceNavigation: true,
    onEscape: onClose
  });
}

export function useDropdownKeyboardNavigation(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement>,
  onClose?: () => void
) {
  return useEnhancedKeyboardNavigation(containerRef, {
    enabled: isOpen,
    focusOnMount: true,
    trapFocus: true,
    restoreFocus: true,
    announceNavigation: true,
    onEscape: onClose,
    onArrowKeys: (direction) => {
      // Handle vertical navigation in dropdowns
      if (direction === 'up' || direction === 'down') {
        const elements = containerRef.current?.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
        if (!elements) return;

        const currentIndex = Array.from(elements).indexOf(document.activeElement as HTMLElement);
        let nextIndex = currentIndex;

        if (direction === 'up') {
          nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= elements.length - 1 ? 0 : currentIndex + 1;
        }

        elements[nextIndex]?.focus();
      }
    }
  });
}

export function useFormKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  onSubmit?: () => void
) {
  return useEnhancedKeyboardNavigation(containerRef, {
    enabled: true,
    announceNavigation: false,
    onEnter: () => {
      // Submit form if Enter is pressed on a submit button
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement?.getAttribute('type') === 'submit' && onSubmit) {
        onSubmit();
      }
    }
  });
}
