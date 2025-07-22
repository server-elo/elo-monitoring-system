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
    { token: 'attribute', foreground: '#92C5F8' }
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#C6C6C6',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
    'editorIndentGuide.background': '#404040',
    'editorIndentGuide.activeBackground': '#707070',
    'editor.selectionHighlightBackground': '#ADD6FF26',
    'editorSuggestWidget.background': '#252526',
    'editorSuggestWidget.border': '#454545',
    'editorSuggestWidget.foreground': '#D4D4D4',
    'editorSuggestWidget.selectedBackground': '#062F4A',
    'editorHoverWidget.background': '#252526',
    'editorHoverWidget.border': '#454545'
  }
};

// Setup Solidity language support
export function setupSolidityLanguage(): void {
  // Register language
  languages.register({ id: 'solidity' });

  // Set language configuration
  languages.setLanguageConfiguration('solidity', solidityLanguageConfig);

  // Set token provider
  languages.setMonarchTokensProvider('solidity', solidityTokensProvider);

  // Register completion provider
  languages.registerCompletionItemProvider('solidity', solidityCompletionProvider);

  // Register hover provider
  languages.registerHoverProvider('solidity', solidityHoverProvider);

  // Register signature help provider
  languages.registerSignatureHelpProvider('solidity', soliditySignatureHelpProvider);

  // Define and register theme
  editor.defineTheme('solidity-dark', solidityTheme);
}

// Enhanced setup with semantic analysis and IntelliSense
export function setupEnhancedSoliditySupport(
  editorInstance: editor.IStandaloneCodeEditor
): {
  analyzer: SoliditySemanticAnalyzer;
  intelliSense: SolidityIntelliSense;
} {
  // Initialize semantic analyzer
  const analyzer = new SoliditySemanticAnalyzer(editorInstance);
  analyzer.start();

  // Initialize IntelliSense
  const intelliSense = new SolidityIntelliSense(editorInstance);
  intelliSense.activate();

  return { analyzer, intelliSense };
}

// Monaco Solidity Setup Class
export class MonacoSoliditySetup {
  private static initialized = false;

  static initialize(): void {
    if (!this.initialized) {
      setupSolidityLanguage();
      this.initialized = true;
    }
  }

  static setupSemanticAnalysis(model: editor.ITextModel): void {
    // Basic semantic setup for the model
    model.onDidChangeContent(() => {
      // Trigger semantic analysis on content change
      this.validateSyntax(model);
    });
  }

  private static validateSyntax(model: editor.ITextModel): void {
    // Basic syntax validation
    const content = model.getValue();
    // Add validation logic as needed
  }
}

// Utility function to set up everything at once
export function initializeSolidityEditor(
  container: HTMLElement,
  initialValue: string = '',
  options: editor.IStandaloneEditorConstructionOptions = {}
): {
  editor: editor.IStandaloneCodeEditor;
  analyzer: SoliditySemanticAnalyzer;
  intelliSense: SolidityIntelliSense;
} {
  // Setup language support
  setupSolidityLanguage();

  // Create editor instance
  const editorInstance = editor.create(container, {
    value: initialValue,
    language: 'solidity',
    theme: 'solidity-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    folding: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true,
    ...options
  });

  // Setup enhanced support
  const { analyzer, intelliSense } = setupEnhancedSoliditySupport(editorInstance);

  return { editor: editorInstance, analyzer, intelliSense };
}