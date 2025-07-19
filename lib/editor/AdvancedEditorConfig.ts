'use client';

interface EditorTheme {
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  rules: Array<{
    token: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }>;
  colors: Record<string, string>;
}

interface KeyboardShortcut {
  key: string;
  command: string;
  when?: string;
  description: string;
}

export class AdvancedEditorConfig {
  private monaco: any;
  private editor: any;

  constructor(monaco: any, editor: any) {
    this.monaco = monaco;
    this.editor = editor;
  }

  // Configure advanced Solidity language features
  configureSolidityLanguage(): void {
    // Enhanced syntax highlighting
    this.monaco.languages.setMonarchTokensProvider('solidity', {
      tokenizer: {
        root: [
          // Pragma statements
          [/pragma\s+solidity\s+[^;]+;/, 'pragma'],
          
          // SPDX License
          [/\/\/\s*SPDX-License-Identifier:.*/, 'license'],
          
          // Contract declarations
          [/\b(contract|interface|library|abstract)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/, ['keyword.contract', 'type.identifier']],
          
          // Function declarations
          [/\b(function|modifier|constructor|fallback|receive)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/, ['keyword.function', 'function.identifier']],
          
          // Visibility modifiers
          [/\b(public|private|internal|external)\b/, 'keyword.visibility'],
          
          // State mutability
          [/\b(pure|view|payable|nonpayable)\b/, 'keyword.mutability'],
          
          // Storage location
          [/\b(memory|storage|calldata)\b/, 'keyword.storage'],
          
          // Data types
          [/\b(uint|int|address|bool|string|bytes)\d*\b/, 'type.primitive'],
          [/\b(mapping|struct|enum|event)\b/, 'keyword.type'],
          
          // Control flow
          [/\b(if|else|for|while|do|break|continue|return|try|catch)\b/, 'keyword.control'],
          
          // Built-in functions
          [/\b(require|assert|revert)\b/, 'function.builtin'],
          
          // Global variables
          [/\b(msg|block|tx|now)\b/, 'variable.global'],
          [/\.(sender|value|data|gas|timestamp|number|difficulty|coinbase)\b/, 'property.global'],
          
          // Operators
          [/[+\-*/%=!<>&|^~]/, 'operator'],
          
          // Numbers
          [/\b\d+(\.\d+)?(e[+-]?\d+)?\b/, 'number'],
          [/\b0x[0-9a-fA-F]+\b/, 'number.hex'],
          
          // Strings
          [/"([^"\\]|\\.)*"/, 'string'],
          [/'([^'\\]|\\.)*'/, 'string'],
          
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          
          // Identifiers
          [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
          
          // Delimiters
          [/[{}()\[\]]/, 'delimiter'],
          [/[;,.]/, 'delimiter'],
        ]
      }
    });

    // Enhanced auto-completion
    this.monaco.languages.registerCompletionItemProvider('solidity', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        return {
          suggestions: [
            // Contract templates
            {
              label: 'contract',
              kind: this.monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'contract ${1:ContractName} {',
                '\t${2:// Contract body}',
                '}'
              ].join('\n'),
              insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a new contract',
              range
            },
            
            // Function templates
            {
              label: 'function',
              kind: this.monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'function ${1:functionName}(${2:parameters}) ${3:public} ${4:returns (${5:returnType})} {',
                '\t${6:// Function body}',
                '}'
              ].join('\n'),
              insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a new function',
              range
            },
            
            // Constructor
            {
              label: 'constructor',
              kind: this.monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'constructor(${1:parameters}) {',
                '\t${2:// Constructor body}',
                '}'
              ].join('\n'),
              insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a constructor',
              range
            },
            
            // Modifier
            {
              label: 'modifier',
              kind: this.monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'modifier ${1:modifierName}(${2:parameters}) {',
                '\t${3:// Modifier body}',
                '\t_;',
                '}'
              ].join('\n'),
              insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a modifier',
              range
            },
            
            // Event
            {
              label: 'event',
              kind: this.monaco.languages.CompletionItemKind.Snippet,
              insertText: 'event ${1:EventName}(${2:parameters});',
              insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an event',
              range
            },
            
            // Require statement
            {
              label: 'require',
              kind: this.monaco.languages.CompletionItemKind.Function,
              insertText: 'require(${1:condition}, "${2:error message}");',
              insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Add a require statement',
              range
            },
            
            // Common data types
            ...['uint256', 'address', 'bool', 'string', 'bytes32'].map(type => ({
              label: type,
              kind: this.monaco.languages.CompletionItemKind.TypeParameter,
              insertText: type,
              documentation: `Solidity ${type} type`,
              range
            })),
            
            // Visibility modifiers
            ...['public', 'private', 'internal', 'external'].map(visibility => ({
              label: visibility,
              kind: this.monaco.languages.CompletionItemKind.Keyword,
              insertText: visibility,
              documentation: `${visibility} visibility modifier`,
              range
            }))
          ]
        };
      }
    });

    // Hover provider for documentation
    this.monaco.languages.registerHoverProvider('solidity', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const documentation = this.getSolidityDocumentation(word.word);
        if (!documentation) return null;

        return {
          range: new this.monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${word.word}**` },
            { value: documentation }
          ]
        };
      }
    });
  }

  // Configure custom themes
  configureThemes(): void {
    // Solidity Dark Theme
    const solidityDarkTheme: EditorTheme = {
      name: 'solidity-dark',
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'pragma', foreground: '#C586C0' },
        { token: 'license', foreground: '#6A9955' },
        { token: 'keyword.contract', foreground: '#569CD6' },
        { token: 'keyword.function', foreground: '#DCDCAA' },
        { token: 'keyword.visibility', foreground: '#4EC9B0' },
        { token: 'keyword.mutability', foreground: '#9CDCFE' },
        { token: 'keyword.storage', foreground: '#C586C0' },
        { token: 'type.primitive', foreground: '#4EC9B0' },
        { token: 'function.builtin', foreground: '#FF6B6B' },
        { token: 'variable.global', foreground: '#9CDCFE' },
        { token: 'property.global', foreground: '#9CDCFE' },
        { token: 'number.hex', foreground: '#B5CEA8' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
        'editor.selectionBackground': '#264F78',
        'editor.selectionHighlightBackground': '#ADD6FF26',
        'editorCursor.foreground': '#AEAFAD',
        'editor.findMatchBackground': '#515C6A',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        'editor.wordHighlightBackground': '#575757B8',
        'editor.wordHighlightStrongBackground': '#004972B8',
      }
    };

    this.monaco.editor.defineTheme('solidity-dark', solidityDarkTheme);

    // Solidity Light Theme
    const solidityLightTheme: EditorTheme = {
      name: 'solidity-light',
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'pragma', foreground: '#AF00DB' },
        { token: 'license', foreground: '#008000' },
        { token: 'keyword.contract', foreground: '#0000FF' },
        { token: 'keyword.function', foreground: '#795E26' },
        { token: 'keyword.visibility', foreground: '#267F99' },
        { token: 'keyword.mutability', foreground: '#001080' },
        { token: 'keyword.storage', foreground: '#AF00DB' },
        { token: 'type.primitive', foreground: '#267F99' },
        { token: 'function.builtin', foreground: '#FF0000' },
        { token: 'variable.global', foreground: '#001080' },
        { token: 'property.global', foreground: '#001080' },
        { token: 'number.hex', foreground: '#09885A' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893',
        'editorLineNumber.activeForeground': '#0B216F',
        'editor.selectionBackground': '#ADD6FF',
        'editor.selectionHighlightBackground': '#ADD6FF4D',
        'editorCursor.foreground': '#000000',
        'editor.findMatchBackground': '#A8AC94',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        'editor.wordHighlightBackground': '#57575740',
        'editor.wordHighlightStrongBackground': '#0047724D',
      }
    };

    this.monaco.editor.defineTheme('solidity-light', solidityLightTheme);
  }

  // Configure keyboard shortcuts
  configureKeyboardShortcuts(): void {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'ctrl+shift+c',
        command: 'compile-code',
        description: 'Compile Solidity code'
      },
      {
        key: 'ctrl+shift+r',
        command: 'run-tests',
        description: 'Run tests'
      },
      {
        key: 'ctrl+shift+s',
        command: 'save-version',
        description: 'Save code version'
      },
      {
        key: 'ctrl+shift+f',
        command: 'format-code',
        description: 'Format code'
      },
      {
        key: 'f8',
        command: 'next-error',
        description: 'Go to next error'
      },
      {
        key: 'shift+f8',
        command: 'previous-error',
        description: 'Go to previous error'
      }
    ];

    shortcuts.forEach(shortcut => {
      this.editor.addCommand(
        this.monaco.KeyMod.chord(
          this.monaco.KeyCode[shortcut.key.replace(/ctrl\+|shift\+|alt\+/g, '').toUpperCase()]
        ),
        () => {
          // Emit custom event for the parent component to handle
          window.dispatchEvent(new CustomEvent(`editor-${shortcut.command}`));
        }
      );
    });
  }

  // Get documentation for Solidity keywords
  private getSolidityDocumentation(word: string): string | null {
    const docs: Record<string, string> = {
      'pragma': 'Pragma directive specifies the compiler version',
      'contract': 'Defines a contract - the fundamental building block of Ethereum applications',
      'function': 'Defines a function that can be called to execute code',
      'modifier': 'Code that can be run before and/or after a function call',
      'constructor': 'Special function that runs when the contract is deployed',
      'public': 'Function/variable can be called internally and externally',
      'private': 'Function/variable can only be called from within the same contract',
      'internal': 'Function/variable can be called from within the contract and derived contracts',
      'external': 'Function can only be called from outside the contract',
      'view': 'Function promises not to modify the state',
      'pure': 'Function promises not to read from or modify the state',
      'payable': 'Function can receive Ether',
      'require': 'Validates inputs and conditions, reverts if condition is false',
      'assert': 'Checks for internal errors and invariants',
      'revert': 'Reverts the transaction with an optional error message',
      'msg': 'Global variable containing information about the message',
      'block': 'Global variable containing information about the current block',
      'tx': 'Global variable containing information about the transaction',
      'address': 'Holds a 20-byte Ethereum address',
      'uint256': '256-bit unsigned integer',
      'bool': 'Boolean type that can be true or false',
      'string': 'Dynamically-sized UTF-8 encoded string',
      'bytes32': 'Fixed-size byte array of 32 bytes',
      'mapping': 'Hash table data structure',
      'struct': 'Custom data type that groups variables',
      'enum': 'User-defined type with a finite set of constant values',
      'event': 'Logs data to the blockchain for external consumption'
    };

    return docs[word.toLowerCase()] || null;
  }

  // Configure accessibility features
  configureAccessibility(): void {
    // Enable screen reader support
    this.editor.updateOptions({
      accessibilitySupport: 'on',
      ariaLabel: 'Solidity Code Editor',
      screenReaderAnnounceInlineSuggestions: true,
    });

    // Add ARIA labels to editor elements
    const editorElement = this.editor.getDomNode();
    if (editorElement) {
      editorElement.setAttribute('role', 'textbox');
      editorElement.setAttribute('aria-label', 'Solidity code editor');
      editorElement.setAttribute('aria-multiline', 'true');
      editorElement.setAttribute('aria-autocomplete', 'list');
    }
  }

  // Configure responsive design
  configureResponsiveDesign(): void {
    // Auto-resize editor on window resize
    const resizeObserver = new ResizeObserver(() => {
      this.editor.layout();
    });

    const editorElement = this.editor.getDomNode();
    if (editorElement) {
      resizeObserver.observe(editorElement);
    }

    // Mobile-friendly options
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.editor.updateOptions({
        fontSize: 16, // Larger font for mobile
        lineHeight: 24,
        minimap: { enabled: false },
        scrollbar: {
          verticalScrollbarSize: 20,
          horizontalScrollbarSize: 20
        },
        suggest: {
          showIcons: false // Simplify suggestions on mobile
        }
      });
    }
  }
}
