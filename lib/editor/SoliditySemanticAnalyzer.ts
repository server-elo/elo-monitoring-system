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

  private analyzePragma(line: string, lineNumber: number, errors: SolidityError[], warnings: SolidityError[]): void {
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

  private analyzeImports(line: string, lineNumber: number, _errors: SolidityError[], warnings: SolidityError[]): void {
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
    _errors: SolidityError[], 
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
    _errors: SolidityError[], 
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

      // Check for visibility specifier
      if (!line.match(/\b(public|private|internal|external)\b/)) {
        warnings.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Function should have explicit visibility',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
          code: 'MISSING_VISIBILITY'
        });
      }

      const symbol: SoliditySymbol = {
        name: functionName,
        type: 'function',
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
    _errors: SolidityError[], 
    warnings: SolidityError[], 
    symbols: SoliditySymbol[]
  ): void {
    // State variable declaration
    const stateVarMatch = line.match(/^\s*(uint256|uint|int256|int|bool|address|string|bytes)\s+([a-zA-Z_$][\w$]*)/);
    if (stateVarMatch) {
      const varType = stateVarMatch[1];
      const varName = stateVarMatch[2];

      // Check naming conventions for state variables
      if (!varName.match(/^[a-z][a-zA-Z0-9]*$/)) {
        warnings.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Variable names should use camelCase',
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

  private analyzeSyntaxErrors(line: string, lineNumber: number, errors: SolidityError[], warnings: SolidityError[]): void {
    // Check for missing semicolons
    if (line.match(/^\s*(uint|int|bool|address|string|bytes|mapping)\s+\w+\s*[^;{]*$/) && 
        !line.includes('{') && !line.includes('(')) {
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

    // Check for unmatched brackets
    const openBrackets = (line.match(/\{/g) || []).length;
    const closeBrackets = (line.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets && line.trim() !== '') {
      // This is a simple check - a more sophisticated analyzer would track across lines
      warnings.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'Potential unmatched brackets',
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        code: 'UNMATCHED_BRACKETS'
      });
    }
  }

  private analyzeSecurityPatterns(
    line: string, 
    lineNumber: number, 
    warnings: SolidityError[], 
    suggestions: string[]
  ): void {
    // Check for potential reentrancy
    if (line.includes('.call(') || line.includes('.send(') || line.includes('.transfer(')) {
      warnings.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'Potential reentrancy vulnerability - consider using checks-effects-interactions pattern',
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        code: 'REENTRANCY_RISK'
      });
      suggestions.push('Use the checks-effects-interactions pattern to prevent reentrancy attacks');
    }

    // Check for tx.origin usage
    if (line.includes('tx.origin')) {
      warnings.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'Avoid using tx.origin for authorization - use msg.sender instead',
        startLineNumber: lineNumber,
        startColumn: line.indexOf('tx.origin') + 1,
        endLineNumber: lineNumber,
        endColumn: line.indexOf('tx.origin') + 'tx.origin'.length + 1,
        code: 'TX_ORIGIN_USAGE'
      });
    }

    // Check for block.timestamp usage
    if (line.includes('block.timestamp') || line.includes('now')) {
      warnings.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'Block timestamp can be manipulated by miners - avoid using for critical logic',
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        code: 'TIMESTAMP_DEPENDENCE'
      });
    }
  }

  private analyzeGasOptimization(line: string, lineNumber: number, suggestions: string[]): void {
    // Check for storage vs memory usage
    if (line.includes('string ') && !line.includes('memory') && !line.includes('storage')) {
      suggestions.push('Specify data location (memory/storage) for string variables to optimize gas usage');
    }

    // Check for unnecessary storage reads
    if (line.match(/\w+\.\w+.*\w+\.\w+/)) {
      suggestions.push('Consider caching storage variables in memory to reduce gas costs');
    }

    // Check for loop optimizations
    if (line.includes('for') && line.includes('.length')) {
      suggestions.push('Cache array length in a variable before the loop to save gas');
    }
  }

  private analyzeCrossReferences(content: string, _errors: SolidityError[], warnings: SolidityError[]): void {
    // Check for undefined variables/functions
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Simple check for function calls
      const functionCallMatch = line.match(/(\w+)\s*\(/g);
      if (functionCallMatch) {
        functionCallMatch.forEach(match => {
          const functionName = match.replace(/\s*\(/, '');
          if (!this.symbols.has(functionName) && !this.isBuiltinFunction(functionName)) {
            warnings.push({
              severity: monaco.MarkerSeverity.Warning,
              message: `Undefined function: ${functionName}`,
              startLineNumber: lineNumber,
              startColumn: line.indexOf(functionName) + 1,
              endLineNumber: lineNumber,
              endColumn: line.indexOf(functionName) + functionName.length + 1,
              code: 'UNDEFINED_FUNCTION'
            });
          }
        });
      }
    }
  }

  private generateSuggestions(content: string, suggestions: string[]): void {
    // Suggest adding SPDX license identifier
    if (!content.includes('SPDX-License-Identifier')) {
      suggestions.push('Add SPDX license identifier at the top of the file');
    }

    // Suggest adding NatSpec documentation
    if (content.includes('function ') && !content.includes('/**')) {
      suggestions.push('Consider adding NatSpec documentation for your functions');
    }

    // Suggest using events for important state changes
    if (content.includes('=') && !content.includes('event ')) {
      suggestions.push('Consider emitting events for important state changes');
    }
  }

  private isBuiltinFunction(name: string): boolean {
    const builtins = [
      'require', 'assert', 'revert', 'keccak256', 'sha256', 'ripemd160',
      'ecrecover', 'addmod', 'mulmod', 'selfdestruct', 'suicide'
    ];
    return builtins.includes(name);
  }
}
