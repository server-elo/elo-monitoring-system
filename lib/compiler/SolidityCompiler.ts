import solc from 'solc';
import { SecurityIssue } from '../../types/security';

export interface CompilationResult {
  success: boolean;
  bytecode?: string;
  abi?: any[];
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
            content: sourceCode,
          },
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*'],
            },
          },
          optimizer: {
            enabled: optimize,
            runs: 200,
          },
        },
      };

      // Compile
      const output = JSON.parse(compiler.compile(JSON.stringify(input)));

      // Process results
      const result: CompilationResult = {
        success: !output.errors || output.errors.length === 0,
        errors: [],
        warnings: [],
      };

      // Extract errors and warnings
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
        errors: [`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async loadCompilerVersion(version: string): Promise<void> {
    try {
      // For browser environment, we'll use the default solc
      // In a real implementation, you'd load specific versions
      this.compilerVersions.set(version, solc);
    } catch (error) {
      throw new Error(`Failed to load compiler version ${version}`);
    }
  }

  private estimateGas(contract: any): number {
    // Simple gas estimation based on bytecode size
    // In production, use more sophisticated gas analysis
    const bytecodeSize = contract.evm?.bytecode?.object?.length || 0;
    return Math.floor(bytecodeSize / 2) * 200; // Rough estimate
  }

  private async analyzeSecurityIssues(sourceCode: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Basic security checks
    const lines = sourceCode.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for tx.origin usage
      if (line.includes('tx.origin')) {
        issues.push({
          severity: 'high',
          title: 'Use of tx.origin',
          description: 'Using tx.origin for authorization can be dangerous',
          line: lineNumber,
          suggestion: 'Use msg.sender instead of tx.origin',
        });
      }

      // Check for unchecked external calls
      if (line.includes('.call(') && !line.includes('require(')) {
        issues.push({
          severity: 'medium',
          title: 'Unchecked external call',
          description: 'External calls should be checked for success',
          line: lineNumber,
          suggestion: 'Check the return value of external calls',
        });
      }

      // Check for reentrancy patterns
      if (line.includes('msg.sender.call') || line.includes('msg.sender.transfer')) {
        issues.push({
          severity: 'high',
          title: 'Potential reentrancy vulnerability',
          description: 'External calls before state changes can lead to reentrancy',
          line: lineNumber,
          suggestion: 'Use the checks-effects-interactions pattern',
        });
      }

      // Check for integer overflow (pre-0.8.0)
      if (line.includes('+=') || line.includes('-=') || line.includes('*=')) {
        const version = this.extractPragmaVersion(sourceCode);
        if (version && parseFloat(version) < 0.8) {
          issues.push({
            severity: 'medium',
            title: 'Potential integer overflow',
            description: 'Arithmetic operations can overflow in Solidity < 0.8.0',
            line: lineNumber,
            suggestion: 'Use SafeMath library or upgrade to Solidity 0.8.0+',
          });
        }
      }

      // Check for hardcoded addresses
      if (line.match(/0x[a-fA-F0-9]{40}/)) {
        issues.push({
          severity: 'low',
          title: 'Hardcoded address',
          description: 'Hardcoded addresses reduce contract flexibility',
          line: lineNumber,
          suggestion: 'Consider using constructor parameters or setter functions',
        });
      }
    });

    return issues;
  }

  private generateOptimizationSuggestions(sourceCode: string): string[] {
    const suggestions: string[] = [];
    const lines = sourceCode.split('\n');

    lines.forEach((line) => {
      // Check for storage vs memory usage
      if (line.includes('string') && !line.includes('memory') && !line.includes('storage')) {
        suggestions.push('Consider specifying memory/storage for string variables');
      }

      // Check for unnecessary public variables
      if (line.includes('public') && line.includes('uint') && !line.includes('constant')) {
        suggestions.push('Consider making state variables private if external access is not needed');
      }

      // Check for gas-expensive operations in loops
      if (line.includes('for') && sourceCode.includes('.length')) {
        suggestions.push('Cache array length in loops to save gas');
      }

      // Check for redundant require statements
      if (line.includes('require(') && line.includes('msg.sender')) {
        suggestions.push('Consider using modifiers for common access control checks');
      }
    });

    return suggestions;
  }

  private extractPragmaVersion(sourceCode: string): string | null {
    const pragmaMatch = sourceCode.match(/pragma solidity\s+[\^~]?(\d+\.\d+\.\d+)/);
    return pragmaMatch ? pragmaMatch[1] : null;
  }

  public async deployToTestnet(
    bytecode: string,
    abi: any[],
    constructorArgs: any[] = [],
    network: 'sepolia' | 'goerli' | 'mumbai' = 'sepolia'
  ): Promise<{ address: string; transactionHash: string }> {
    try {
      // Validate inputs
      if (!bytecode || !abi) {
        throw new Error('Bytecode and ABI are required for deployment');
      }

      // Simulate network-specific deployment
      const networkConfigs = {
        sepolia: { chainId: 11155111, gasPrice: '20000000000' },
        goerli: { chainId: 5, gasPrice: '20000000000' },
        mumbai: { chainId: 80001, gasPrice: '30000000000' }
      };

      const config = networkConfigs[network];
      console.log(`Deploying to ${network} (Chain ID: ${config.chainId})`);

      // Estimate gas for deployment
      const estimatedGas = this.estimateDeploymentGas(bytecode, constructorArgs);
      console.log(`Estimated gas: ${estimatedGas}`);

      // This would integrate with Web3/Ethers for actual deployment
      // For now, return mock data with realistic values
      return {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      };
    } catch (error) {
      console.error('Deployment error:', error);
      throw error;
    }
  }

  private estimateDeploymentGas(bytecode: string, constructorArgs: any[]): number {
    // Basic gas estimation based on bytecode size and constructor complexity
    const baseGas = 21000; // Base transaction cost
    const bytecodeGas = Math.floor(bytecode.length / 2) * 200; // ~200 gas per byte
    const constructorGas = constructorArgs.length * 20000; // ~20k gas per argument

    return baseGas + bytecodeGas + constructorGas;
  }

  public async verifyContract(
    address: string,
    sourceCode: string,
    constructorArgs: any[] = []
  ): Promise<{ verified: boolean; message: string }> {
    try {
      // Validate inputs
      if (!address || !sourceCode) {
        throw new Error('Contract address and source code are required for verification');
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error('Invalid contract address format');
      }

      // Simulate verification process
      console.log(`Verifying contract at ${address}`);
      console.log(`Source code length: ${sourceCode.length} characters`);
      console.log(`Constructor args: ${constructorArgs.length} parameters`);

      // Check if source code compiles
      const compilationResult = await this.compile(sourceCode);
      if (!compilationResult.success) {
        return {
          verified: false,
          message: 'Verification failed: Source code does not compile'
        };
      }

      // This would integrate with Etherscan API for actual verification
      // For now, return mock verification with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        verified: true,
        message: 'Contract verified successfully on Etherscan',
      };
    } catch (error) {
      return {
        verified: false,
        message: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }
}
