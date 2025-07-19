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
  private onErrorsChanged?: (result: SyntaxCheckResult) => void;

  constructor(onErrorsChanged?: (result: SyntaxCheckResult) => void) {
    this.onErrorsChanged = onErrorsChanged;
  }

  // Main method to check syntax with debouncing
  checkSyntax(code: string, debounceMs: number = 500): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.performSyntaxCheck(code);
    }, debounceMs);
  }

  // Immediate syntax check without debouncing
  checkSyntaxImmediate(code: string): SyntaxCheckResult {
    return this.performSyntaxCheck(code);
  }

  private performSyntaxCheck(code: string): SyntaxCheckResult {
    if (code === this.lastCheckedCode) {
      return { errors: [], warnings: [], suggestions: [] };
    }

    this.lastCheckedCode = code;
    const result = this.analyzeSolidityCode(code);
    
    if (this.onErrorsChanged) {
      this.onErrorsChanged(result);
    }

    return result;
  }

  private analyzeSolidityCode(code: string): SyntaxCheckResult {
    const errors: EditorError[] = [];
    const warnings: EditorError[] = [];
    const suggestions: EditorError[] = [];

    const lines = code.split('\n');

    // Check for basic syntax issues
    this.checkBasicSyntax(lines, errors, warnings);
    
    // Check for Solidity-specific issues
    this.checkSoliditySpecific(lines, errors, warnings, suggestions);
    
    // Check for best practices
    this.checkBestPractices(lines, warnings, suggestions);
    
    // Check for security issues
    this.checkSecurityIssues(lines, warnings, suggestions);

    return { errors, warnings, suggestions };
  }

  private checkBasicSyntax(lines: string[], errors: EditorError[], warnings: EditorError[]): void {
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine === '') {
        return;
      }

      // Check for unmatched braces, parentheses, brackets
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const column = i + 1;

        switch (char) {
          case '{':
            braceCount++;
            break;
          case '}':
            braceCount--;
            if (braceCount < 0) {
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
            if (parenCount < 0) {
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
            if (bracketCount < 0) {
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
      if (this.shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{')) {
        warnings.push({
          line: lineNumber,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'warning'
        });
      }
    });

    // Check for unmatched braces at the end
    if (braceCount > 0) {
      errors.push({
        line: lines.length,
        column: 1,
        message: `${braceCount} unmatched opening brace(s)`,
        severity: 'error'
      });
    }
  }

  private shouldHaveSemicolon(line: string): boolean {
    const trimmed = line.trim();
    
    // Lines that should end with semicolon
    const shouldHaveSemi = [
      /^(uint|int|address|bool|string|bytes)\d*\s+\w+/,  // Variable declarations
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

    if (shouldNotHaveSemi.some(pattern => pattern.test(trimmed))) {
      return false;
    }

    return shouldHaveSemi.some(pattern => pattern.test(trimmed));
  }

  private checkSoliditySpecific(lines: string[], errors: EditorError[], warnings: EditorError[], suggestions: EditorError[]): void {
    let hasPragma = false;
    let hasContract = false;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Check for pragma statement
      if (trimmedLine.startsWith('pragma solidity')) {
        hasPragma = true;
      }

      // Check for contract declaration
      if (trimmedLine.startsWith('contract ') || trimmedLine.startsWith('interface ') || trimmedLine.startsWith('library ')) {
        hasContract = true;
      }

      // Check for function visibility
      if (trimmedLine.includes('function ') && !trimmedLine.includes('//')) {
        const visibilityKeywords = ['public', 'private', 'internal', 'external'];
        const hasVisibility = visibilityKeywords.some(keyword => trimmedLine.includes(keyword));
        
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
      const stateVarPattern = /^(uint|int|address|bool|string|bytes|mapping)\d*\s+\w+/;
      if (stateVarPattern.test(trimmedLine) && !trimmedLine.includes('function')) {
        const visibilityKeywords = ['public', 'private', 'internal'];
        const hasVisibility = visibilityKeywords.some(keyword => trimmedLine.includes(keyword));
        
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
      if (trimmedLine.includes('throw')) {
        warnings.push({
          line: lineNumber,
          column: trimmedLine.indexOf('throw') + 1,
          message: 'Use revert() instead of throw (deprecated)',
          severity: 'warning'
        });
      }

      if (trimmedLine.includes('suicide(')) {
        warnings.push({
          line: lineNumber,
          column: trimmedLine.indexOf('suicide') + 1,
          message: 'Use selfdestruct() instead of suicide() (deprecated)',
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

  private checkBestPractices(lines: string[], warnings: EditorError[], suggestions: EditorError[]): void {
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Check for magic numbers
      const magicNumberPattern = /\b\d{4,}\b/;
      if (magicNumberPattern.test(trimmedLine) && !trimmedLine.includes('//')) {
        suggestions.push({
          line: lineNumber,
          column: 1,
          message: 'Consider using named constants instead of magic numbers',
          severity: 'info'
        });
      }

      // Check for long lines
      if (line.length > 120) {
        suggestions.push({
          line: lineNumber,
          column: 120,
          message: 'Line too long, consider breaking it up',
          severity: 'info'
        });
      }

      // Check for TODO/FIXME comments
      if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
        suggestions.push({
          line: lineNumber,
          column: 1,
          message: 'TODO/FIXME comment found',
          severity: 'info'
        });
      }
    });
  }

  private checkSecurityIssues(lines: string[], warnings: EditorError[], suggestions: EditorError[]): void {
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Check for potential reentrancy
      if (trimmedLine.includes('.call(') || trimmedLine.includes('.send(') || trimmedLine.includes('.transfer(')) {
        warnings.push({
          line: lineNumber,
          column: 1,
          message: 'Potential reentrancy vulnerability - use checks-effects-interactions pattern',
          severity: 'warning'
        });
      }

      // Check for tx.origin usage
      if (trimmedLine.includes('tx.origin')) {
        warnings.push({
          line: lineNumber,
          column: trimmedLine.indexOf('tx.origin') + 1,
          message: 'Avoid using tx.origin, use msg.sender instead',
          severity: 'warning'
        });
      }

      // Check for block.timestamp usage
      if (trimmedLine.includes('block.timestamp') || trimmedLine.includes('now')) {
        suggestions.push({
          line: lineNumber,
          column: 1,
          message: 'Be aware that block.timestamp can be manipulated by miners',
          severity: 'info'
        });
      }

      // Check for unchecked external calls
      if (trimmedLine.includes('.call(') && !trimmedLine.includes('require(')) {
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
  dispose(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}
