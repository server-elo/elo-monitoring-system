'use client';

import * as monaco from 'monaco-editor';

// Solidity language configuration
export const solidityLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  folding: {
    markers: {
      start: new RegExp('^\\s*//\\s*#?region\\b'),
      end: new RegExp('^\\s*//\\s*#?endregion\\b')
    }
  },
  wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
  indentationRules: {
    increaseIndentPattern: new RegExp('^((?!\\/\\/).)*(\\{[^}"\'`]*|\\([^)"\'`]*|\\[[^\\]"\'`]*)$'),
    decreaseIndentPattern: new RegExp('^((?!.*?\\/\\*).*\\*/)?\\s*[\\}\\]\\)].*$')
  }
};

// Solidity monarch tokens provider
export const solidityTokensProvider: monaco.languages.IMonarchLanguage = {
  keywords: [
    'pragma', 'solidity', 'contract', 'interface', 'library', 'abstract',
    'function', 'modifier', 'event', 'struct', 'enum', 'mapping',
    'public', 'private', 'internal', 'external', 'pure', 'view', 'payable',
    'memory', 'storage', 'calldata', 'indexed', 'anonymous',
    'override', 'virtual', 'immutable', 'constant',
    'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'return',
    'try', 'catch', 'revert', 'require', 'assert',
    'new', 'delete', 'emit', 'using', 'is', 'this', 'super',
    'import', 'from', 'as'
  ],
  
  typeKeywords: [
    'address', 'bool', 'string', 'bytes', 'byte',
    'int', 'uint', 'int8', 'uint8', 'int16', 'uint16',
    'int32', 'uint32', 'int64', 'uint64', 'int128', 'uint128',
    'int256', 'uint256', 'bytes1', 'bytes2', 'bytes3', 'bytes4',
    'bytes5', 'bytes6', 'bytes7', 'bytes8', 'bytes9', 'bytes10',
    'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
    'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22',
    'bytes23', 'bytes24', 'bytes25', 'bytes26', 'bytes27', 'bytes28',
    'bytes29', 'bytes30', 'bytes31', 'bytes32'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':',
    '==', '<=', '>=', '!=', '&&', '||', '++', '--',
    '+', '-', '*', '/', '&', '|', '^', '%', '<<',
    '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
    '^=', '%=', '<<=', '>>=', '>>>='
  ],

  tokenizer: {
    root: [
      // Identifiers and keywords
      [/[a-zA-Z_$][\w$]*/, {
        cases: {
          '@typeKeywords': 'keyword.type',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],

      // Whitespace
      { include: '@whitespace' },

      // Numbers
      [/\d+/, 'number'],
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // Characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid'],

      // Delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment']
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ]
  },

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  symbols: /[=><!~?:&|+\-*\/\^%]+/
};

// Solidity completion provider
export const solidityCompletionProvider: monaco.languages.CompletionItemProvider = {
  provideCompletionItems: (model, position) => {
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    };

    const suggestions: monaco.languages.CompletionItem[] = [
      // Contract template
      {
        label: 'contract',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'contract ${1:ContractName} {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Contract declaration',
        range
      },
      // Function template
      {
        label: 'function',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'function ${1:functionName}(${2:}) ${3:public} ${4:view} returns (${5:}) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Function declaration',
        range
      },
      // Modifier template
      {
        label: 'modifier',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'modifier ${1:modifierName}(${2:}) {\n\t${3:require(${4:condition}, "${5:error message}");}\n\t_;\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Modifier declaration',
        range
      },
      // Event template
      {
        label: 'event',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'event ${1:EventName}(${2:address indexed _from, uint256 _value});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Event declaration',
        range
      },
      // Require statement
      {
        label: 'require',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'require(${1:condition}, "${2:error message}");',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Require statement for validation',
        range
      }
    ];

    return { suggestions };
  }
};

// Solidity hover provider
export const solidityHoverProvider: monaco.languages.HoverProvider = {
  provideHover: (model, position) => {
    const word = model.getWordAtPosition(position);
    if (!word) return null;

    const hoverInfo: { [key: string]: string } = {
      'msg.sender': 'Address of the account that sent the transaction',
      'msg.value': 'Amount of wei sent with the transaction',
      'block.timestamp': 'Current block timestamp in seconds since epoch',
      'block.number': 'Current block number',
      'address': 'Ethereum address type (20 bytes)',
      'uint256': 'Unsigned integer type (256 bits)',
      'mapping': 'Key-value storage pattern',
      'require': 'Validation function that reverts on failure',
      'payable': 'Function modifier allowing ether reception'
    };

    const info = hoverInfo[word.word];
    if (info) {
      return {
        contents: [{ value: `**${word.word}**\n\n${info}` }]
      };
    }

    return null;
  }
};

// Solidity signature help provider
export const soliditySignatureHelpProvider: monaco.languages.SignatureHelpProvider = {
  signatureHelpTriggerCharacters: ['(', ','],
  
  provideSignatureHelp: (model, position) => {
    // This would be expanded with actual function signatures
    return {
      signatures: [],
      activeSignature: 0,
      activeParameter: 0
    };
  }
};