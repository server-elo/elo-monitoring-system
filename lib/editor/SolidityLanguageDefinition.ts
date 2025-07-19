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
    increaseIndentPattern: /^((?!.*?\/\*).*)*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/,
    decreaseIndentPattern: /^((?!.*?\/\*).*)*[\}\]\)]/
  }
};

// Enhanced Solidity token definitions
export const solidityTokensProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.sol',

  keywords: [
    // Contract keywords
    'contract', 'interface', 'library', 'abstract', 'is',
    
    // Function keywords
    'function', 'constructor', 'fallback', 'receive', 'modifier',
    
    // Visibility keywords
    'public', 'private', 'internal', 'external',
    
    // State mutability
    'pure', 'view', 'payable', 'nonpayable',
    
    // Storage keywords
    'storage', 'memory', 'calldata',
    
    // Control flow
    'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'return', 'try', 'catch',
    
    // Declaration keywords
    'struct', 'enum', 'mapping', 'event', 'error', 'using', 'import', 'pragma',
    
    // Assembly
    'assembly', 'let',
    
    // Other keywords
    'constant', 'immutable', 'override', 'virtual', 'anonymous', 'indexed',
    'new', 'delete', 'emit', 'revert', 'require', 'assert',
    
    // Reserved keywords
    'after', 'alias', 'apply', 'auto', 'case', 'copyof', 'default', 'define',
    'final', 'implements', 'in', 'inline', 'macro', 'match', 'mutable',
    'null', 'of', 'partial', 'promise', 'reference', 'relocatable',
    'sealed', 'sizeof', 'static', 'supports', 'switch', 'typedef', 'typeof',
    'unchecked'
  ],

  typeKeywords: [
    // Elementary types
    'bool', 'string', 'bytes',
    
    // Integer types
    'int', 'int8', 'int16', 'int24', 'int32', 'int40', 'int48', 'int56', 'int64',
    'int72', 'int80', 'int88', 'int96', 'int104', 'int112', 'int120', 'int128',
    'int136', 'int144', 'int152', 'int160', 'int168', 'int176', 'int184', 'int192',
    'int200', 'int208', 'int216', 'int224', 'int232', 'int240', 'int248', 'int256',
    
    'uint', 'uint8', 'uint16', 'uint24', 'uint32', 'uint40', 'uint48', 'uint56', 'uint64',
    'uint72', 'uint80', 'uint88', 'uint96', 'uint104', 'uint112', 'uint120', 'uint128',
    'uint136', 'uint144', 'uint152', 'uint160', 'uint168', 'uint176', 'uint184', 'uint192',
    'uint200', 'uint208', 'uint216', 'uint224', 'uint232', 'uint240', 'uint248', 'uint256',
    
    // Fixed point types
    'fixed', 'ufixed',
    
    // Bytes types
    'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
    'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
    'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
    'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31', 'bytes32',
    
    // Address types
    'address', 'address payable'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
  ],

  // Common regular expressions
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  digits: /\d+(_+\d+)*/,
  octaldigits: /[0-7]+(_+[0-7]+)*/,
  binarydigits: /[0-1]+(_+[0-1]+)*/,
  hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

  // Tokenizer rules
  tokenizer: {
    root: [
      // Pragma directive
      [/pragma\s+/, 'keyword', '@pragma'],
      
      // Import directive
      [/import\s+/, 'keyword', '@import'],
      
      // Contract/Interface/Library declaration
      [/(contract|interface|library)\s+([a-zA-Z_$][\w$]*)/, ['keyword', 'type.identifier']],
      
      // Function declaration
      [/(function)\s+([a-zA-Z_$][\w$]*)/, ['keyword', 'function']],
      
      // Event declaration
      [/(event)\s+([a-zA-Z_$][\w$]*)/, ['keyword', 'type.identifier']],
      
      // Error declaration
      [/(error)\s+([a-zA-Z_$][\w$]*)/, ['keyword', 'type.identifier']],
      
      // Modifier declaration
      [/(modifier)\s+([a-zA-Z_$][\w$]*)/, ['keyword', 'function']],
      
      // Struct declaration
      [/(struct)\s+([a-zA-Z_$][\w$]*)/, ['keyword', 'type.identifier']],
      
      // Enum declaration
      [/(enum)\s+([a-zA-Z_$][\w$]*)/, ['keyword', 'type.identifier']],
      
      // Mapping declaration
      [/(mapping)\s*\(/, ['keyword', '@mapping']],
      
      // Assembly block
      [/assembly\s*\{/, 'keyword', '@assembly'],
      
      // Identifiers and keywords
      [/[a-zA-Z_$][\w$]*/, {
        cases: {
          '@typeKeywords': 'type',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      
      // Whitespace
      { include: '@whitespace' },
      
      // Delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],
      
      // Numbers
      [/(@digits)[eE]([\-+]?(@digits))?[fFdD]?/, 'number.float'],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?[fFdD]?/, 'number.float'],
      [/0[xX](@hexdigits)[Ll]?/, 'number.hex'],
      [/0(@octaldigits)[Ll]?/, 'number.octal'],
      [/0[bB](@binarydigits)[Ll]?/, 'number.binary'],
      [/(@digits)[fFdD]/, 'number.float'],
      [/(@digits)[lL]?/, 'number'],
      
      // Delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],
      
      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
      [/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      
      // Hex strings
      [/hex"([0-9a-fA-F]{2})*"/, 'string.hex'],
      [/hex'([0-9a-fA-F]{2})*'/, 'string.hex'],
      
      // Unicode strings
      [/unicode"/, 'string', '@string_unicode_double'],
      [/unicode'/, 'string', '@string_unicode_single'],
    ],

    pragma: [
      [/[^;]+/, 'string'],
      [/;/, 'delimiter', '@pop']
    ],

    import: [
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
      [/[^;]+/, 'string'],
      [/;/, 'delimiter', '@pop']
    ],

    mapping: [
      [/\)/, '@brackets', '@pop'],
      [/=>/, 'operator'],
      { include: '@root' }
    ],

    assembly: [
      [/\}/, 'keyword', '@pop'],
      [/[a-zA-Z_$][\w$]*/, 'variable'],
      { include: '@root' }
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ["\\*/", 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop']
    ],

    string_unicode_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\u[0-9A-Fa-f]{4}/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],

    string_unicode_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\u[0-9A-Fa-f]{4}/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop']
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  },
};

// Solidity completion item provider
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
      // Contract templates
      {
        label: 'contract',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'contract ${1:ContractName} {',
          '\t$0',
          '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a new contract',
        range
      },
      
      // Function templates
      {
        label: 'function',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'function ${1:functionName}(${2:parameters}) ${3:visibility} ${4:mutability} ${5:returns (${6:returnType})} {',
          '\t$0',
          '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a new function',
        range
      },
      
      // Constructor template
      {
        label: 'constructor',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'constructor(${1:parameters}) ${2:visibility} {',
          '\t$0',
          '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a constructor',
        range
      },
      
      // Event template
      {
        label: 'event',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'event ${1:EventName}(${2:parameters});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create an event',
        range
      },
      
      // Modifier template
      {
        label: 'modifier',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'modifier ${1:modifierName}(${2:parameters}) {',
          '\t${3:require(${4:condition}, "${5:error message}");}',
          '\t_;',
          '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a modifier',
        range
      }
    ];

    // Add built-in functions and global variables
    const builtins = [
      'msg.sender', 'msg.value', 'msg.data', 'msg.sig',
      'block.timestamp', 'block.number', 'block.difficulty', 'block.gaslimit',
      'tx.origin', 'tx.gasprice',
      'now', 'this', 'super',
      'require', 'assert', 'revert',
      'keccak256', 'sha256', 'ripemd160',
      'ecrecover', 'addmod', 'mulmod',
      'selfdestruct', 'suicide'
    ];

    builtins.forEach(builtin => {
      suggestions.push({
        label: builtin,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: builtin,
        documentation: `Built-in: ${builtin}`,
        range
      });
    });

    return { suggestions };
  }
};

// Solidity hover provider for documentation
export const solidityHoverProvider: monaco.languages.HoverProvider = {
  provideHover: (model, position) => {
    const word = model.getWordAtPosition(position);
    if (!word) return null;

    const hoverInfo: Record<string, string> = {
      'msg.sender': 'The address of the account that called the current function',
      'msg.value': 'The amount of wei sent with the current call',
      'msg.data': 'The complete calldata',
      'msg.sig': 'The first four bytes of the calldata (function identifier)',
      'block.timestamp': 'The current block timestamp as seconds since unix epoch',
      'block.number': 'The current block number',
      'block.difficulty': 'The current block difficulty',
      'block.gaslimit': 'The current block gaslimit',
      'tx.origin': 'The sender of the transaction (full call chain)',
      'tx.gasprice': 'The gas price of the transaction',
      'require': 'Throws an error if the condition is not met',
      'assert': 'Throws an error if the condition is not met (should only be used for internal errors)',
      'revert': 'Throws an error and reverts all changes',
      'keccak256': 'Computes the Keccak-256 hash',
      'sha256': 'Computes the SHA-256 hash',
      'ripemd160': 'Computes the RIPEMD-160 hash',
      'ecrecover': 'Recovers the address associated with the public key from elliptic curve signature',
      'addmod': 'Computes (x + y) % k where the addition is performed with arbitrary precision',
      'mulmod': 'Computes (x * y) % k where the multiplication is performed with arbitrary precision',
      'selfdestruct': 'Destroys the current contract and sends its funds to the given address',
      'address': 'Holds a 20 byte value (size of an Ethereum address)',
      'bool': 'Boolean type with values true and false',
      'string': 'Dynamically sized UTF-8-encoded string',
      'bytes': 'Dynamically sized byte array',
      'uint256': '256-bit unsigned integer',
      'int256': '256-bit signed integer',
      'mapping': 'Hash table with key-value pairs',
      'struct': 'Custom defined type that groups several variables',
      'enum': 'User-defined type with a finite set of constant values',
      'event': 'Inheritable members of contracts that emit logs',
      'modifier': 'Declarative way to change the semantics of functions',
      'constructor': 'Special function executed during contract creation',
      'fallback': 'Function executed when no other function matches',
      'receive': 'Function executed when contract receives plain Ether',
      'public': 'Visible externally and internally',
      'private': 'Only visible in the current contract',
      'internal': 'Only visible internally',
      'external': 'Only visible externally',
      'pure': 'Does not read or modify state',
      'view': 'Does not modify state',
      'payable': 'Can receive Ether',
      'storage': 'Persistent data stored in contract storage',
      'memory': 'Temporary data stored in memory',
      'calldata': 'Read-only data location for function parameters'
    };

    const documentation = hoverInfo[word.word];
    if (documentation) {
      return {
        range: new monaco.Range(
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

    return null;
  }
};

// Solidity signature help provider
export const soliditySignatureHelpProvider: monaco.languages.SignatureHelpProvider = {
  signatureHelpTriggerCharacters: ['(', ','],
  signatureHelpRetriggerCharacters: [')'],

  provideSignatureHelp: (model, position) => {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    // Simple signature help for common functions
    const signatures: Record<string, monaco.languages.SignatureInformation> = {
      'require': {
        label: 'require(bool condition, string memory message)',
        documentation: 'Throws an error if the condition is not met',
        parameters: [
          {
            label: 'condition',
            documentation: 'The condition to check'
          },
          {
            label: 'message',
            documentation: 'Error message to display if condition fails'
          }
        ]
      },
      'keccak256': {
        label: 'keccak256(bytes memory data) returns (bytes32)',
        documentation: 'Computes the Keccak-256 hash of the input',
        parameters: [
          {
            label: 'data',
            documentation: 'The data to hash'
          }
        ]
      },
      'ecrecover': {
        label: 'ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) returns (address)',
        documentation: 'Recovers the address from an elliptic curve signature',
        parameters: [
          {
            label: 'hash',
            documentation: 'The hash that was signed'
          },
          {
            label: 'v',
            documentation: 'Recovery identifier'
          },
          {
            label: 'r',
            documentation: 'First 32 bytes of signature'
          },
          {
            label: 's',
            documentation: 'Second 32 bytes of signature'
          }
        ]
      }
    };

    // Find function name before the opening parenthesis
    const match = textUntilPosition.match(/(\w+)\s*\([^)]*$/);
    if (match) {
      const functionName = match[1];
      const signature = signatures[functionName];

      if (signature) {
        return {
          value: {
            signatures: [signature],
            activeSignature: 0,
            activeParameter: 0 // Could be calculated based on comma count
          },
          dispose: () => {}
        };
      }
    }

    return null;
  }
};
