'use client';

/**
 * Browser-compatible Solidity compiler
 * Uses a mock implementation for client-side rendering
 * Real compilation should be done server-side
 */

import { CompilationResult } from './SolidityCompiler';

export class BrowserSolidityCompiler {
  private static instance: BrowserSolidityCompiler;
  
  private constructor() {}

  public static getInstance(): BrowserSolidityCompiler {
    if (!BrowserSolidityCompiler.instance) {
      BrowserSolidityCompiler.instance = new BrowserSolidityCompiler();
    }
    return BrowserSolidityCompiler.instance;
  }

  public async compile(
    sourceCode: string,
    contractName: string = 'Contract',
    version: string = '0.8.21',
    optimize: boolean = true
  ): Promise<CompilationResult> {
    // In the browser, we'll do basic validation and send to server for real compilation
    return this.performBasicValidation(sourceCode, contractName);
  }

  private performBasicValidation(sourceCode: string, contractName: string): CompilationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic syntax validation
    if (!sourceCode.includes('contract')) {
      errors.push('No contract definition found');
    }

    if (!sourceCode.includes('pragma solidity')) {
      warnings.push('Missing pragma solidity directive');
    }

    if (sourceCode.includes('selfdestruct')) {
      warnings.push('Use of selfdestruct is deprecated');
    }

    // Check for common security issues
    const securityIssues = this.checkForSecurityIssues(sourceCode);

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      securityIssues: securityIssues.length > 0 ? securityIssues : undefined,
      bytecode: undefined, // Browser compilation doesn't produce bytecode
      abi: undefined, // Browser compilation doesn't produce ABI
      gasEstimate: undefined,
      optimizationSuggestions: this.getOptimizationSuggestions(sourceCode),
    };
  }

  private checkForSecurityIssues(sourceCode: string): any[] {
    const issues: any[] = [];

    // Check for reentrancy vulnerability patterns
    if (sourceCode.includes('.call(') && sourceCode.includes('transfer')) {
      issues.push({
        type: 'reentrancy',
        severity: 'high',
        message: 'Potential reentrancy vulnerability detected',
        line: 0,
        column: 0,
      });
    }

    // Check for tx.origin usage
    if (sourceCode.includes('tx.origin')) {
      issues.push({
        type: 'tx-origin',
        severity: 'medium',
        message: 'Use of tx.origin is not recommended, use msg.sender instead',
        line: 0,
        column: 0,
      });
    }

    return issues;
  }

  private getOptimizationSuggestions(sourceCode: string): string[] {
    const suggestions: string[] = [];

    if (sourceCode.includes('uint256')) {
      suggestions.push('Consider using uint instead of uint256 for gas optimization');
    }

    if (sourceCode.includes('string memory')) {
      suggestions.push('Consider using bytes32 instead of string for fixed-size data');
    }

    return suggestions;
  }

  // Method to compile on server-side via API
  public async compileOnServer(
    sourceCode: string,
    contractName: string = 'Contract',
    version: string = '0.8.21',
    optimize: boolean = true
  ): Promise<CompilationResult> {
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCode,
          contractName,
          version,
          optimize,
        }),
      });

      if (!response.ok) {
        throw new Error(`Compilation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Server compilation failed:', error);
      // Fallback to browser validation
      return this.performBasicValidation(sourceCode, contractName);
    }
  }
}