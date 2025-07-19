'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HelpSystem } from './HelpSystem';
import { KeyboardShortcuts } from './KeyboardShortcuts';

interface HelpContextType {
  isHelpOpen: boolean;
  isShortcutsOpen: boolean;
  openHelp: ( query?: string, context?: string) => void;
  closeHelp: (_) => void;
  openShortcuts: (_) => void;
  closeShortcuts: (_) => void;
  toggleHelp: (_) => void;
  toggleShortcuts: (_) => void;
}

const HelpContext = createContext<HelpContextType | undefined>(_undefined);

interface HelpProviderProps {
  children: React.ReactNode;
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children  }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(_false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(_false);
  const [helpQuery, setHelpQuery] = useState('');
  const [helpContext, setHelpContext] = useState<string | undefined>(_);

  const openHelp = ( query?: string, context?: string) => {
    setHelpQuery(_query || '');
    setHelpContext(_context);
    setIsHelpOpen(_true);
    setIsShortcutsOpen(_false);
  };

  const closeHelp = (_) => {
    setIsHelpOpen(_false);
    setHelpQuery('');
    setHelpContext(_undefined);
  };

  const openShortcuts = (_) => {
    setIsShortcutsOpen(_true);
    setIsHelpOpen(_false);
  };

  const closeShortcuts = (_) => {
    setIsShortcutsOpen(_false);
  };

  const toggleHelp = (_) => {
    if (isHelpOpen) {
      closeHelp(_);
    } else {
      openHelp(_);
    }
  };

  const toggleShortcuts = (_) => {
    if (isShortcutsOpen) {
      closeShortcuts(_);
    } else {
      openShortcuts(_);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (_event: KeyboardEvent) => {
      // Help system shortcuts
      if (_event.key === '?' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        // Only trigger if not in an input field
        const target = event.target as HTMLElement;
        if (_target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault(_);
          toggleHelp(_);
        }
      }

      // Accessibility help
      if (_event.altKey && event.key === 'h') {
        event.preventDefault(_);
        openHelp( 'accessibility', 'accessibility');
      }

      // Keyboard shortcuts
      if (_event.ctrlKey && event.shiftKey && event.key === '?') {
        event.preventDefault(_);
        toggleShortcuts(_);
      }

      // Close on Escape
      if (_event.key === 'Escape') {
        if (isHelpOpen) {
          closeHelp(_);
        } else if (isShortcutsOpen) {
          closeShortcuts(_);
        }
      }
    };

    window.addEventListener( 'keydown', handleKeyDown);
    return (_) => window.removeEventListener( 'keydown', handleKeyDown);
  }, [isHelpOpen, isShortcutsOpen]);

  // Announce help system availability to screen readers
  useEffect(() => {
    const announceHelp = (_) => {
      const announcement = document.createElement('div');
      announcement.setAttribute( 'aria-live', 'polite');
      announcement.setAttribute( 'aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Help system available. Press question mark for help, Alt+H for accessibility help, or Ctrl+Shift+? for keyboard shortcuts.';
      
      document.body.appendChild(_announcement);
      
      setTimeout(() => {
        document.body.removeChild(_announcement);
      }, 3000);
    };

    // Announce after a short delay to avoid interfering with page load
    const timer = setTimeout( announceHelp, 2000);
    return (_) => clearTimeout(_timer);
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
export const useHelp = (_): HelpContextType => {
  const context = useContext(_HelpContext);
  if (_context === undefined) {
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
  const { openHelp } = useHelp(_);

  return (
    <button
      onClick={(_) => openHelp( query, context)}
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
  const { openShortcuts } = useHelp(_);

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
