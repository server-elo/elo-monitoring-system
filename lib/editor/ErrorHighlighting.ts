'use client';

interface EditorError {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
  source?: string;
}

interface ErrorMarker {
  id: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number; // Monaco severity levels
  code?: string;
  source?: string;
}

export class ErrorHighlightingManager {
  private editor: any;
  private monaco: any;
  private currentMarkers: ErrorMarker[] = [];
  private decorations: string[] = [];

  constructor(editor: any, monaco: any) {
    this.editor = editor;
    this.monaco = monaco;
  }

  // Convert our error format to Monaco markers
  private convertToMonacoMarkers(errors: EditorError[]): ErrorMarker[] {
    return errors.map((error, index) => ({
      id: `error-${index}`,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.endLine || error.line,
      endColumn: error.endColumn || error.column + 10, // Default span
      message: error.message,
      severity: this.getSeverityLevel(error.severity),
      code: error.code,
      source: error.source || 'solidity'
    }));
  }

  private getSeverityLevel(severity: 'error' | 'warning' | 'info'): number {
    switch (severity) {
      case 'error':
        return this.monaco.MarkerSeverity.Error;
      case 'warning':
        return this.monaco.MarkerSeverity.Warning;
      case 'info':
        return this.monaco.MarkerSeverity.Info;
      default:
        return this.monaco.MarkerSeverity.Error;
    }
  }

  // Update error markers in the editor
  updateErrorMarkers(errors: EditorError[]): void {
    if (!this.editor || !this.monaco) return;

    const model = this.editor.getModel();
    if (!model) return;

    // Convert errors to Monaco format
    const markers = this.convertToMonacoMarkers(errors);
    this.currentMarkers = markers;

    // Set markers on the model
    this.monaco.editor.setModelMarkers(model, 'solidity', markers);

    // Add custom decorations for enhanced visual feedback
    this.addErrorDecorations(errors);
  }

  // Add custom decorations for better visual feedback
  private addErrorDecorations(errors: EditorError[]): void {
    if (!this.editor) return;

    // Clear existing decorations
    this.decorations = this.editor.deltaDecorations(this.decorations, []);

    const newDecorations = errors.map(error => ({
      range: new this.monaco.Range(
        error.line,
        error.column,
        error.endLine || error.line,
        error.endColumn || error.column + 10
      ),
      options: {
        className: this.getDecorationClass(error.severity),
        hoverMessage: {
          value: this.formatErrorMessage(error)
        },
        minimap: {
          color: this.getMinimapColor(error.severity),
          position: this.monaco.editor.MinimapPosition.Inline
        },
        overviewRuler: {
          color: this.getOverviewRulerColor(error.severity),
          position: this.monaco.editor.OverviewRulerLane.Right
        }
      }
    }));

    this.decorations = this.editor.deltaDecorations([], newDecorations);
  }

  private getDecorationClass(severity: 'error' | 'warning' | 'info'): string {
    switch (severity) {
      case 'error':
        return 'solidity-error-decoration';
      case 'warning':
        return 'solidity-warning-decoration';
      case 'info':
        return 'solidity-info-decoration';
      default:
        return 'solidity-error-decoration';
    }
  }

  private getMinimapColor(severity: 'error' | 'warning' | 'info'): string {
    switch (severity) {
      case 'error':
        return '#ff4444';
      case 'warning':
        return '#ffaa00';
      case 'info':
        return '#4488ff';
      default:
        return '#ff4444';
    }
  }

  private getOverviewRulerColor(severity: 'error' | 'warning' | 'info'): string {
    switch (severity) {
      case 'error':
        return '#ff4444';
      case 'warning':
        return '#ffaa00';
      case 'info':
        return '#4488ff';
      default:
        return '#ff4444';
    }
  }

  private formatErrorMessage(error: EditorError): string {
    let message = `**${error.severity.toUpperCase()}**: ${error.message}`;
    
    if (error.code) {
      message += `\n\n**Error Code**: ${error.code}`;
    }
    
    if (error.source) {
      message += `\n**Source**: ${error.source}`;
    }

    // Add helpful suggestions based on common errors
    const suggestion = this.getErrorSuggestion(error.message);
    if (suggestion) {
      message += `\n\n**Suggestion**: ${suggestion}`;
    }

    return message;
  }

  private getErrorSuggestion(errorMessage: string): string | null {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('undeclared identifier')) {
      return 'Check if the variable or function is declared and spelled correctly.';
    }
    
    if (message.includes('type mismatch')) {
      return 'Ensure the types match or add explicit type conversion.';
    }
    
    if (message.includes('visibility')) {
      return 'Add a visibility specifier (public, private, internal, external).';
    }
    
    if (message.includes('payable')) {
      return 'Add the payable modifier to receive Ether.';
    }
    
    if (message.includes('gas')) {
      return 'Consider optimizing your code to reduce gas consumption.';
    }
    
    if (message.includes('pragma')) {
      return 'Add a pragma statement at the top: pragma solidity ^0.8.0;';
    }

    return null;
  }

  // Clear all error markers and decorations
  clearErrors(): void {
    if (!this.editor || !this.monaco) return;

    const model = this.editor.getModel();
    if (model) {
      this.monaco.editor.setModelMarkers(model, 'solidity', []);
    }

    this.decorations = this.editor.deltaDecorations(this.decorations, []);
    this.currentMarkers = [];
  }

  // Get current error count by severity
  getErrorCounts(): { errors: number; warnings: number; info: number } {
    const counts = { errors: 0, warnings: 0, info: 0 };
    
    this.currentMarkers.forEach(marker => {
      if (marker.severity === this.monaco.MarkerSeverity.Error) {
        counts.errors++;
      } else if (marker.severity === this.monaco.MarkerSeverity.Warning) {
        counts.warnings++;
      } else if (marker.severity === this.monaco.MarkerSeverity.Info) {
        counts.info++;
      }
    });

    return counts;
  }

  // Navigate to next/previous error
  goToNextError(): void {
    if (this.currentMarkers.length === 0) return;

    const currentPosition = this.editor.getPosition();
    const nextError = this.currentMarkers.find(marker => 
      marker.startLineNumber > currentPosition.lineNumber ||
      (marker.startLineNumber === currentPosition.lineNumber && marker.startColumn > currentPosition.column)
    );

    if (nextError) {
      this.editor.setPosition({
        lineNumber: nextError.startLineNumber,
        column: nextError.startColumn
      });
      this.editor.revealLineInCenter(nextError.startLineNumber);
    } else if (this.currentMarkers.length > 0) {
      // Go to first error if we're at the end
      const firstError = this.currentMarkers[0];
      this.editor.setPosition({
        lineNumber: firstError.startLineNumber,
        column: firstError.startColumn
      });
      this.editor.revealLineInCenter(firstError.startLineNumber);
    }
  }

  goToPreviousError(): void {
    if (this.currentMarkers.length === 0) return;

    const currentPosition = this.editor.getPosition();
    const previousError = [...this.currentMarkers].reverse().find(marker => 
      marker.startLineNumber < currentPosition.lineNumber ||
      (marker.startLineNumber === currentPosition.lineNumber && marker.startColumn < currentPosition.column)
    );

    if (previousError) {
      this.editor.setPosition({
        lineNumber: previousError.startLineNumber,
        column: previousError.startColumn
      });
      this.editor.revealLineInCenter(previousError.startLineNumber);
    } else if (this.currentMarkers.length > 0) {
      // Go to last error if we're at the beginning
      const lastError = this.currentMarkers[this.currentMarkers.length - 1];
      this.editor.setPosition({
        lineNumber: lastError.startLineNumber,
        column: lastError.startColumn
      });
      this.editor.revealLineInCenter(lastError.startLineNumber);
    }
  }

  // Install CSS for custom decorations
  static installErrorStyles(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'solidity-error-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .solidity-error-decoration {
        background-color: rgba(255, 68, 68, 0.2);
        border-bottom: 2px wavy #ff4444;
      }
      
      .solidity-warning-decoration {
        background-color: rgba(255, 170, 0, 0.2);
        border-bottom: 2px wavy #ffaa00;
      }
      
      .solidity-info-decoration {
        background-color: rgba(68, 136, 255, 0.2);
        border-bottom: 2px wavy #4488ff;
      }
    `;
    
    document.head.appendChild(style);
  }
}

export type { EditorError, ErrorMarker };
