import solc from 'solc';
import { SecurityIssue } from '@/types/security';

export interface CompilationResult {
  success: boolean;
  bytecode?: string;
  abi?: unknown[];
  errors?: string[];
  warnings?: string[];
  gasEstimate?: number;
  securityIssues?: SecurityIssue[];
  optimizationSuggestions?: string[];
}

export class SolidityCompiler {
  private static instance: SolidityCompiler;
  private compilerVersions: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): SolidityCompiler {
    if (!SolidityCompiler.instance) {
      SolidityCompiler.instance = new SolidityCompiler();
    }
    return SolidityCompiler.instance;
  }

  public async compile(
    sourceCode: string,
    contractName: string = 'Contract',
    version: string = '0.8.21',
    optimize: boolean = true
  ): Promise<CompilationResult> {
    try {
      // Load compiler version if not cached
      if (!this.compilerVersions.has(version)) {
        await this.loadCompilerVersion(version);
      }

      const compiler = this.compilerVersions.get(version);
      if (!compiler) {
        throw new Error(`Compiler version ${version} not available`);
      }

      // Prepare compilation input
      const input = {
        language: 'Solidity',
        sources: {
          [`${contractName}.sol`]: {
            content: sourceCode
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          },
          optimizer: {
            enabled: optimize,
            runs: 200
          }
        }
      };

      // Compile the contract
      const output = JSON.parse(compiler.compile(JSON.stringify(input)));
      
      const result: CompilationResult = {
        success: !output.errors || output.errors.length === 0,
        errors: [],
        warnings: []
      };

      // Process errors and warnings
      if (output.errors) {
        for (const error of output.errors) {
          if (error.severity === 'error') {
            result.errors!.push(error.formattedMessage);
          } else {
            result.warnings!.push(error.formattedMessage);
          }
        }
      }

      // Extract compilation artifacts if successful
      if (output.contracts && output.contracts[`${contractName}.sol`]) {
        const contract = output.contracts[`${contractName}.sol`][contractName];
        if (contract) {
          result.bytecode = contract.evm?.bytecode?.object;
          result.abi = contract.abi;
          result.gasEstimate = this.estimateGas(contract);
        }
      }

      // Perform security analysis
      result.securityIssues = await this.analyzeSecurityIssues(sourceCode);
      
      // Generate optimization suggestions
      result.optimizationSuggestions = this.generateOptimizationSuggestions(sourceCode);
      
      return result;
    } catch (error) {
      return {
        success: false,
        errors: [`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private async loadCompilerVersion(version: string): Promise<void> {
    try {
      // In a real implementation, you would load the specific compiler version
      // For now, we'll use the bundled version
      this.compilerVersions.set(version, solc);
    } catch (error) {
      throw new Error(`Failed to load compiler version ${version}: ${error}`);
    }
  }

  private estimateGas(contract: any): number {
    // Estimate gas based on bytecode size and complexity
    const bytecodeSize = contract.evm?.bytecode?.object?.length || 0;
    const baseGas = 21000;
    const bytecodeGas = Math.floor(bytecodeSize / 2) * 200;
    return baseGas + bytecodeGas;
  }

  private async analyzeSecurityIssues(sourceCode: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check for common security patterns
    const patterns = [
      {
        pattern: /tx\.origin/g,
        severity: 'high' as const,
        message: 'Using tx.origin for authentication is vulnerable to phishing attacks'
      },
      {
        pattern: /block\.timestamp/g,
        severity: 'medium' as const,
        message: 'Using block.timestamp can be manipulated by miners'
      },
      {
        pattern: /\.call\{value:/g,
        severity: 'medium' as const,
        message: 'Low-level calls should be avoided when possible'
      },
      {
        pattern: /selfdestruct/g,
        severity: 'high' as const,
        message: 'selfdestruct can be dangerous and is deprecated'
      }
    ];

    for (const { pattern, severity, message } of patterns) {
      const matches = sourceCode.match(pattern);
      if (matches) {
        issues.push({
          severity,
          message,
          line: this.getLineNumber(sourceCode, pattern),
          type: 'security'
        });
      }
    }

    return issues;
  }

  private generateOptimizationSuggestions(sourceCode: string): string[] {
    const suggestions: string[] = [];

    // Check for optimization opportunities
    if (sourceCode.includes('storage') && sourceCode.includes('for')) {
      suggestions.push('Consider caching storage variables in memory within loops');
    }

    if (sourceCode.match(/uint\d+/g)?.filter(match => match !== 'uint256').length) {
      suggestions.push('Use uint256 instead of smaller uint types to save gas');
    }

    if (sourceCode.includes('public') && !sourceCode.includes('external')) {
      suggestions.push('Consider using external instead of public for functions only called externally');
    }

    if (sourceCode.includes('require') && sourceCode.includes('&&')) {
      suggestions.push('Split require statements with && conditions into multiple requires for better error messages');
    }

    return suggestions;
  }

  private getLineNumber(sourceCode: string, pattern: RegExp): number {
    const lines = sourceCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 0;
  }
}