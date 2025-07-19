'use client';

interface AccessibilityOptions {
  announceChanges: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number;
  lineHeight: number;
}

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export class EditorAccessibilityManager {
  private editor: any;
  private monaco: any;
  private options: AccessibilityOptions;
  private shortcuts: KeyboardShortcut[] = [];
  private announcer: HTMLElement | null = null;

  constructor(editor: any, monaco: any, options: Partial<AccessibilityOptions> = {}) {
    this.editor = editor;
    this.monaco = monaco;
    this.options = {
      announceChanges: true,
      keyboardNavigation: true,
      screenReaderSupport: true,
      highContrast: false,
      reducedMotion: false,
      fontSize: 14,
      lineHeight: 20,
      ...options
    };

    this.initialize();
  }

  private initialize(): void {
    this.createScreenReaderAnnouncer();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupAccessibilityOptions();
    this.detectUserPreferences();
  }

  private createScreenReaderAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.announcer);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer || !this.options.announceChanges) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }

  private setupKeyboardNavigation(): void {
    if (!this.options.keyboardNavigation) return;

    // Define keyboard shortcuts
    this.shortcuts = [
      {
        key: 'F1',
        action: () => this.showKeyboardShortcuts(),
        description: 'Show keyboard shortcuts help',
        category: 'Help'
      },
      {
        key: 'Escape',
        action: () => this.closeDialogs(),
        description: 'Close open dialogs',
        category: 'Navigation'
      },
      {
        key: 'F8',
        action: () => this.goToNextError(),
        description: 'Go to next error',
        category: 'Navigation'
      },
      {
        key: 'F8',
        shiftKey: true,
        action: () => this.goToPreviousError(),
        description: 'Go to previous error',
        category: 'Navigation'
      },
      {
        key: 'F12',
        action: () => this.goToDefinition(),
        description: 'Go to definition',
        category: 'Navigation'
      },
      {
        key: 'F2',
        action: () => this.rename(),
        description: 'Rename symbol',
        category: 'Editing'
      },
      {
        key: 'Tab',
        ctrlKey: true,
        action: () => this.switchToNextPanel(),
        description: 'Switch to next panel',
        category: 'Navigation'
      },
      {
        key: 'Tab',
        ctrlKey: true,
        shiftKey: true,
        action: () => this.switchToPreviousPanel(),
        description: 'Switch to previous panel',
        category: 'Navigation'
      }
    ];

    // Register keyboard shortcuts
    this.shortcuts.forEach(shortcut => {
      this.editor.addCommand(
        this.getMonacoKeyCode(shortcut),
        shortcut.action
      );
    });

    // Add keyboard navigation for toolbar
    this.setupToolbarNavigation();
  }

  private getMonacoKeyCode(shortcut: KeyboardShortcut): number {
    let keyCode = this.monaco.KeyCode[shortcut.key];
    
    if (shortcut.ctrlKey) {
      keyCode = this.monaco.KeyMod.CtrlCmd | keyCode;
    }
    if (shortcut.shiftKey) {
      keyCode = this.monaco.KeyMod.Shift | keyCode;
    }
    if (shortcut.altKey) {
      keyCode = this.monaco.KeyMod.Alt | keyCode;
    }

    return keyCode;
  }

  private setupToolbarNavigation(): void {
    // Make toolbar buttons keyboard accessible
    const toolbar = document.querySelector('[data-testid="editor-toolbar"]');
    if (!toolbar) return;

    const buttons = toolbar.querySelectorAll('button');
    buttons.forEach((button, index) => {
      button.setAttribute('tabindex', '0');
      button.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault();
            const nextButton = buttons[index + 1] as HTMLElement;
            nextButton?.focus();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            const prevButton = buttons[index - 1] as HTMLElement;
            prevButton?.focus();
            break;
          case 'Home':
            e.preventDefault();
            (buttons[0] as HTMLElement)?.focus();
            break;
          case 'End':
            e.preventDefault();
            (buttons[buttons.length - 1] as HTMLElement)?.focus();
            break;
        }
      });
    });
  }

  private setupScreenReaderSupport(): void {
    if (!this.options.screenReaderSupport) return;

    // Configure Monaco for screen readers
    this.editor.updateOptions({
      accessibilitySupport: 'on',
      screenReaderAnnounceInlineSuggestions: true,
      ariaLabel: 'Solidity code editor. Press F1 for keyboard shortcuts.',
    });

    // Announce compilation results
    this.editor.onDidChangeModelDecorations(() => {
      const model = this.editor.getModel();
      if (!model) return;

      const markers = this.monaco.editor.getModelMarkers({ resource: model.uri });
      const errors = markers.filter((m: any) => m.severity === this.monaco.MarkerSeverity.Error);
      const warnings = markers.filter((m: any) => m.severity === this.monaco.MarkerSeverity.Warning);

      if (errors.length > 0) {
        this.announce(`${errors.length} error${errors.length > 1 ? 's' : ''} found`, 'assertive');
      } else if (warnings.length > 0) {
        this.announce(`${warnings.length} warning${warnings.length > 1 ? 's' : ''} found`);
      } else {
        this.announce('No errors or warnings');
      }
    });

    // Announce cursor position changes
    this.editor.onDidChangeCursorPosition((e: any) => {
      if (e.reason === this.monaco.editor.CursorChangeReason.Explicit) {
        const position = e.position;
        this.announce(`Line ${position.lineNumber}, Column ${position.column}`);
      }
    });
  }

  private setupAccessibilityOptions(): void {
    // Apply high contrast theme if needed
    if (this.options.highContrast) {
      this.monaco.editor.setTheme('hc-black');
    }

    // Apply font size and line height
    this.editor.updateOptions({
      fontSize: this.options.fontSize,
      lineHeight: this.options.lineHeight,
    });

    // Disable animations if reduced motion is preferred
    if (this.options.reducedMotion) {
      this.editor.updateOptions({
        cursorBlinking: 'solid',
        cursorSmoothCaretAnimation: 'off',
      });
    }
  }

  private detectUserPreferences(): void {
    // Detect system preferences
    if (window.matchMedia) {
      // High contrast preference
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      if (highContrastQuery.matches) {
        this.options.highContrast = true;
        this.monaco.editor.setTheme('hc-black');
      }

      // Reduced motion preference
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (reducedMotionQuery.matches) {
        this.options.reducedMotion = true;
        this.editor.updateOptions({
          cursorBlinking: 'solid',
          cursorSmoothCaretAnimation: 'off',
        });
      }

      // Listen for changes
      highContrastQuery.addEventListener('change', (e) => {
        this.options.highContrast = e.matches;
        this.monaco.editor.setTheme(e.matches ? 'hc-black' : 'vs-dark');
      });

      reducedMotionQuery.addEventListener('change', (e) => {
        this.options.reducedMotion = e.matches;
        this.editor.updateOptions({
          cursorBlinking: e.matches ? 'solid' : 'blink',
          cursorSmoothCaretAnimation: e.matches ? 'off' : 'on',
        });
      });
    }
  }

  // Keyboard shortcut actions
  private showKeyboardShortcuts(): void {
    const shortcuts = this.shortcuts.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<string, KeyboardShortcut[]>);

    let helpText = 'Keyboard Shortcuts:\n\n';
    Object.entries(shortcuts).forEach(([category, categoryShortcuts]) => {
      helpText += `${category}:\n`;
      categoryShortcuts.forEach(shortcut => {
        const keys = [
          shortcut.ctrlKey && 'Ctrl',
          shortcut.shiftKey && 'Shift',
          shortcut.altKey && 'Alt',
          shortcut.key
        ].filter(Boolean).join('+');
        helpText += `  ${keys}: ${shortcut.description}\n`;
      });
      helpText += '\n';
    });

    this.announce(helpText, 'assertive');
  }

  private closeDialogs(): void {
    // Close any open dialogs or panels
    this.editor.trigger('keyboard', 'closeReferenceSearch', null);
    this.editor.trigger('keyboard', 'closeFindWidget', null);
    this.announce('Dialogs closed');
  }

  private goToNextError(): void {
    this.editor.trigger('keyboard', 'editor.action.marker.next', null);
    this.announce('Navigated to next error');
  }

  private goToPreviousError(): void {
    this.editor.trigger('keyboard', 'editor.action.marker.prev', null);
    this.announce('Navigated to previous error');
  }

  private goToDefinition(): void {
    this.editor.trigger('keyboard', 'editor.action.revealDefinition', null);
    this.announce('Go to definition');
  }

  private rename(): void {
    this.editor.trigger('keyboard', 'editor.action.rename', null);
    this.announce('Rename symbol');
  }

  private switchToNextPanel(): void {
    // Custom implementation for panel switching
    window.dispatchEvent(new CustomEvent('editor-switch-panel', { detail: { direction: 'next' } }));
    this.announce('Switched to next panel');
  }

  private switchToPreviousPanel(): void {
    // Custom implementation for panel switching
    window.dispatchEvent(new CustomEvent('editor-switch-panel', { detail: { direction: 'previous' } }));
    this.announce('Switched to previous panel');
  }

  // Public methods for external control
  public updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.setupAccessibilityOptions();
  }

  public increaseFontSize(): void {
    this.options.fontSize = Math.min(this.options.fontSize + 2, 24);
    this.editor.updateOptions({ fontSize: this.options.fontSize });
    this.announce(`Font size increased to ${this.options.fontSize}`);
  }

  public decreaseFontSize(): void {
    this.options.fontSize = Math.max(this.options.fontSize - 2, 10);
    this.editor.updateOptions({ fontSize: this.options.fontSize });
    this.announce(`Font size decreased to ${this.options.fontSize}`);
  }

  public toggleHighContrast(): void {
    this.options.highContrast = !this.options.highContrast;
    this.monaco.editor.setTheme(this.options.highContrast ? 'hc-black' : 'vs-dark');
    this.announce(`High contrast ${this.options.highContrast ? 'enabled' : 'disabled'}`);
  }

  public getShortcuts(): KeyboardShortcut[] {
    return this.shortcuts;
  }

  public dispose(): void {
    if (this.announcer) {
      document.body.removeChild(this.announcer);
      this.announcer = null;
    }
  }
}
