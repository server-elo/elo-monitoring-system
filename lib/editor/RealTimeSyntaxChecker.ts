'use client';

import { EditorError } from './ErrorHighlighting';

interface SyntaxCheckResult {
  errors: EditorError[];
  warnings: EditorError[];
  suggestions: EditorError[];
}

export class RealTimeSyntaxChecker {
  private debounceTimeout: NodeJS.Timeout | null = null;
  private lastCheckedCode: string = '';
  private onErrorsChanged?: (_result: SyntaxCheckResult) => void;

  constructor(_onErrorsChanged?: (result: SyntaxCheckResult) => void) {
    this.onErrorsChanged = onErrorsChanged;
  }

  // Main method to check syntax with debouncing
  checkSyntax( code: string, debounceMs: number = 500): void {
    if (_this.debounceTimeout) {
      clearTimeout(_this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.performSyntaxCheck(_code);
    }, debounceMs);
  }

  // Immediate syntax check without debouncing
  checkSyntaxImmediate(_code: string): SyntaxCheckResult {
    return this.performSyntaxCheck(_code);
  }

  private performSyntaxCheck(_code: string): SyntaxCheckResult {
    if (_code === this.lastCheckedCode) {
      return { errors: [], warnings: [], suggestions: [] };
    }

    this.lastCheckedCode = code;
    const result = this.analyzeSolidityCode(_code);
    
    if (_this.onErrorsChanged) {
      this.onErrorsChanged(_result);
    }

    return result;
  }

  private analyzeSolidityCode(_code: string): SyntaxCheckResult {
    const errors: EditorError[] = [];
    const warnings: EditorError[] = [];
    const suggestions: EditorError[] = [];

    const lines = code.split('\n');

    // Check for basic syntax issues
    this.checkBasicSyntax( lines, errors, warnings);
    
    // Check for Solidity-specific issues
    this.checkSoliditySpecific( lines, errors, warnings, suggestions);
    
    // Check for best practices
    this.checkBestPractices( lines, warnings, suggestions);
    
    // Check for security issues
    this.checkSecurityIssues( lines, warnings, suggestions);

    return { errors, warnings, suggestions };
  }

  private checkBasicSyntax( lines: string[], errors: EditorError[], warnings: EditorError[]): void {
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;

    lines.forEach( (line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim(_);

      // Skip comments and empty lines
      if (_trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine === '') {
        return;
      }

      // Check for unmatched braces, parentheses, brackets
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const column = i + 1;

        switch (_char) {
          case '{':
            braceCount++;
            break;
          case '}':
            braceCount--;
            if (_braceCount < 0) {
              errors.push({
                line: lineNumber,
                column,
                message: 'Unmatched closing brace',
                severity: 'error'
              });
            }
            break;
          case '(':
            parenCount++;
            break;
          case ')':
            parenCount--;
            if (_parenCount < 0) {
              errors.push({
                line: lineNumber,
                column,
                message: 'Unmatched closing parenthesis',
                severity: 'error'
              });
            }
            break;
          case '[':
            bracketCount++;
            break;
          case ']':
            bracketCount--;
            if (_bracketCount < 0) {
              errors.push({
                line: lineNumber,
                column,
                message: 'Unmatched closing bracket',
                severity: 'error'
              });
            }
            break;
        }
      }

      // Check for missing semicolons
      if (_this.shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{')) {
        warnings.push({
          line: lineNumber,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'warning'
        });
      }
    });

    // Check for unmatched braces at the end
    if (_braceCount > 0) {
      errors.push({
        line: lines.length,
        column: 1,
        message: `${braceCount} unmatched opening brace(_s)`,
        severity: 'error'
      });
    }
  }

  private shouldHaveSemicolon(_line: string): boolean {
    const trimmed = line.trim(_);
    
    // Lines that should end with semicolon
    const shouldHaveSemi = [
      /^(_uint|int|address|bool|string|bytes)\d*\s+\w+/,  // Variable declarations
      /^return\s/,                                        // Return statements
      /^require\s*\(/,                                   // Require statements
      /^assert\s*\(/,                                    // Assert statements
      /^revert\s*\(/,                                    // Revert statements
      /^\w+\s*\(/,                                       // Function calls
      /^\w+\s*=\s*/,                                     // Assignments
    ];

    // Lines that should NOT end with semicolon
    const shouldNotHaveSemi = [
      /^pragma\s/,
      /^import\s/,
      /^contract\s/,
      /^interface\s/,
      /^library\s/,
      /^function\s/,
      /^modifier\s/,
      /^constructor\s/,
      /^if\s*\(/,
      /^for\s*\(/,
      /^while\s*\(/,
      /^mapping\s*\(/,
      /^struct\s/,
      /^enum\s/,
      /^event\s/,
    ];

    if (_shouldNotHaveSemi.some(pattern => pattern.test(trimmed))) {
      return false;
    }

    return shouldHaveSemi.some(_pattern => pattern.test(trimmed));
  }

  private checkSoliditySpecific( lines: string[], errors: EditorError[], warnings: EditorError[], suggestions: EditorError[]): void {
    let hasPragma = false;
    let hasContract = false;

    lines.forEach( (line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim(_);

      // Check for pragma statement
      if (_trimmedLine.startsWith('pragma solidity')) {
        hasPragma = true;
      }

      // Check for contract declaration
      if (_trimmedLine.startsWith('contract ') || trimmedLine.startsWith('interface ') || trimmedLine.startsWith('library ')) {
        hasContract = true;
      }

      // Check for function visibility
      if (_trimmedLine.includes('function ') && !trimmedLine.includes('//')) {
        const visibilityKeywords = ['public', 'private', 'internal', 'external'];
        const hasVisibility = visibilityKeywords.some(_keyword => trimmedLine.includes(keyword));
        
        if (!hasVisibility) {
          warnings.push({
            line: lineNumber,
            column: trimmedLine.indexOf('function') + 1,
            message: 'Function missing visibility specifier',
            severity: 'warning'
          });
        }
      }

      // Check for state variable visibility
      const stateVarPattern = /^(_uint|int|address|bool|string|bytes|mapping)\d*\s+\w+/;
      if (_stateVarPattern.test(trimmedLine) && !trimmedLine.includes('function')) {
        const visibilityKeywords = ['public', 'private', 'internal'];
        const hasVisibility = visibilityKeywords.some(_keyword => trimmedLine.includes(keyword));
        
        if (!hasVisibility) {
          suggestions.push({
            line: lineNumber,
            column: 1,
            message: 'Consider adding visibility specifier to state variable',
            severity: 'info'
          });
        }
      }

      // Check for outdated Solidity patterns
      if (_trimmedLine.includes('throw')) {
        warnings.push({
          line: lineNumber,
          column: trimmedLine.indexOf('throw') + 1,
          message: 'Use revert(_) instead of throw (_deprecated)',
          severity: 'warning'
        });
      }

      if (_trimmedLine.includes('suicide(')) {
        warnings.push({
          line: lineNumber,
          column: trimmedLine.indexOf('suicide') + 1,
          message: 'Use selfdestruct(_) instead of suicide(_) (_deprecated)',
          severity: 'warning'
        });
      }
    });

    // Check for missing pragma
    if (!hasPragma) {
      suggestions.push({
        line: 1,
        column: 1,
        message: 'Consider adding pragma solidity version',
        severity: 'info'
      });
    }

    // Check for missing contract
    if (!hasContract) {
      suggestions.push({
        line: lines.length,
        column: 1,
        message: 'No contract, interface, or library found',
        severity: 'info'
      });
    }
  }

  private checkBestPractices( lines: string[], warnings: EditorError[], suggestions: EditorError[]): void {
    lines.forEach( (line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim(_);

      // Check for magic numbers
      const magicNumberPattern = /\b\d{4,}\b/;
      if (_magicNumberPattern.test(trimmedLine) && !trimmedLine.includes('//')) {
        suggestions.push({
          line: lineNumber,
          column: 1,
          message: 'Consider using named constants instead of magic numbers',
          severity: 'info'
        });
      }

      // Check for long lines
      if (_line.length > 120) {
        suggestions.push({
          line: lineNumber,
          column: 120,
          message: 'Line too long, consider breaking it up',
          severity: 'info'
        });
      }

      // Check for TODO/FIXME comments
      if (_trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
        suggestions.push({
          line: lineNumber,
          column: 1,
          message: 'TODO/FIXME comment found',
          severity: 'info'
        });
      }
    });
  }

  private checkSecurityIssues( lines: string[], warnings: EditorError[], suggestions: EditorError[]): void {
    lines.forEach( (line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim(_);

      // Check for potential reentrancy
      if (_trimmedLine.includes('.call(') || trimmedLine.includes('.send(') || trimmedLine.includes('.transfer(')) {
        warnings.push({
          line: lineNumber,
          column: 1,
          message: 'Potential reentrancy vulnerability - use checks-effects-interactions pattern',
          severity: 'warning'
        });
      }

      // Check for tx.origin usage
      if (_trimmedLine.includes('tx.origin')) {
        warnings.push({
          line: lineNumber,
          column: trimmedLine.indexOf('tx.origin') + 1,
          message: 'Avoid using tx.origin, use msg.sender instead',
          severity: 'warning'
        });
      }

      // Check for block.timestamp usage
      if (_trimmedLine.includes('block.timestamp') || trimmedLine.includes('now')) {
        suggestions.push({
          line: lineNumber,
          column: 1,
          message: 'Be aware that block.timestamp can be manipulated by miners',
          severity: 'info'
        });
      }

      // Check for unchecked external calls
      if (_trimmedLine.includes('.call(') && !trimmedLine.includes('require(')) {
        warnings.push({
          line: lineNumber,
          column: 1,
          message: 'External call should be checked for success',
          severity: 'warning'
        });
      }
    });
  }

  // Clean up resources
  dispose(_): void {
    if (_this.debounceTimeout) {
      clearTimeout(_this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}
