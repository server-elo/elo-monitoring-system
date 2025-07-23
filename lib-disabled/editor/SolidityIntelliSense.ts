/**
 * Solidity IntelliSense Provider
 * 
 * Provides intelligent code completion and context-aware suggestions
 * for Solidity development in Monaco Editor.
 */
'use client';

import * as monaco from 'monaco-editor';

interface SoliditySymbol {
  name: string;
  type: 'contract' | 'function' | 'variable' | 'event' | 'modifier' | 'struct' | 'enum' | 'mapping';
  visibility?: 'public' | 'private' | 'internal' | 'external';
  mutability?: 'pure' | 'view' | 'payable' | 'nonpayable';
  parameters?: string[];
  returnType?: string;
  description?: string;
  location?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface CompletionContext {
  isInContract: boolean;
  isInFunction: boolean;
  contractName?: string;
  functionName?: string;
  scope: 'global' | 'contract' | 'function' | 'modifier';
}

/**
 * Advanced Solidity IntelliSense provider with context-aware suggestions
 */
export class SolidityIntelliSense {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private symbols: Map<string, SoliditySymbol> = new Map();
  private contractSymbols: Map<string, SoliditySymbol[]> = new Map();
  private builtinSymbols: SoliditySymbol[] = [];
  private disposables: monaco.IDisposable[] = [];

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    this.initializeBuiltinSymbols();
  }

  /**
   * Activate IntelliSense features
   */
  activate(): void {
    // Parse initial content
    this.parseSymbols();

    // Listen for content changes
    const model = this.editor.getModel();
    if (model) {
      this.disposables.push(
        model.onDidChangeContent(() => {
          this.parseSymbols();
        })
      );
    }
  }

  /**
   * Initialize built-in Solidity symbols
   */
  private initializeBuiltinSymbols(): void {
    // Global variables
    this.builtinSymbols.push(
      {
        name: 'msg.sender',
        type: 'variable',
        returnType: 'address',
        description: 'Address of the account that sent the transaction'
      },
      {
        name: 'msg.value',
        type: 'variable',
        returnType: 'uint256',
        description: 'Amount of wei sent with the transaction'
      },
      {
        name: 'msg.data',
        type: 'variable',
        returnType: 'bytes',
        description: 'Complete calldata'
      },
      {
        name: 'block.timestamp',
        type: 'variable',
        returnType: 'uint256',
        description: 'Current block timestamp'
      },
      {
        name: 'block.number',
        type: 'variable',
        returnType: 'uint256',
        description: 'Current block number'
      },
      {
        name: 'tx.origin',
        type: 'variable',
        returnType: 'address',
        description: 'Original sender of the transaction'
      }
    );

    // Global functions
    this.builtinSymbols.push(
      {
        name: 'require',
        type: 'function',
        parameters: ['bool condition', 'string memory message'],
        description: 'Reverts if condition is false'
      },
      {
        name: 'assert',
        type: 'function',
        parameters: ['bool condition'],
        description: 'Reverts if condition is false (uses all remaining gas)'
      },
      {
        name: 'revert',
        type: 'function',
        parameters: ['string memory message'],
        description: 'Reverts transaction with error message'
      },
      {
        name: 'keccak256',
        type: 'function',
        parameters: ['bytes memory data'],
        returnType: 'bytes32',
        description: 'Compute Keccak-256 hash'
      }
    );
  }

  /**
   * Parse symbols from the current document
   */
  private parseSymbols(): void {
    const model = this.editor.getModel();
    if (!model) return;

    const content = model.getValue();
    this.symbols.clear();
    this.contractSymbols.clear();

    // Simple regex-based parsing (would be replaced with proper AST parsing)
    const contractRegex = /contract\s+(\w+)\s*(?:is\s+([^{]+))?\s*\{/g;
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*(?:public|private|internal|external)?\s*(?:pure|view|payable)?/g;
    const eventRegex = /event\s+(\w+)\s*\([^)]*\)/g;
    const modifierRegex = /modifier\s+(\w+)\s*\([^)]*\)/g;

    // Parse contracts
    let match;
    while ((match = contractRegex.exec(content)) !== null) {
      const contractName = match[1];
      const symbol: SoliditySymbol = {
        name: contractName,
        type: 'contract',
        visibility: 'public'
      };
      this.symbols.set(contractName, symbol);
    }

    // Parse functions
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const symbol: SoliditySymbol = {
        name: functionName,
        type: 'function'
      };
      this.symbols.set(functionName, symbol);
    }

    // Parse events
    while ((match = eventRegex.exec(content)) !== null) {
      const eventName = match[1];
      const symbol: SoliditySymbol = {
        name: eventName,
        type: 'event'
      };
      this.symbols.set(eventName, symbol);
    }

    // Parse modifiers
    while ((match = modifierRegex.exec(content)) !== null) {
      const modifierName = match[1];
      const symbol: SoliditySymbol = {
        name: modifierName,
        type: 'modifier'
      };
      this.symbols.set(modifierName, symbol);
    }
  }

  /**
   * Get completion suggestions for current position
   */
  getCompletionSuggestions(position: monaco.Position): monaco.languages.CompletionItem[] {
    const suggestions: monaco.languages.CompletionItem[] = [];
    const model = this.editor.getModel();
    if (!model) return suggestions;

    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    };

    // Add built-in symbols
    this.builtinSymbols.forEach(symbol => {
      suggestions.push({
        label: symbol.name,
        kind: this.getCompletionItemKind(symbol.type),
        insertText: symbol.name,
        detail: symbol.returnType,
        documentation: symbol.description,
        range
      });
    });

    // Add user-defined symbols
    this.symbols.forEach(symbol => {
      suggestions.push({
        label: symbol.name,
        kind: this.getCompletionItemKind(symbol.type),
        insertText: symbol.name,
        detail: symbol.type,
        range
      });
    });

    return suggestions;
  }

  /**
   * Get Monaco completion item kind for symbol type
   */
  private getCompletionItemKind(type: SoliditySymbol['type']): monaco.languages.CompletionItemKind {
    switch (type) {
      case 'contract':
        return monaco.languages.CompletionItemKind.Class;
      case 'function':
        return monaco.languages.CompletionItemKind.Function;
      case 'variable':
        return monaco.languages.CompletionItemKind.Variable;
      case 'event':
        return monaco.languages.CompletionItemKind.Event;
      case 'modifier':
        return monaco.languages.CompletionItemKind.Method;
      case 'struct':
        return monaco.languages.CompletionItemKind.Struct;
      case 'enum':
        return monaco.languages.CompletionItemKind.Enum;
      case 'mapping':
        return monaco.languages.CompletionItemKind.Property;
      default:
        return monaco.languages.CompletionItemKind.Text;
    }
  }

  /**
   * Get hover information for a position
   */
  getHoverInfo(position: monaco.Position): monaco.languages.Hover | null {
    const model = this.editor.getModel();
    if (!model) return null;

    const word = model.getWordAtPosition(position);
    if (!word) return null;

    // Check built-in symbols
    const builtinSymbol = this.builtinSymbols.find(s => s.name === word.word);
    if (builtinSymbol) {
      return {
        contents: [
          {
            value: `**${builtinSymbol.name}**\n\n${builtinSymbol.description || ''}`
          }
        ]
      };
    }

    // Check user-defined symbols
    const userSymbol = this.symbols.get(word.word);
    if (userSymbol) {
      return {
        contents: [
          {
            value: `**${userSymbol.name}** (${userSymbol.type})`
          }
        ]
      };
    }

    return null;
  }

  /**
   * Dispose of the IntelliSense provider
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.symbols.clear();
    this.contractSymbols.clear();
  }
}