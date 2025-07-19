'use client';

import { editor, languages, Range } from 'monaco-editor';
import {
  solidityLanguageConfig,
  solidityTokensProvider,
  solidityCompletionProvider,
  solidityHoverProvider,
  soliditySignatureHelpProvider
} from './SolidityLanguageDefinition';
import { SoliditySemanticAnalyzer } from './SoliditySemanticAnalyzer';
import { SolidityIntelliSense } from './SolidityIntelliSense';

// Custom Solidity theme
export const solidityTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keywords
    { token: 'keyword', foreground: '#569CD6', fontStyle: 'bold' },
    { token: 'keyword.contract', foreground: '#4EC9B0', fontStyle: 'bold' },
    { token: 'keyword.function', foreground: '#DCDCAA', fontStyle: 'bold' },
    
    // Types
    { token: 'type', foreground: '#4EC9B0' },
    { token: 'type.identifier', foreground: '#4EC9B0', fontStyle: 'bold' },
    
    // Identifiers
    { token: 'identifier', foreground: '#9CDCFE' },
    { token: 'function', foreground: '#DCDCAA' },
    { token: 'variable', foreground: '#9CDCFE' },
    
    // Strings
    { token: 'string', foreground: '#CE9178' },
    { token: 'string.hex', foreground: '#D7BA7D' },
    { token: 'string.escape', foreground: '#D7BA7D' },
    { token: 'string.escape.invalid', foreground: '#F44747' },
    
    // Numbers
    { token: 'number', foreground: '#B5CEA8' },
    { token: 'number.hex', foreground: '#B5CEA8' },
    { token: 'number.octal', foreground: '#B5CEA8' },
    { token: 'number.binary', foreground: '#B5CEA8' },
    { token: 'number.float', foreground: '#B5CEA8' },
    
    // Comments
    { token: 'comment', foreground: '#6A9955', fontStyle: 'italic' },
    
    // Operators
    { token: 'operator', foreground: '#D4D4D4' },
    { token: 'delimiter', foreground: '#D4D4D4' },
    
    // Brackets
    { token: 'delimiter.bracket', foreground: '#FFD700' },
    { token: 'delimiter.parenthesis', foreground: '#DA70D6' },
    { token: 'delimiter.square', foreground: '#87CEEB' },
    
    // Special tokens
    { token: 'annotation', foreground: '#DCDCAA' },
    { token: 'attribute', foreground: '#92C5F8' },
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#C6C6C6',
    'editor.selectionBackground': '#264F78',
    'editor.selectionHighlightBackground': '#ADD6FF26',
    'editor.wordHighlightBackground': '#575757B8',
    'editor.wordHighlightStrongBackground': '#004972B8',
    'editor.findMatchBackground': '#515C6A',
    'editor.findMatchHighlightBackground': '#EA5C0055',
    'editor.hoverHighlightBackground': '#264F7840',
    'editorBracketMatch.background': '#0064001A',
    'editorBracketMatch.border': '#888888',
    'editorError.foreground': '#F44747',
    'editorWarning.foreground': '#FF8C00',
    'editorInfo.foreground': '#75BEFF',
    'editorHint.foreground': '#EEEEEE',
  }
};

/**
 * Setup Monaco Editor with advanced Solidity support
 */
export class MonacoSoliditySetup {
  private static isInitialized = false;
  private static semanticAnalyzers = new Map<string, SoliditySemanticAnalyzer>();
  private static intelliSenseProviders = new Map<string, SolidityIntelliSense>();

  /**
   * Initialize Monaco Editor with Solidity language support
   */
  static initialize(): void {
    if (this.isInitialized) return;

    // Register Solidity language
    languages.register({ id: 'solidity' });

    // Set language configuration
    languages.setLanguageConfiguration('solidity', solidityLanguageConfig);

    // Set tokenization rules
    languages.setMonarchTokensProvider('solidity', solidityTokensProvider);

    // Register enhanced completion provider
    languages.registerCompletionItemProvider('solidity', {
      triggerCharacters: ['.', '(', ' ', '\n'],
      provideCompletionItems: (model, position, context) => {
        const intelliSense = this.intelliSenseProviders.get(model.id);
        if (intelliSense) {
          return intelliSense.provideCompletionItems(model, position, context);
        }
        // Fallback to basic completion provider
        return solidityCompletionProvider.provideCompletionItems(model, position);
      }
    });

    // Register hover provider
    languages.registerHoverProvider('solidity', solidityHoverProvider);

    // Register signature help provider
    languages.registerSignatureHelpProvider('solidity', soliditySignatureHelpProvider);

    // Define custom theme
    editor.defineTheme('solidity-dark', solidityTheme);

    // Register document formatting provider
    languages.registerDocumentFormattingEditProvider('solidity', {
      provideDocumentFormattingEdits: (model, options) => {
        return this.formatSolidityCode(model, options);
      }
    });

    // Register code action provider for quick fixes
    languages.registerCodeActionProvider('solidity', {
      provideCodeActions: (model, range, context) => {
        return this.provideCodeActions(model, range, context);
      }
    });

    this.isInitialized = true;
  }

  /**
   * Setup semantic analysis and IntelliSense for a model
   */
  static setupSemanticAnalysis(model: editor.ITextModel): void {
    const modelId = model.id;

    // Create semantic analyzer
    const analyzer = new SoliditySemanticAnalyzer(model);
    this.semanticAnalyzers.set(modelId, analyzer);

    // Create IntelliSense provider
    const intelliSense = new SolidityIntelliSense();
    this.intelliSenseProviders.set(modelId, intelliSense);

    // Initial analysis
    this.runSemanticAnalysis(model);

    // Set up real-time analysis
    const disposable = model.onDidChangeContent(() => {
      // Debounce analysis to avoid excessive computation
      setTimeout(() => {
        this.runSemanticAnalysis(model);
        this.updateIntelliSense(model);
      }, 500);
    });

    // Cleanup when model is disposed
    model.onWillDispose(() => {
      this.semanticAnalyzers.delete(modelId);
      this.intelliSenseProviders.delete(modelId);
      disposable.dispose();
    });
  }

  /**
   * Run semantic analysis and update markers
   */
  private static runSemanticAnalysis(model: editor.ITextModel): void {
    const analyzer = this.semanticAnalyzers.get(model.id);
    if (!analyzer) return;

    try {
      const result = analyzer.analyze();
      
      // Convert errors and warnings to Monaco markers
      const markers: editor.IMarkerData[] = [
        ...result.errors.map(error => ({
          severity: error.severity,
          message: error.message,
          startLineNumber: error.startLineNumber,
          startColumn: error.startColumn,
          endLineNumber: error.endLineNumber,
          endColumn: error.endColumn,
          code: error.code,
          source: error.source || 'solidity-analyzer',
          tags: error.tags
        })),
        ...result.warnings.map(warning => ({
          severity: warning.severity,
          message: warning.message,
          startLineNumber: warning.startLineNumber,
          startColumn: warning.startColumn,
          endLineNumber: warning.endLineNumber,
          endColumn: warning.endColumn,
          code: warning.code,
          source: warning.source || 'solidity-analyzer',
          tags: warning.tags
        }))
      ];

      // Set markers on the model
      editor.setModelMarkers(model, 'solidity-analyzer', markers);

      // Emit custom event with analysis results
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solidity-analysis-complete', {
          detail: { modelId: model.id, result }
        }));
      }
    } catch (error) {
      console.error('Semantic analysis failed:', error);
    }
  }

  /**
   * Format Solidity code
   */
  private static formatSolidityCode(
    model: editor.ITextModel,
    options: languages.FormattingOptions
  ): languages.TextEdit[] {
    const content = model.getValue();
    const lines = content.split('\n');
    const edits: languages.TextEdit[] = [];
    
    let indentLevel = 0;
    const indentSize = options.tabSize;
    const useSpaces = options.insertSpaces;
    const indentString = useSpaces ? ' '.repeat(indentSize) : '\t';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') continue;

      // Decrease indent for closing braces
      if (trimmedLine.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Calculate expected indentation
      const expectedIndent = indentString.repeat(indentLevel);
      const currentIndent = line.match(/^\s*/)?.[0] || '';

      // Add edit if indentation is incorrect
      if (currentIndent !== expectedIndent) {
        edits.push({
          range: new Range(i + 1, 1, i + 1, currentIndent.length + 1),
          text: expectedIndent
        });
      }

      // Increase indent for opening braces
      if (trimmedLine.endsWith('{')) {
        indentLevel++;
      }
    }

    return edits;
  }

  /**
   * Provide code actions (quick fixes)
   */
  private static provideCodeActions(
    model: editor.ITextModel,
    range: Range,
    context: languages.CodeActionContext
  ): languages.ProviderResult<languages.CodeActionList> {
    const actions: languages.CodeAction[] = [];

    // Quick fixes for common issues
    context.markers.forEach(marker => {
      switch (marker.code) {
        case 'MISSING_SEMICOLON':
          actions.push({
            title: 'Add semicolon',
            kind: 'quickfix',
            edit: {
              edits: [{
                resource: model.uri,
                textEdit: {
                  range: new Range(
                    marker.endLineNumber,
                    marker.endColumn - 1,
                    marker.endLineNumber,
                    marker.endColumn - 1
                  ),
                  text: ';'
                }
              }]
            },
            isPreferred: true
          });
          break;

        case 'MISSING_VISIBILITY':
          actions.push({
            title: 'Add public visibility',
            kind: 'quickfix',
            edit: {
              edits: [{
                resource: model.uri,
                textEdit: {
                  range: new Range(
                    marker.startLineNumber,
                    marker.endColumn,
                    marker.startLineNumber,
                    marker.endColumn
                  ),
                  text: ' public'
                }
              }]
            }
          });
          break;

        case 'TX_ORIGIN_USAGE':
          actions.push({
            title: 'Replace tx.origin with msg.sender',
            kind: 'quickfix',
            edit: {
              edits: [{
                resource: model.uri,
                textEdit: {
                  range: new Range(
                    marker.startLineNumber,
                    marker.startColumn,
                    marker.endLineNumber,
                    marker.endColumn
                  ),
                  text: 'msg.sender'
                }
              }]
            },
            isPreferred: true
          });
          break;
      }
    });

    // Add refactoring actions
    const lineContent = model.getLineContent(range.startLineNumber);
    
    // Extract function refactoring
    if (lineContent.includes('function') && lineContent.length > 100) {
      actions.push({
        title: 'Extract to separate function',
        kind: 'refactor.extract',
        command: {
          id: 'solidity.extractFunction',
          title: 'Extract Function',
          arguments: [model.uri, range]
        }
      });
    }

    return {
      actions,
      dispose: () => {}
    };
  }

  /**
   * Get semantic analysis result for a model
   */
  static getAnalysisResult(modelId: string): any {
    const analyzer = this.semanticAnalyzers.get(modelId);
    return analyzer ? analyzer.analyze() : null;
  }

  /**
   * Update IntelliSense with latest symbols
   */
  private static updateIntelliSense(model: editor.ITextModel): void {
    const analyzer = this.semanticAnalyzers.get(model.id);
    const intelliSense = this.intelliSenseProviders.get(model.id);

    if (!analyzer || !intelliSense) return;

    try {
      const result = analyzer.analyze();

      // Convert symbols to IntelliSense format
      const symbols = result.symbols.map(symbol => ({
        name: symbol.name,
        type: symbol.type,
        kind: this.getCompletionItemKind(symbol.type),
        detail: this.getSymbolDetail(symbol),
        documentation: symbol.documentation,
        insertText: symbol.name,
        insertTextRules: undefined
      }));

      // Update IntelliSense with new symbols
      intelliSense.updateSymbols(symbols);

      // Group symbols by contract
      const contractSymbols = new Map<string, any[]>();
      symbols.forEach(symbol => {
        // This would need more sophisticated contract detection
        const contractName = 'CurrentContract'; // Simplified
        if (!contractSymbols.has(contractName)) {
          contractSymbols.set(contractName, []);
        }
        contractSymbols.get(contractName)!.push(symbol);
      });

      contractSymbols.forEach((symbols, contractName) => {
        intelliSense.updateContractSymbols(contractName, symbols);
      });
    } catch (error) {
      console.error('Failed to update IntelliSense:', error);
    }
  }

  /**
   * Get Monaco completion item kind from symbol type
   */
  private static getCompletionItemKind(symbolType: string): languages.CompletionItemKind {
    switch (symbolType) {
      case 'contract':
        return languages.CompletionItemKind.Class;
      case 'function':
        return languages.CompletionItemKind.Function;
      case 'variable':
        return languages.CompletionItemKind.Variable;
      case 'event':
        return languages.CompletionItemKind.Event;
      case 'modifier':
        return languages.CompletionItemKind.Function;
      case 'struct':
        return languages.CompletionItemKind.Struct;
      case 'enum':
        return languages.CompletionItemKind.Enum;
      case 'mapping':
        return languages.CompletionItemKind.Property;
      default:
        return languages.CompletionItemKind.Text;
    }
  }

  /**
   * Get symbol detail string
   */
  private static getSymbolDetail(symbol: any): string {
    let detail = symbol.type;

    if (symbol.visibility) {
      detail += ` (${symbol.visibility})`;
    }

    if (symbol.mutability) {
      detail += ` ${symbol.mutability}`;
    }

    return detail;
  }

  /**
   * Cleanup resources
   */
  static cleanup(): void {
    this.semanticAnalyzers.clear();
    this.intelliSenseProviders.clear();
  }
}
