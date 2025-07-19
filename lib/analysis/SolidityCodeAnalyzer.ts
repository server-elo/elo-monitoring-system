'use client';

export interface AnalysisIssue {
  id: string;
  type: 'security' | 'gas' | 'style' | 'bug' | 'optimization';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  rule: string;
  suggestion?: string;
  autoFixable?: boolean;
  gasImpact?: number;
  references?: string[];
}

export interface OptimizationSuggestion {
  id: string;
  type: 'gas' | 'storage' | 'computation' | 'memory';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings?: number;
  line: number;
  column: number;
  originalCode: string;
  optimizedCode: string;
  explanation: string;
}

export interface SecurityVulnerability {
  id: string;
  type: 'reentrancy' | 'overflow' | 'access-control' | 'timestamp' | 'tx-origin' | 'dos' | 'front-running';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  line: number;
  column: number;
  mitigation: string;
  references: string[];
  cwe?: string;
  swc?: string;
}

export interface AnalysisResult {
  issues: AnalysisIssue[];
  optimizations: OptimizationSuggestion[];
  vulnerabilities: SecurityVulnerability[];
  gasEstimate: {
    deployment: number;
    functions: Record<string, number>;
    total: number;
  };
  complexity: {
    cyclomatic: number;
    cognitive: number;
    lines: number;
  };
  quality: {
    score: number;
    maintainability: number;
    testability: number;
    documentation: number;
  };
}

/**
 * Advanced Solidity code analyzer for security, gas optimization,
 * and code quality analysis
 */
export class SolidityCodeAnalyzer {
  private securityRules: Map<string, (code: string, lines: string[]) => SecurityVulnerability[]> = new Map();
  private gasOptimizationRules: Map<string, (code: string, lines: string[]) => OptimizationSuggestion[]> = new Map();
  private styleRules: Map<string, (code: string, lines: string[]) => AnalysisIssue[]> = new Map();

  constructor() {
    this.initializeSecurityRules();
    this.initializeGasOptimizationRules();
    this.initializeStyleRules();
  }

  /**
   * Perform comprehensive code analysis
   */
  analyze(code: string): AnalysisResult {
    const lines = code.split('\n');
    
    const issues: AnalysisIssue[] = [];
    const optimizations: OptimizationSuggestion[] = [];
    const vulnerabilities: SecurityVulnerability[] = [];

    // Run security analysis
    this.securityRules.forEach((rule, ruleName) => {
      try {
        const ruleVulnerabilities = rule(code, lines);
        vulnerabilities.push(...ruleVulnerabilities);
      } catch (error) {
        console.error(`Security rule ${ruleName} failed:`, error);
      }
    });

    // Run gas optimization analysis
    this.gasOptimizationRules.forEach((rule, ruleName) => {
      try {
        const ruleOptimizations = rule(code, lines);
        optimizations.push(...ruleOptimizations);
      } catch (error) {
        console.error(`Gas optimization rule ${ruleName} failed:`, error);
      }
    });

    // Run style analysis
    this.styleRules.forEach((rule, ruleName) => {
      try {
        const ruleIssues = rule(code, lines);
        issues.push(...ruleIssues);
      } catch (error) {
        console.error(`Style rule ${ruleName} failed:`, error);
      }
    });

    // Calculate metrics
    const gasEstimate = this.calculateGasEstimate(code, lines);
    const complexity = this.calculateComplexity(code, lines);
    const quality = this.calculateQuality(code, lines, issues, vulnerabilities);

    return {
      issues,
      optimizations,
      vulnerabilities,
      gasEstimate,
      complexity,
      quality
    };
  }

  /**
   * Initialize security analysis rules
   */
  private initializeSecurityRules(): void {
    // Reentrancy detection
    this.securityRules.set('reentrancy', (_code, lines) => {
      const vulnerabilities: SecurityVulnerability[] = [];
      
      lines.forEach((line, index) => {
        // Check for external calls before state changes
        if (line.includes('.call(') || line.includes('.send(') || line.includes('.transfer(')) {
          // Look for state changes after the call
          for (let i = index + 1; i < Math.min(index + 10, lines.length); i++) {
            if (lines[i].match(/\w+\s*=/) || lines[i].includes('++') || lines[i].includes('--')) {
              vulnerabilities.push({
                id: `reentrancy-${index}`,
                type: 'reentrancy',
                severity: 'high',
                title: 'Potential Reentrancy Vulnerability',
                description: 'State changes after external call may be vulnerable to reentrancy attacks',
                line: index + 1,
                column: line.indexOf('.call(') + 1,
                mitigation: 'Use the checks-effects-interactions pattern or reentrancy guards',
                references: [
                  'https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/',
                  'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol'
                ],
                swc: 'SWC-107'
              });
              break;
            }
          }
        }
      });

      return vulnerabilities;
    });

    // tx.origin usage
    this.securityRules.set('tx-origin', (_code, lines) => {
      const vulnerabilities: SecurityVulnerability[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('tx.origin')) {
          vulnerabilities.push({
            id: `tx-origin-${index}`,
            type: 'tx-origin',
            severity: 'medium',
            title: 'Use of tx.origin',
            description: 'tx.origin should not be used for authorization as it can be manipulated',
            line: index + 1,
            column: line.indexOf('tx.origin') + 1,
            mitigation: 'Use msg.sender instead of tx.origin for authorization',
            references: [
              'https://consensys.github.io/smart-contract-best-practices/development-recommendations/solidity-specific/tx-origin/'
            ],
            swc: 'SWC-115'
          });
        }
      });

      return vulnerabilities;
    });

    // Timestamp dependence
    this.securityRules.set('timestamp-dependence', (_code, lines) => {
      const vulnerabilities: SecurityVulnerability[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('block.timestamp') || line.includes('now')) {
          // Check if used in critical logic
          if (line.includes('require') || line.includes('if') || line.includes('=')) {
            vulnerabilities.push({
              id: `timestamp-${index}`,
              type: 'timestamp',
              severity: 'low',
              title: 'Timestamp Dependence',
              description: 'Block timestamp can be manipulated by miners within certain bounds',
              line: index + 1,
              column: line.indexOf('block.timestamp') !== -1 ? 
                line.indexOf('block.timestamp') + 1 : line.indexOf('now') + 1,
              mitigation: 'Avoid using block.timestamp for critical logic or use block.number instead',
              references: [
                'https://consensys.github.io/smart-contract-best-practices/development-recommendations/solidity-specific/timestamp-dependence/'
              ],
              swc: 'SWC-116'
            });
          }
        }
      });

      return vulnerabilities;
    });

    // Unchecked external calls
    this.securityRules.set('unchecked-calls', (_code, lines) => {
      const vulnerabilities: SecurityVulnerability[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('.call(') || line.includes('.delegatecall(')) {
          // Check if return value is checked
          if (!line.includes('require(') && !line.includes('if') && !line.includes('bool')) {
            vulnerabilities.push({
              id: `unchecked-call-${index}`,
              type: 'access-control',
              severity: 'medium',
              title: 'Unchecked External Call',
              description: 'External call return value is not checked',
              line: index + 1,
              column: line.indexOf('.call(') !== -1 ? 
                line.indexOf('.call(') + 1 : line.indexOf('.delegatecall(') + 1,
              mitigation: 'Always check the return value of external calls',
              references: [
                'https://consensys.github.io/smart-contract-best-practices/development-recommendations/general/external-calls/'
              ],
              swc: 'SWC-104'
            });
          }
        }
      });

      return vulnerabilities;
    });
  }

  /**
   * Initialize gas optimization rules
   */
  private initializeGasOptimizationRules(): void {
    // Storage vs memory optimization
    this.gasOptimizationRules.set('storage-memory', (_code, lines) => {
      const optimizations: OptimizationSuggestion[] = [];
      
      lines.forEach((line, index) => {
        // Check for unnecessary storage reads
        const storageReads = line.match(/\w+\.\w+/g);
        if (storageReads && storageReads.length > 1) {
          // Check if the same storage variable is accessed multiple times
          const variables = new Set(storageReads);
          if (variables.size < storageReads.length) {
            optimizations.push({
              id: `storage-cache-${index}`,
              type: 'storage',
              title: 'Cache Storage Variables',
              description: 'Multiple reads from the same storage variable can be optimized',
              impact: 'medium',
              estimatedSavings: 100 * (storageReads.length - variables.size),
              line: index + 1,
              column: 1,
              originalCode: line.trim(),
              optimizedCode: `// Cache storage variable in memory\n${line.trim()}`,
              explanation: 'Reading from storage costs 200 gas, while reading from memory costs 3 gas'
            });
          }
        }
      });

      return optimizations;
    });

    // Loop optimization
    this.gasOptimizationRules.set('loop-optimization', (_code, lines) => {
      const optimizations: OptimizationSuggestion[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('for') && line.includes('.length')) {
          optimizations.push({
            id: `loop-cache-${index}`,
            type: 'computation',
            title: 'Cache Array Length',
            description: 'Array length should be cached before the loop to save gas',
            impact: 'low',
            estimatedSavings: 50,
            line: index + 1,
            column: line.indexOf('for') + 1,
            originalCode: line.trim(),
            optimizedCode: line.replace(/\.length/, 'Length').replace('for', 'uint length = array.length;\nfor'),
            explanation: 'Accessing .length in each iteration costs extra gas'
          });
        }
      });

      return optimizations;
    });

    // Unnecessary computations
    this.gasOptimizationRules.set('computation-optimization', (_code, lines) => {
      const optimizations: OptimizationSuggestion[] = [];
      
      lines.forEach((line, index) => {
        // Check for repeated calculations
        if (line.includes('*') || line.includes('/') || line.includes('%')) {
          // Simple heuristic for repeated calculations
          const calculations = line.match(/\w+\s*[\*\/\%]\s*\w+/g);
          if (calculations && calculations.length > 1) {
            optimizations.push({
              id: `computation-cache-${index}`,
              type: 'computation',
              title: 'Cache Computation Results',
              description: 'Repeated calculations can be cached to save gas',
              impact: 'low',
              estimatedSavings: 20,
              line: index + 1,
              column: 1,
              originalCode: line.trim(),
              optimizedCode: `// Cache computation result\n${line.trim()}`,
              explanation: 'Arithmetic operations cost gas and should be minimized'
            });
          }
        }
      });

      return optimizations;
    });

    // String concatenation optimization
    this.gasOptimizationRules.set('string-optimization', (_code, lines) => {
      const optimizations: OptimizationSuggestion[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('string(') && line.includes('abi.encodePacked')) {
          optimizations.push({
            id: `string-concat-${index}`,
            type: 'memory',
            title: 'Optimize String Concatenation',
            description: 'Use bytes.concat() instead of abi.encodePacked() for better gas efficiency',
            impact: 'low',
            estimatedSavings: 30,
            line: index + 1,
            column: line.indexOf('abi.encodePacked') + 1,
            originalCode: line.trim(),
            optimizedCode: line.replace('abi.encodePacked', 'bytes.concat'),
            explanation: 'bytes.concat() is more gas efficient than abi.encodePacked() for string concatenation'
          });
        }
      });

      return optimizations;
    });
  }

  /**
   * Initialize style rules
   */
  private initializeStyleRules(): void {
    // Naming conventions
    this.styleRules.set('naming-conventions', (_code, lines) => {
      const issues: AnalysisIssue[] = [];
      
      lines.forEach((line, index) => {
        // Check contract names (should be PascalCase)
        const contractMatch = line.match(/contract\s+([a-zA-Z_$][\w$]*)/);
        if (contractMatch) {
          const contractName = contractMatch[1];
          if (!contractName.match(/^[A-Z][a-zA-Z0-9]*$/)) {
            issues.push({
              id: `naming-contract-${index}`,
              type: 'style',
              severity: 'low',
              title: 'Contract Naming Convention',
              description: 'Contract names should use PascalCase',
              line: index + 1,
              column: line.indexOf(contractName) + 1,
              rule: 'naming-conventions',
              suggestion: `Rename to ${contractName.charAt(0).toUpperCase() + contractName.slice(1)}`
            });
          }
        }

        // Check function names (should be camelCase)
        const functionMatch = line.match(/function\s+([a-zA-Z_$][\w$]*)/);
        if (functionMatch) {
          const functionName = functionMatch[1];
          if (!functionName.match(/^[a-z][a-zA-Z0-9]*$/)) {
            issues.push({
              id: `naming-function-${index}`,
              type: 'style',
              severity: 'low',
              title: 'Function Naming Convention',
              description: 'Function names should use camelCase',
              line: index + 1,
              column: line.indexOf(functionName) + 1,
              rule: 'naming-conventions',
              suggestion: `Rename to ${functionName.charAt(0).toLowerCase() + functionName.slice(1)}`
            });
          }
        }
      });

      return issues;
    });

    // Missing visibility specifiers
    this.styleRules.set('visibility-specifiers', (_code, lines) => {
      const issues: AnalysisIssue[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('function') && !line.match(/\b(public|private|internal|external)\b/)) {
          issues.push({
            id: `visibility-${index}`,
            type: 'style',
            severity: 'medium',
            title: 'Missing Visibility Specifier',
            description: 'Functions should have explicit visibility specifiers',
            line: index + 1,
            column: line.indexOf('function') + 1,
            rule: 'visibility-specifiers',
            suggestion: 'Add explicit visibility specifier (public, private, internal, or external)',
            autoFixable: true
          });
        }
      });

      return issues;
    });
  }

  /**
   * Calculate gas estimate
   */
  private calculateGasEstimate(_code: string, lines: string[]): AnalysisResult['gasEstimate'] {
    let deploymentGas = 200000; // Base deployment cost
    const functionGas: Record<string, number> = {};
    
    lines.forEach(line => {
      // Simple gas estimation based on operations
      if (line.includes('SSTORE') || line.includes('=')) deploymentGas += 20000;
      if (line.includes('SLOAD') || line.includes('.')) deploymentGas += 200;
      if (line.includes('function')) {
        const functionMatch = line.match(/function\s+([a-zA-Z_$][\w$]*)/);
        if (functionMatch) {
          functionGas[functionMatch[1]] = 21000; // Base function cost
        }
      }
    });

    return {
      deployment: deploymentGas,
      functions: functionGas,
      total: deploymentGas + Object.values(functionGas).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Calculate code complexity
   */
  private calculateComplexity(_code: string, lines: string[]): AnalysisResult['complexity'] {
    let cyclomatic = 1; // Base complexity
    let cognitive = 0;
    
    lines.forEach(line => {
      // Cyclomatic complexity
      if (line.includes('if') || line.includes('while') || line.includes('for')) cyclomatic++;
      if (line.includes('&&') || line.includes('||')) cyclomatic++;
      
      // Cognitive complexity (simplified)
      if (line.includes('if')) cognitive += 1;
      if (line.includes('for') || line.includes('while')) cognitive += 2;
      if (line.includes('try') || line.includes('catch')) cognitive += 3;
    });

    return {
      cyclomatic,
      cognitive,
      lines: lines.length
    };
  }

  /**
   * Calculate code quality score
   */
  private calculateQuality(
    _code: string, 
    lines: string[], 
    issues: AnalysisIssue[], 
    vulnerabilities: SecurityVulnerability[]
  ): AnalysisResult['quality'] {
    const totalLines = lines.length;
    const commentLines = lines.filter(line => line.trim().startsWith('//')).length;
    const documentationLines = lines.filter(line => line.includes('/**') || line.includes('*/')).length;
    
    // Calculate scores (0-100)
    const maintainability = Math.max(0, 100 - (issues.length * 5));
    const testability = Math.max(0, 100 - (vulnerabilities.length * 10));
    const documentation = Math.min(100, (commentLines + documentationLines) / totalLines * 100 * 2);
    
    const score = (maintainability + testability + documentation) / 3;

    return {
      score: Math.round(score),
      maintainability: Math.round(maintainability),
      testability: Math.round(testability),
      documentation: Math.round(documentation)
    };
  }
}
