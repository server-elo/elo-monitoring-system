'use client';

import * as monaco from 'monaco-editor';

export interface SolidityError {
  severity: monaco.MarkerSeverity;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  code?: string;
  source?: string;
  tags?: monaco.MarkerTag[];
}

export interface SoliditySymbol {
  name: string;
  type: 'contract' | 'function' | 'variable' | 'event' | 'modifier' | 'struct' | 'enum';
  visibility?: 'public' | 'private' | 'internal' | 'external';
  mutability?: 'pure' | 'view' | 'payable' | 'nonpayable';
  location: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  documentation?: string;
  parameters?: SolidityParameter[];
  returnType?: string;
}

export interface SolidityParameter {
  name: string;
  type: string;
  location?: 'storage' | 'memory' | 'calldata';
}

export interface AnalysisResult {
  errors: SolidityError[];
  warnings: SolidityError[];
  symbols: SoliditySymbol[];
  suggestions: string[];
}

/**
 * Advanced Solidity semantic analyzer for real-time error detection
 * and intelligent code analysis
 */
export class SoliditySemanticAnalyzer {
  private model: monaco.editor.ITextModel;
  private symbols: Map<string, SoliditySymbol> = new Map();
  private imports: Set<string> = new Set();
  private pragmaVersion: string | null = null;

  constructor(model: monaco.editor.ITextModel) {
    this.model = model;
  }

  /**
   * Perform comprehensive analysis of Solidity code
   */
  analyze(): AnalysisResult {
    const content = this.model.getValue();
    const lines = content.split('\n');
    const errors: SolidityError[] = [];
    const warnings: SolidityError[] = [];
    const symbols: SoliditySymbol[] = [];
    const suggestions: string[] = [];

    // Clear previous analysis
    this.symbols.clear();
    this.imports.clear();
    this.pragmaVersion = null;

    // Analyze line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Analyze pragma directives
      this.analyzePragma(line, lineNumber, errors, warnings);

      // Analyze imports
      this.analyzeImports(line, lineNumber, errors, warnings);

      // Analyze contract declarations
      this.analyzeContractDeclaration(line, lineNumber, errors, warnings, symbols);

      // Analyze function declarations
      this.analyzeFunctionDeclaration(line, lineNumber, errors, warnings, symbols);

      // Analyze variable declarations
      this.analyzeVariableDeclaration(line, lineNumber, errors, warnings, symbols);

      // Analyze common syntax errors
      this.analyzeSyntaxErrors(line, lineNumber, errors, warnings);

      // Analyze security patterns
      this.analyzeSecurityPatterns(line, lineNumber, warnings, suggestions);

      // Analyze gas optimization opportunities
      this.analyzeGasOptimization(line, lineNumber, suggestions);
    }

    // Cross-reference analysis
    this.analyzeCrossReferences(content, errors, warnings);

    // Generate suggestions
    this.generateSuggestions(content, suggestions);

    return {
      errors,
      warnings,
      symbols,
      suggestions
    };
  }

  private analyzePragma(
    line: string,
    lineNumber: number,
    errors: SolidityError[],
    warnings: SolidityError[]
  ): void {
    const pragmaMatch = line.match(/^\s*pragma\s+solidity\s+([^;]+);/);
    if (pragmaMatch) {
      const version = pragmaMatch[1].trim();
      this.pragmaVersion = version;

      // Check for version compatibility
      if (!version.match(/\^?\d+\.\d+\.\d+/)) {
        errors.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Invalid pragma version format',
          startLineNumber: lineNumber,
          startColumn: line.indexOf(version) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(version) + version.length + 1,
          code: 'INVALID_PRAGMA'
        });
      }

      // Warn about outdated versions
      const versionNumber = version.replace(/[^\d.]/g, '');
      const [major, minor] = versionNumber.split('.').map(Number);
      if (major === 0 && minor < 8) {
        warnings.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Consider upgrading to Solidity 0.8+ for better security features',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
          code: 'OUTDATED_VERSION'
        });
      }
    }
  }

  private analyzeImports(
    line: string,
    lineNumber: number,
    errors: SolidityError[],
    warnings: SolidityError[]
  ): void {
    const importMatch = line.match(/^\s*import\s+["']([^"']+)["']/);
    if (importMatch) {
      const importPath = importMatch[1];
      this.imports.add(importPath);

      // Check for common import issues
      if (!importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('@')) {
        warnings.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Consider using relative imports for local files',
          startLineNumber: lineNumber,
          startColumn: line.indexOf(importPath) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(importPath) + importPath.length + 1,
          code: 'IMPORT_STYLE'
        });
      }
    }
  }

  private analyzeContractDeclaration(
    line: string,
    lineNumber: number,
    errors: SolidityError[],
    warnings: SolidityError[],
    symbols: SoliditySymbol[]
  ): void {
    const contractMatch = line.match(/^\s*(contract|interface|library)\s+([a-zA-Z_$][\w$]*)/);
    if (contractMatch) {
      const contractType = contractMatch[1];
      const contractName = contractMatch[2];

      // Check naming conventions
      if (!contractName.match(/^[A-Z][a-zA-Z0-9]*$/)) {
        warnings.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Contract names should use PascalCase',
          startLineNumber: lineNumber,
          startColumn: line.indexOf(contractName) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(contractName) + contractName.length + 1,
          code: 'NAMING_CONVENTION'
        });
      }

      const symbol: SoliditySymbol = {
        name: contractName,
        type: 'contract',
        location: {
          startLineNumber: lineNumber,
          startColumn: line.indexOf(contractName) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(contractName) + contractName.length + 1
        }
      };

      symbols.push(symbol);
      this.symbols.set(contractName, symbol);
    }
  }

  private analyzeFunctionDeclaration(
    line: string,
    lineNumber: number,
    errors: SolidityError[],
    warnings: SolidityError[],
    symbols: SoliditySymbol[]
  ): void {
    const functionMatch = line.match(/^\s*function\s+([a-zA-Z_$][\w$]*)\s*\(/);
    if (functionMatch) {
      const functionName = functionMatch[1];

      // Check naming conventions
      if (!functionName.match(/^[a-z][a-zA-Z0-9]*$/)) {
        warnings.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Function names should use camelCase',
          startLineNumber: lineNumber,
          startColumn: line.indexOf(functionName) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(functionName) + functionName.length + 1,
          code: 'NAMING_CONVENTION'
        });
      }

      // Extract visibility and mutability
      const visibility = line.match(/(public|private|internal|external)/)?.[1] as any;
      const mutability = line.match(/(pure|view|payable)/)?.[1] as any;

      const symbol: SoliditySymbol = {
        name: functionName,
        type: 'function',
        visibility,
        mutability,
        location: {
          startLineNumber: lineNumber,
          startColumn: line.indexOf(functionName) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(functionName) + functionName.length + 1
        }
      };

      symbols.push(symbol);
      this.symbols.set(functionName, symbol);
    }
  }

  private analyzeVariableDeclaration(
    line: string,
    lineNumber: number,
    errors: SolidityError[],
    warnings: SolidityError[],
    symbols: SoliditySymbol[]
  ): void {
    const variableMatch = line.match(/^\s*(uint\d*|int\d*|address|bool|string|bytes\d*)\s+(?:(public|private|internal)\s+)?([a-zA-Z_$][\w$]*)/);
    if (variableMatch) {
      const varType = variableMatch[1];
      const visibility = variableMatch[2] as any;
      const varName = variableMatch[3];

      // Check naming conventions for state variables
      if (visibility && !varName.match(/^[a-z][a-zA-Z0-9]*$/)) {
        warnings.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'State variables should use camelCase',
          startLineNumber: lineNumber,
          startColumn: line.indexOf(varName) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(varName) + varName.length + 1,
          code: 'NAMING_CONVENTION'
        });
      }

      const symbol: SoliditySymbol = {
        name: varName,
        type: 'variable',
        visibility,
        returnType: varType,
        location: {
          startLineNumber: lineNumber,
          startColumn: line.indexOf(varName) + 1,
          endLineNumber: lineNumber,
          endColumn: line.indexOf(varName) + varName.length + 1
        }
      };

      symbols.push(symbol);
      this.symbols.set(varName, symbol);
    }
  }

  private analyzeSyntaxErrors(
    line: string,
    lineNumber: number,
    errors: SolidityError[],
    warnings: SolidityError[]
  ): void {
    // Check for missing semicolons
    if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
      const functionOrVarDecl = line.match(/(function|uint|int|address|bool|string|bytes|mapping)/);
      if (functionOrVarDecl && !line.includes('{')) {
        errors.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Missing semicolon',
          startLineNumber: lineNumber,
          startColumn: line.length,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
          code: 'MISSING_SEMICOLON'
        });
      }
    }

    // Check for unmatched parentheses
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        severity: monaco.MarkerSeverity.Error,
        message: 'Unmatched parentheses',
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        code: 'UNMATCHED_PARENS'
      });
    }
  }

  private analyzeSecurityPatterns(
    line: string,
    lineNumber: number,
    warnings: SolidityError[],
    suggestions: string[]
  ): void {
    // Check for tx.origin usage
    if (line.includes('tx.origin')) {
      warnings.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'Avoid using tx.origin for authentication',
        startLineNumber: lineNumber,
        startColumn: line.indexOf('tx.origin') + 1,
        endLineNumber: lineNumber,
        endColumn: line.indexOf('tx.origin') + 'tx.origin'.length + 1,
        code: 'TX_ORIGIN'
      });
      suggestions.push('Use msg.sender instead of tx.origin for authentication');
    }

    // Check for delegatecall
    if (line.includes('delegatecall')) {
      warnings.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'Be careful with delegatecall - ensure the target is trusted',
        startLineNumber: lineNumber,
        startColumn: line.indexOf('delegatecall') + 1,
        endLineNumber: lineNumber,
        endColumn: line.indexOf('delegatecall') + 'delegatecall'.length + 1,
        code: 'DELEGATECALL'
      });
    }

    // Check for selfdestruct
    if (line.includes('selfdestruct')) {
      warnings.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'selfdestruct can be dangerous - ensure proper access control',
        startLineNumber: lineNumber,
        startColumn: line.indexOf('selfdestruct') + 1,
        endLineNumber: lineNumber,
        endColumn: line.indexOf('selfdestruct') + 'selfdestruct'.length + 1,
        code: 'SELFDESTRUCT'
      });
    }
  }

  private analyzeGasOptimization(
    line: string,
    lineNumber: number,
    suggestions: string[]
  ): void {
    // Check for storage in loops
    if (line.includes('for') || line.includes('while')) {
      if (line.includes('storage')) {
        suggestions.push(`Line ${lineNumber}: Consider caching storage variables in memory within loops`);
      }
    }

    // Check for string usage
    if (line.includes('string ') && !line.includes('memory') && !line.includes('storage')) {
      suggestions.push(`Line ${lineNumber}: Specify data location for string variables`);
    }
  }

  private analyzeCrossReferences(
    content: string,
    errors: SolidityError[],
    warnings: SolidityError[]
  ): void {
    // Check for undefined references
    const functionCalls = content.matchAll(/([a-zA-Z_$][\w$]*)\s*\(/g);
    for (const match of functionCalls) {
      const functionName = match[1];
      if (!this.symbols.has(functionName) && !this.isBuiltInFunction(functionName)) {
        // Skip if it's a type cast or modifier
        if (!this.isTypeCast(functionName) && !this.isModifier(functionName)) {
          const lines = content.substring(0, match.index || 0).split('\n');
          const lineNumber = lines.length;
          const column = (lines[lines.length - 1] || '').length + 1;
          
          warnings.push({
            severity: monaco.MarkerSeverity.Warning,
            message: `Undefined reference: ${functionName}`,
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + functionName.length,
            code: 'UNDEFINED_REFERENCE'
          });
        }
      }
    }
  }

  private generateSuggestions(content: string, suggestions: string[]): void {
    // Suggest using latest Solidity version
    if (this.pragmaVersion && !this.pragmaVersion.includes('0.8')) {
      suggestions.push('Consider upgrading to Solidity 0.8.x for automatic overflow/underflow protection');
    }

    // Suggest using events for important state changes
    if (!content.includes('event ')) {
      suggestions.push('Consider using events to log important state changes');
    }

    // Suggest using modifiers for access control
    if (!content.includes('modifier ')) {
      suggestions.push('Consider using modifiers for repeated access control logic');
    }

    // Suggest using require statements
    if (!content.includes('require(')) {
      suggestions.push('Use require statements to validate inputs and conditions');
    }
  }

  private isBuiltInFunction(name: string): boolean {
    const builtIns = [
      'require', 'assert', 'revert', 'keccak256', 'sha256', 'ecrecover',
      'addmod', 'mulmod', 'this', 'super', 'selfdestruct', 'balance',
      'send', 'transfer', 'call', 'delegatecall', 'staticcall'
    ];
    return builtIns.includes(name);
  }

  private isTypeCast(name: string): boolean {
    const types = [
      'uint', 'int', 'address', 'bool', 'string', 'bytes',
      'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
      'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
      'bytes1', 'bytes2', 'bytes4', 'bytes8', 'bytes16', 'bytes32'
    ];
    return types.includes(name);
  }

  private isModifier(name: string): boolean {
    const modifiers = ['payable', 'view', 'pure', 'external', 'public', 'private', 'internal'];
    return modifiers.includes(name);
  }

  /**
   * Get errors as Monaco markers
   */
  getMarkers(): monaco.editor.IMarkerData[] {
    const result = this.analyze();
    return [...result.errors, ...result.warnings].map(error => ({
      severity: error.severity,
      message: error.message,
      startLineNumber: error.startLineNumber,
      startColumn: error.startColumn,
      endLineNumber: error.endLineNumber,
      endColumn: error.endColumn,
      code: error.code,
      source: error.source,
      tags: error.tags
    }));
  }

  /**
   * Get all symbols for outline view
   */
  getSymbols(): SoliditySymbol[] {
    const result = this.analyze();
    return result.symbols;
  }

  /**
   * Get suggestions for the current code
   */
  getSuggestions(): string[] {
    const result = this.analyze();
    return result.suggestions;
  }
}