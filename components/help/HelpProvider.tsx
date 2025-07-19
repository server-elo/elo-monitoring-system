'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HelpSystem } from './HelpSystem';
import { KeyboardShortcuts } from './KeyboardShortcuts';

interface HelpContextType {
  isHelpOpen: boolean;
  isShortcutsOpen: boolean;
  openHelp: (query?: string, context?: string) => void;
  closeHelp: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  toggleHelp: () => void;
  toggleShortcuts: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

interface HelpProviderProps {
  children: React.ReactNode;
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState('');
  const [helpContext, setHelpContext] = useState<string | undefined>();

  const openHelp = (query?: string, context?: string) => {
    setHelpQuery(query || '');
    setHelpContext(context);
    setIsHelpOpen(true);
    setIsShortcutsOpen(false);
  };

  const closeHelp = () => {
    setIsHelpOpen(false);
    setHelpQuery('');
    setHelpContext(undefined);
  };

  const openShortcuts = () => {
    setIsShortcutsOpen(true);
    setIsHelpOpen(false);
  };

  const closeShortcuts = () => {
    setIsShortcutsOpen(false);
  };

  const toggleHelp = () => {
    if (isHelpOpen) {
      closeHelp();
    } else {
      openHelp();
    }
  };

  const toggleShortcuts = () => {
    if (isShortcutsOpen) {
      closeShortcuts();
    } else {
      openShortcuts();
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Help system shortcuts
      if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        // Only trigger if not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          toggleHelp();
        }
      }

      // Accessibility help
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        openHelp('accessibility', 'accessibility');
      }

      // Keyboard shortcuts
      if (event.ctrlKey && event.shiftKey && event.key === '?') {
        event.preventDefault();
        toggleShortcuts();
      }

      // Close on Escape
      if (event.key === 'Escape') {
        if (isHelpOpen) {
          closeHelp();
        } else if (isShortcutsOpen) {
          closeShortcuts();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, isShortcutsOpen]);

  // Announce help system availability to screen readers
  useEffect(() => {
    const announceHelp = () => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Help system available. Press question mark for help, Alt+H for accessibility help, or Ctrl+Shift+? for keyboard shortcuts.';
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 3000);
    };

    // Announce after a short delay to avoid interfering with page load
    const timer = setTimeout(announceHelp, 2000);
    return () => clearTimeout(timer);
  }, []);

  const value: HelpContextType = {
    isHelpOpen,
    isShortcutsOpen,
    openHelp,
    closeHelp,
    openShortcuts,
    closeShortcuts,
    toggleHelp,
    toggleShortcuts,
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
      
      {/* Help System Modal */}
      <HelpSystem
        isOpen={isHelpOpen}
        onClose={closeHelp}
        initialQuery={helpQuery}
        context={helpContext}
      />
      
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={isShortcutsOpen}
        onClose={closeShortcuts}
      />
    </HelpContext.Provider>
  );
};

// Custom hook to use the help context
export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

// Helper component for help triggers
interface HelpTriggerProps {
  children: React.ReactNode;
  query?: string;
  context?: string;
  className?: string;
}

export const HelpTrigger: React.FC<HelpTriggerProps> = ({
  children,
  query,
  context,
  className = '',
}) => {
  const { openHelp } = useHelp();

  return (
    <button
      onClick={() => openHelp(query, context)}
      className={className}
      aria-label={`Open help${query ? ` for ${query}` : ''}`}
    >
      {children}
    </button>
  );
};

// Helper component for shortcuts trigger
interface ShortcutsTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const ShortcutsTrigger: React.FC<ShortcutsTriggerProps> = ({
  children,
  className = '',
}) => {
  const { openShortcuts } = useHelp();

  return (
    <button
      onClick={openShortcuts}
      className={className}
      aria-label="Open keyboard shortcuts"
    >
      {children}
    </button>
  );
};

export default HelpProvider;
