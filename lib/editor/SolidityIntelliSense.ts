'use client';

import { editor, languages, Position, IRange } from 'monaco-editor';

export interface SoliditySymbol {
  name: string;
  type: 'contract' | 'function' | 'variable' | 'event' | 'modifier' | 'struct' | 'enum' | 'mapping';
  kind: languages.CompletionItemKind;
  detail: string;
  documentation?: string;
  insertText: string;
  insertTextRules?: languages.CompletionItemInsertTextRule;
  range?: IRange;
  sortText?: string;
  filterText?: string;
  additionalTextEdits?: languages.TextEdit[];
  command?: languages.Command;
}

export interface CompletionContext {
  position: Position;
  triggerCharacter?: string;
  triggerKind: languages.CompletionTriggerKind;
  word: string;
  lineText: string;
  isInString: boolean;
  isInComment: boolean;
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
  private symbols: Map<string, SoliditySymbol> = new Map();
  private contractSymbols: Map<string, SoliditySymbol[]> = new Map();
  private builtinSymbols: SoliditySymbol[] = [];
  private standardLibraries: Map<string, SoliditySymbol[]> = new Map();

  constructor() {
    this.initializeBuiltinSymbols();
    this.initializeStandardLibraries();
  }

  /**
   * Provide completion items based on context
   */
  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
    context: languages.CompletionContext
  ): languages.ProviderResult<languages.CompletionList> {
    const completionContext = this.analyzeContext(model, position, context);
    const suggestions: languages.CompletionItem[] = [];

    // Add context-specific suggestions
    this.addContextualSuggestions(suggestions, completionContext);
    
    // Add builtin suggestions
    this.addBuiltinSuggestions(suggestions, completionContext);
    
    // Add user-defined symbols
    this.addUserDefinedSuggestions(suggestions, completionContext);
    
    // Add snippet suggestions
    this.addSnippetSuggestions(suggestions, completionContext);
    
    // Add import suggestions
    this.addImportSuggestions(suggestions, completionContext);

    // Sort suggestions by relevance
    suggestions.sort((a, b) => {
      const aSort = a.sortText || a.label;
      const bSort = b.sortText || b.label;
      return aSort.localeCompare(bSort);
    });

    return {
      suggestions,
      incomplete: false
    };
  }

  /**
   * Analyze the current context for intelligent suggestions
   */
  private analyzeContext(
    model: editor.ITextModel,
    position: Position,
    context: languages.CompletionContext
  ): CompletionContext {
    const lineText = model.getLineContent(position.lineNumber);
    const word = model.getWordUntilPosition(position);
    
    // Determine scope and context
    const fullText = model.getValue();
    const lines = fullText.split('\n');
    
    let isInContract = false;
    let isInFunction = false;
    let contractName: string | undefined;
    let functionName: string | undefined;
    let scope: CompletionContext['scope'] = 'global';
    
    // Analyze surrounding context
    for (let i = position.lineNumber - 1; i >= 0; i--) {
      const line = lines[i];
      
      // Check for contract declaration
      const contractMatch = line.match(/^\s*contract\s+(\w+)/);
      if (contractMatch) {
        isInContract = true;
        contractName = contractMatch[1];
        scope = 'contract';
        break;
      }
      
      // Check for function declaration
      const functionMatch = line.match(/^\s*function\s+(\w+)/);
      if (functionMatch) {
        isInFunction = true;
        functionName = functionMatch[1];
        scope = 'function';
      }
      
      // Check for modifier declaration
      const modifierMatch = line.match(/^\s*modifier\s+(\w+)/);
      if (modifierMatch) {
        scope = 'modifier';
      }
    }

    return {
      position,
      triggerCharacter: context.triggerCharacter,
      triggerKind: context.triggerKind,
      word: word.word,
      lineText,
      isInString: this.isInString(lineText, position.column),
      isInComment: this.isInComment(lineText, position.column),
      isInContract,
      isInFunction,
      contractName,
      functionName,
      scope
    };
  }

  /**
   * Add contextual suggestions based on current scope
   */
  private addContextualSuggestions(
    suggestions: languages.CompletionItem[],
    context: CompletionContext
  ): void {
    const range = this.getWordRange(context);

    // Contract-level suggestions
    if (context.scope === 'contract') {
      suggestions.push(
        {
          label: 'function',
          kind: languages.CompletionItemKind.Keyword,
          insertText: [
            'function ${1:functionName}(${2:parameters}) ${3:public} ${4:returns (${5:returnType})} {',
            '\t$0',
            '}'
          ].join('\n'),
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a new function',
          range,
          sortText: '0001'
        },
        {
          label: 'constructor',
          kind: languages.CompletionItemKind.Constructor,
          insertText: [
            'constructor(${1:parameters}) ${2:public} {',
            '\t$0',
            '}'
          ].join('\n'),
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a constructor',
          range,
          sortText: '0002'
        },
        {
          label: 'modifier',
          kind: languages.CompletionItemKind.Function,
          insertText: [
            'modifier ${1:modifierName}(${2:parameters}) {',
            '\t${3:require(${4:condition}, "${5:error message}");}',
            '\t_;',
            '}'
          ].join('\n'),
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a modifier',
          range,
          sortText: '0003'
        },
        {
          label: 'event',
          kind: languages.CompletionItemKind.Event,
          insertText: 'event ${1:EventName}(${2:parameters});',
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create an event',
          range,
          sortText: '0004'
        }
      );
    }

    // Function-level suggestions
    if (context.scope === 'function') {
      suggestions.push(
        {
          label: 'require',
          kind: languages.CompletionItemKind.Function,
          insertText: 'require(${1:condition}, "${2:error message}");',
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Require condition with error message',
          range,
          sortText: '0001'
        },
        {
          label: 'emit',
          kind: languages.CompletionItemKind.Keyword,
          insertText: 'emit ${1:EventName}(${2:parameters});',
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Emit an event',
          range,
          sortText: '0002'
        },
        {
          label: 'return',
          kind: languages.CompletionItemKind.Keyword,
          insertText: 'return ${1:value};',
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Return a value',
          range,
          sortText: '0003'
        }
      );
    }

    // Type suggestions after variable declarations
    if (context.lineText.match(/^\s*(uint|int|bool|address|string|bytes)\s*$/)) {
      this.addTypeSuggestions(suggestions, context);
    }

    // Visibility suggestions after function/variable declarations
    if (context.lineText.includes('function') && !context.lineText.match(/\b(public|private|internal|external)\b/)) {
      this.addVisibilitySuggestions(suggestions, context);
    }

    // State mutability suggestions
    if (context.lineText.includes('function') && !context.lineText.match(/\b(pure|view|payable)\b/)) {
      this.addMutabilitySuggestions(suggestions, context);
    }
  }

  /**
   * Add builtin Solidity suggestions
   */
  private addBuiltinSuggestions(
    suggestions: languages.CompletionItem[],
    context: CompletionContext
  ): void {
    if (context.isInString || context.isInComment) return;

    const range = this.getWordRange(context);
    
    this.builtinSymbols.forEach(symbol => {
      if (symbol.name.toLowerCase().includes(context.word.toLowerCase())) {
        suggestions.push({
          label: symbol.name,
          kind: symbol.kind,
          insertText: symbol.insertText,
          insertTextRules: symbol.insertTextRules,
          documentation: symbol.documentation,
          detail: symbol.detail,
          range,
          sortText: `1${symbol.name}`
        });
      }
    });
  }

  /**
   * Add user-defined symbol suggestions
   */
  private addUserDefinedSuggestions(
    suggestions: languages.CompletionItem[],
    context: CompletionContext
  ): void {
    if (context.isInString || context.isInComment) return;

    const range = this.getWordRange(context);
    
    // Add symbols from current contract
    if (context.contractName) {
      const contractSymbols = this.contractSymbols.get(context.contractName) || [];
      contractSymbols.forEach(symbol => {
        if (symbol.name.toLowerCase().includes(context.word.toLowerCase())) {
          suggestions.push({
            label: symbol.name,
            kind: symbol.kind,
            insertText: symbol.insertText,
            documentation: symbol.documentation,
            detail: symbol.detail,
            range,
            sortText: `2${symbol.name}`
          });
        }
      });
    }

    // Add global symbols
    this.symbols.forEach(symbol => {
      if (symbol.name.toLowerCase().includes(context.word.toLowerCase())) {
        suggestions.push({
          label: symbol.name,
          kind: symbol.kind,
          insertText: symbol.insertText,
          documentation: symbol.documentation,
          detail: symbol.detail,
          range,
          sortText: `3${symbol.name}`
        });
      }
    });
  }

  /**
   * Add code snippet suggestions
   */
  private addSnippetSuggestions(
    suggestions: languages.CompletionItem[],
    context: CompletionContext
  ): void {
    if (context.isInString || context.isInComment) return;

    const range = this.getWordRange(context);
    
    // Common patterns
    const snippets = [
      {
        label: 'for loop',
        insertText: [
          'for (uint ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {',
          '\t$0',
          '}'
        ].join('\n'),
        documentation: 'For loop with uint iterator'
      },
      {
        label: 'if statement',
        insertText: [
          'if (${1:condition}) {',
          '\t$0',
          '}'
        ].join('\n'),
        documentation: 'If statement'
      },
      {
        label: 'mapping',
        insertText: 'mapping(${1:keyType} => ${2:valueType}) ${3:public} ${4:mappingName};',
        documentation: 'Mapping declaration'
      },
      {
        label: 'struct',
        insertText: [
          'struct ${1:StructName} {',
          '\t${2:uint256 field1;}',
          '\t${3:address field2;}',
          '}'
        ].join('\n'),
        documentation: 'Struct definition'
      }
    ];

    snippets.forEach(snippet => {
      if (snippet.label.toLowerCase().includes(context.word.toLowerCase())) {
        suggestions.push({
          label: snippet.label,
          kind: languages.CompletionItemKind.Snippet,
          insertText: snippet.insertText,
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: snippet.documentation,
          range,
          sortText: `9${snippet.label}`
        });
      }
    });
  }

  /**
   * Add import suggestions
   */
  private addImportSuggestions(
    suggestions: languages.CompletionItem[],
    context: CompletionContext
  ): void {
    if (!context.lineText.startsWith('import')) return;

    const range = this.getWordRange(context);
    
    // Common OpenZeppelin imports
    const commonImports = [
      '@openzeppelin/contracts/token/ERC20/ERC20.sol',
      '@openzeppelin/contracts/token/ERC721/ERC721.sol',
      '@openzeppelin/contracts/access/Ownable.sol',
      '@openzeppelin/contracts/security/ReentrancyGuard.sol',
      '@openzeppelin/contracts/security/Pausable.sol',
      '@openzeppelin/contracts/utils/math/SafeMath.sol'
    ];

    commonImports.forEach(importPath => {
      suggestions.push({
        label: importPath,
        kind: languages.CompletionItemKind.Module,
        insertText: `"${importPath}"`,
        documentation: `Import ${importPath}`,
        range,
        sortText: `0${importPath}`
      });
    });
  }

  // Helper methods
  private addTypeSuggestions(suggestions: languages.CompletionItem[], context: CompletionContext): void {
    const types = ['uint256', 'int256', 'bool', 'address', 'string', 'bytes32', 'bytes'];
    const range = this.getWordRange(context);
    
    types.forEach(type => {
      suggestions.push({
        label: type,
        kind: languages.CompletionItemKind.TypeParameter,
        insertText: type,
        range,
        sortText: `0${type}`
      });
    });
  }

  private addVisibilitySuggestions(suggestions: languages.CompletionItem[], context: CompletionContext): void {
    const visibilities = ['public', 'private', 'internal', 'external'];
    const range = this.getWordRange(context);
    
    visibilities.forEach(visibility => {
      suggestions.push({
        label: visibility,
        kind: languages.CompletionItemKind.Keyword,
        insertText: visibility,
        range,
        sortText: `0${visibility}`
      });
    });
  }

  private addMutabilitySuggestions(suggestions: languages.CompletionItem[], context: CompletionContext): void {
    const mutabilities = ['pure', 'view', 'payable'];
    const range = this.getWordRange(context);
    
    mutabilities.forEach(mutability => {
      suggestions.push({
        label: mutability,
        kind: languages.CompletionItemKind.Keyword,
        insertText: mutability,
        range,
        sortText: `0${mutability}`
      });
    });
  }

  private getWordRange(context: CompletionContext): IRange {
    return new monaco.Range(
      context.position.lineNumber,
      context.position.column - context.word.length,
      context.position.lineNumber,
      context.position.column
    );
  }

  private isInString(lineText: string, column: number): boolean {
    const beforeCursor = lineText.substring(0, column - 1);
    const singleQuotes = (beforeCursor.match(/'/g) || []).length;
    const doubleQuotes = (beforeCursor.match(/"/g) || []).length;
    return (singleQuotes % 2 === 1) || (doubleQuotes % 2 === 1);
  }

  private isInComment(lineText: string, column: number): boolean {
    const beforeCursor = lineText.substring(0, column - 1);
    return beforeCursor.includes('//') || beforeCursor.includes('/*');
  }

  private initializeBuiltinSymbols(): void {
    // Global variables and functions
    this.builtinSymbols = [
      {
        name: 'msg.sender',
        type: 'variable',
        kind: languages.CompletionItemKind.Property,
        detail: 'address',
        documentation: 'The address of the account that called the current function',
        insertText: 'msg.sender'
      },
      {
        name: 'msg.value',
        type: 'variable',
        kind: languages.CompletionItemKind.Property,
        detail: 'uint256',
        documentation: 'The amount of wei sent with the current call',
        insertText: 'msg.value'
      },
      {
        name: 'block.timestamp',
        type: 'variable',
        kind: languages.CompletionItemKind.Property,
        detail: 'uint256',
        documentation: 'The current block timestamp as seconds since unix epoch',
        insertText: 'block.timestamp'
      },
      {
        name: 'require',
        type: 'function',
        kind: languages.CompletionItemKind.Function,
        detail: 'function require(bool condition, string memory message)',
        documentation: 'Throws an error if the condition is not met',
        insertText: 'require(${1:condition}, "${2:message}")',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        name: 'keccak256',
        type: 'function',
        kind: languages.CompletionItemKind.Function,
        detail: 'function keccak256(bytes memory data) returns (bytes32)',
        documentation: 'Computes the Keccak-256 hash of the input',
        insertText: 'keccak256(${1:data})',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet
      }
    ];
  }

  private initializeStandardLibraries(): void {
    // Initialize common library symbols
    this.standardLibraries.set('SafeMath', [
      {
        name: 'add',
        type: 'function',
        kind: languages.CompletionItemKind.Method,
        detail: 'function add(uint256 a, uint256 b) returns (uint256)',
        documentation: 'Safe addition that reverts on overflow',
        insertText: 'add(${1:a}, ${2:b})',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet
      }
    ]);
  }

  /**
   * Update symbols from parsed code
   */
  updateSymbols(symbols: SoliditySymbol[]): void {
    this.symbols.clear();
    symbols.forEach(symbol => {
      this.symbols.set(symbol.name, symbol);
    });
  }

  /**
   * Update contract-specific symbols
   */
  updateContractSymbols(contractName: string, symbols: SoliditySymbol[]): void {
    this.contractSymbols.set(contractName, symbols);
  }
}
