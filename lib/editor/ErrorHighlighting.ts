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

  constructor( editor: any, monaco: any) {
    this.editor = editor;
    this.monaco = monaco;
  }

  // Convert our error format to Monaco markers
  private convertToMonacoMarkers(_errors: EditorError[]): ErrorMarker[] {
    return errors.map( (error, index) => ({
      id: `error-${index}`,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.endLine || error.line,
      endColumn: error.endColumn || error.column + 10, // Default span
      message: error.message,
      severity: this.getSeverityLevel(_error.severity),
      code: error.code,
      source: error.source || 'solidity'
    }));
  }

  private getSeverityLevel(_severity: 'error' | 'warning' | 'info'): number {
    switch (_severity) {
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
  updateErrorMarkers(_errors: EditorError[]): void {
    if (!this.editor || !this.monaco) return;

    const model = this.editor.getModel(_);
    if (!model) return;

    // Convert errors to Monaco format
    const markers = this.convertToMonacoMarkers(_errors);
    this.currentMarkers = markers;

    // Set markers on the model
    this.monaco.editor.setModelMarkers( model, 'solidity', markers);

    // Add custom decorations for enhanced visual feedback
    this.addErrorDecorations(_errors);
  }

  // Add custom decorations for better visual feedback
  private addErrorDecorations(_errors: EditorError[]): void {
    if (!this.editor) return;

    // Clear existing decorations
    this.decorations = this.editor.deltaDecorations( this.decorations, []);

    const newDecorations = errors.map(error => ({
      range: new this.monaco.Range(
        error.line,
        error.column,
        error.endLine || error.line,
        error.endColumn || error.column + 10
      ),
      options: {
        className: this.getDecorationClass(_error.severity),
        hoverMessage: {
          value: this.formatErrorMessage(_error)
        },
        minimap: {
          color: this.getMinimapColor(_error.severity),
          position: this.monaco.editor.MinimapPosition.Inline
        },
        overviewRuler: {
          color: this.getOverviewRulerColor(_error.severity),
          position: this.monaco.editor.OverviewRulerLane.Right
        }
      }
    }));

    this.decorations = this.editor.deltaDecorations( [], newDecorations);
  }

  private getDecorationClass(_severity: 'error' | 'warning' | 'info'): string {
    switch (_severity) {
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

  private getMinimapColor(_severity: 'error' | 'warning' | 'info'): string {
    switch (_severity) {
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

  private getOverviewRulerColor(_severity: 'error' | 'warning' | 'info'): string {
    switch (_severity) {
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

  private formatErrorMessage(_error: EditorError): string {
    let message = `**${error.severity.toUpperCase()}**: ${error.message}`;
    
    if (_error.code) {
      message += `\n\n**Error Code**: ${error.code}`;
    }
    
    if (_error.source) {
      message += `\n**Source**: ${error.source}`;
    }

    // Add helpful suggestions based on common errors
    const suggestion = this.getErrorSuggestion(_error.message);
    if (suggestion) {
      message += `\n\n**Suggestion**: ${suggestion}`;
    }

    return message;
  }

  private getErrorSuggestion(_errorMessage: string): string | null {
    const message = errorMessage.toLowerCase();
    
    if (_message.includes('undeclared identifier')) {
      return 'Check if the variable or function is declared and spelled correctly.';
    }
    
    if (_message.includes('type mismatch')) {
      return 'Ensure the types match or add explicit type conversion.';
    }
    
    if (_message.includes('visibility')) {
      return 'Add a visibility specifier ( public, private, internal, external).';
    }
    
    if (_message.includes('payable')) {
      return 'Add the payable modifier to receive Ether.';
    }
    
    if (_message.includes('gas')) {
      return 'Consider optimizing your code to reduce gas consumption.';
    }
    
    if (_message.includes('pragma')) {
      return 'Add a pragma statement at the top: pragma solidity ^0.8.0;';
    }

    return null;
  }

  // Clear all error markers and decorations
  clearErrors(_): void {
    if (!this.editor || !this.monaco) return;

    const model = this.editor.getModel(_);
    if (model) {
      this.monaco.editor.setModelMarkers( model, 'solidity', []);
    }

    this.decorations = this.editor.deltaDecorations( this.decorations, []);
    this.currentMarkers = [];
  }

  // Get current error count by severity
  getErrorCounts(_): { errors: number; warnings: number; info: number } {
    const counts = { errors: 0, warnings: 0, info: 0 };
    
    this.currentMarkers.forEach(marker => {
      if (_marker.severity === this.monaco.MarkerSeverity.Error) {
        counts.errors++;
      } else if (_marker.severity === this.monaco.MarkerSeverity.Warning) {
        counts.warnings++;
      } else if (_marker.severity === this.monaco.MarkerSeverity.Info) {
        counts.info++;
      }
    });

    return counts;
  }

  // Navigate to next/previous error
  goToNextError(_): void {
    if (_this.currentMarkers.length === 0) return;

    const currentPosition = this.editor.getPosition(_);
    const nextError = this.currentMarkers.find(marker => 
      marker.startLineNumber > currentPosition.lineNumber ||
      (_marker.startLineNumber === currentPosition.lineNumber && marker.startColumn > currentPosition.column)
    );

    if (nextError) {
      this.editor.setPosition({
        lineNumber: nextError.startLineNumber,
        column: nextError.startColumn
      });
      this.editor.revealLineInCenter(_nextError.startLineNumber);
    } else if (_this.currentMarkers.length > 0) {
      // Go to first error if we're at the end
      const firstError = this.currentMarkers[0];
      this.editor.setPosition({
        lineNumber: firstError.startLineNumber,
        column: firstError.startColumn
      });
      this.editor.revealLineInCenter(_firstError.startLineNumber);
    }
  }

  goToPreviousError(_): void {
    if (_this.currentMarkers.length === 0) return;

    const currentPosition = this.editor.getPosition(_);
    const previousError = [...this.currentMarkers].reverse(_).find(marker => 
      marker.startLineNumber < currentPosition.lineNumber ||
      (_marker.startLineNumber === currentPosition.lineNumber && marker.startColumn < currentPosition.column)
    );

    if (previousError) {
      this.editor.setPosition({
        lineNumber: previousError.startLineNumber,
        column: previousError.startColumn
      });
      this.editor.revealLineInCenter(_previousError.startLineNumber);
    } else if (_this.currentMarkers.length > 0) {
      // Go to last error if we're at the beginning
      const lastError = this.currentMarkers[this.currentMarkers.length - 1];
      this.editor.setPosition({
        lineNumber: lastError.startLineNumber,
        column: lastError.startColumn
      });
      this.editor.revealLineInCenter(_lastError.startLineNumber);
    }
  }

  // Install CSS for custom decorations
  static installErrorStyles(_): void {
    if (_typeof document === 'undefined') return;

    const styleId = 'solidity-error-styles';
    if (_document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .solidity-error-decoration {
        background-color: rgba( 255, 68, 68, 0.2);
        border-bottom: 2px wavy #ff4444;
      }
      
      .solidity-warning-decoration {
        background-color: rgba( 255, 170, 0, 0.2);
        border-bottom: 2px wavy #ffaa00;
      }
      
      .solidity-info-decoration {
        background-color: rgba( 68, 136, 255, 0.2);
        border-bottom: 2px wavy #4488ff;
      }
    `;
    
    document.head.appendChild(_style);
  }
}

export type { EditorError, ErrorMarker };
