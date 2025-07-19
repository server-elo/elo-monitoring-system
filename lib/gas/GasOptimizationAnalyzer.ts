/**
 * Gas Optimization Analyzer
 * 
 * Provides detailed gas cost analysis, optimization suggestions,
 * and visual heatmap generation for Solidity code.
 */

import * as monaco from 'monaco-editor';
import { enhancedTutor } from '@/lib/ai/EnhancedTutorSystem';
import { logger } from '@/lib/api/logger';

export interface GasEstimate {
  operation: string;
  line: number;
  column: number;
  endColumn: number;
  baseCost: number;
  dynamicCost?: number;
  totalCost: number;
  category: 'storage' | 'computation' | 'memory' | 'call' | 'deployment';
  description: string;
  optimizable: boolean;
}

export interface GasOptimization {
  id: string;
  title: string;
  description: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  beforeCode: string;
  afterCode: string;
  explanation: string;
  autoFixAvailable: boolean;
  category: 'storage' | 'computation' | 'memory' | 'call' | 'deployment';
}

export interface GasAnalysisResult {
  estimates: GasEstimate[];
  optimizations: GasOptimization[];
  totalGasCost: number;
  optimizedGasCost: number;
  totalSavings: number;
  analysisTime: number;
  timestamp: Date;
  functionBreakdown: Record<string, number>;
  heatmapData: HeatmapPoint[];
}

export interface HeatmapPoint {
  line: number;
  startColumn: number;
  endColumn: number;
  gasCost: number;
  intensity: number; // 0-1 scale for color intensity
  category: string;
  description: string;
}

export class GasOptimizationAnalyzer {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private model: monaco.editor.ITextModel;
  private decorations: string[] = [];
  private lastAnalysis: GasAnalysisResult | null = null;
  private analysisCache = new Map<string, GasAnalysisResult>();

  // Gas cost constants (approximate values for mainnet)
  private readonly gasCosts = {
    // Storage operations
    SSTORE_SET: 20000,      // Set storage slot from zero
    SSTORE_RESET: 5000,     // Set storage slot from non-zero
    SLOAD: 2100,            // Load from storage
    
    // Memory operations
    MSTORE: 3,              // Store to memory
    MLOAD: 3,               // Load from memory
    
    // Computation
    ADD: 3,                 // Addition
    MUL: 5,                 // Multiplication
    DIV: 5,                 // Division
    MOD: 5,                 // Modulo
    EXP: 10,                // Exponentiation (base cost)
    
    // Comparison
    LT: 3,                  // Less than
    GT: 3,                  // Greater than
    EQ: 3,                  // Equal
    
    // Bitwise operations
    AND: 3,
    OR: 3,
    XOR: 3,
    NOT: 3,
    
    // Control flow
    JUMP: 8,
    JUMPI: 10,
    
    // External calls
    CALL: 2600,             // Base cost for external call
    STATICCALL: 2600,       // Static call
    DELEGATECALL: 2600,     // Delegate call
    
    // Contract creation
    CREATE: 32000,          // Contract creation
    CREATE2: 32000,         // CREATE2 opcode
    
    // Logs
    LOG0: 375,              // Log with 0 topics
    LOG1: 750,              // Log with 1 topic
    LOG2: 1125,             // Log with 2 topics
    LOG3: 1500,             // Log with 3 topics
    LOG4: 1875,             // Log with 4 topics
    
    // Transaction costs
    TX_BASE: 21000,         // Base transaction cost
    TX_DATA_ZERO: 4,        // Per zero byte in transaction data
    TX_DATA_NONZERO: 16,    // Per non-zero byte in transaction data
  };

  // Gas optimization patterns
  private readonly optimizationPatterns = [
    {
      pattern: /uint256\s+public\s+(\w+)/g,
      title: 'Storage Packing Opportunity',
      description: 'Consider using smaller uint types if possible',
      category: 'storage' as const,
      difficulty: 'easy' as const,
      impact: 'medium' as const,
      baseSavings: 15000,
      check: (match: string) => !match.includes('constant') && !match.includes('immutable')
    },
    {
      pattern: /function\s+(\w+)\s*\([^)]*\)\s+public/g,
      title: 'Function Visibility Optimization',
      description: 'Use external instead of public for functions only called externally',
      category: 'call' as const,
      difficulty: 'easy' as const,
      impact: 'low' as const,
      baseSavings: 200,
      check: () => true
    },
    {
      pattern: /for\s*\(\s*uint\d*\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\w+)\.length/g,
      title: 'Array Length Caching',
      description: 'Cache array length to avoid repeated SLOAD operations',
      category: 'storage' as const,
      difficulty: 'easy' as const,
      impact: 'medium' as const,
      baseSavings: 2100,
      check: () => true
    },
    {
      pattern: /\+\+(\w+)|(\w+)\+\+/g,
      title: 'Unchecked Arithmetic',
      description: 'Use unchecked blocks for arithmetic that cannot overflow',
      category: 'computation' as const,
      difficulty: 'medium' as const,
      impact: 'low' as const,
      baseSavings: 120,
      check: () => true
    },
    {
      pattern: /require\s*\(\s*([^,]+)\s*,\s*"([^"]+)"\s*\)/g,
      title: 'Custom Errors',
      description: 'Replace require statements with custom errors to save gas',
      category: 'deployment' as const,
      difficulty: 'medium' as const,
      impact: 'medium' as const,
      baseSavings: 1000,
      check: () => true
    },
    {
      pattern: /mapping\s*\(\s*\w+\s*=>\s*bool\s*\)/g,
      title: 'Bitmap Optimization',
      description: 'Consider using bitmaps for boolean mappings',
      category: 'storage' as const,
      difficulty: 'hard' as const,
      impact: 'high' as const,
      baseSavings: 18000,
      check: () => true
    }
  ];

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    this.model = editor.getModel()!;
  }

  // Main analysis method
  public async analyzeGasUsage(userId: string): Promise<GasAnalysisResult> {
    const startTime = Date.now();
    const code = this.model.getValue();
    
    // Check cache
    const cacheKey = this.generateCacheKey(code);
    const cached = this.analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < 300000) { // 5 minute cache
      return cached;
    }

    try {
      // Perform static analysis
      const estimates = this.performStaticAnalysis(code);
      const optimizations = this.findOptimizations(code);
      
      // Get AI-powered analysis for more complex optimizations
      const aiAnalysis = await this.getAIGasAnalysis(code, userId);
      
      // Merge AI optimizations
      const allOptimizations = this.mergeOptimizations(optimizations, aiAnalysis);
      
      // Calculate totals
      const totalGasCost = estimates.reduce((sum, est) => sum + est.totalCost, 0);
      const totalSavings = allOptimizations.reduce((sum, opt) => sum + opt.savings, 0);
      const optimizedGasCost = totalGasCost - totalSavings;
      
      // Generate function breakdown
      const functionBreakdown = this.generateFunctionBreakdown(code, estimates);
      
      // Generate heatmap data
      const heatmapData = this.generateHeatmapData(estimates);

      const result: GasAnalysisResult = {
        estimates,
        optimizations: allOptimizations,
        totalGasCost,
        optimizedGasCost: Math.max(0, optimizedGasCost),
        totalSavings,
        analysisTime: Date.now() - startTime,
        timestamp: new Date(),
        functionBreakdown,
        heatmapData
      };

      // Cache result
      this.analysisCache.set(cacheKey, result);
      this.lastAnalysis = result;

      return result;
    } catch (error) {
      logger.error('Gas analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'gas-analysis'
      }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // Static analysis of gas costs
  private performStaticAnalysis(code: string): GasEstimate[] {
    const estimates: GasEstimate[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      
      // Storage operations
      this.analyzeStorageOperations(line, lineNumber, estimates);
      
      // Function calls
      this.analyzeFunctionCalls(line, lineNumber, estimates);
      
      // Loops
      this.analyzeLoops(line, lineNumber, estimates);
      
      // Arithmetic operations
      this.analyzeArithmetic(line, lineNumber, estimates);
      
      // Memory operations
      this.analyzeMemoryOperations(line, lineNumber, estimates);
    });

    return estimates;
  }

  private analyzeStorageOperations(line: string, lineNumber: number, estimates: GasEstimate[]): void {
    // State variable assignments
    const storePattern = /(\w+)\s*=\s*([^;]+);/g;
    let match;
    while ((match = storePattern.exec(line)) !== null) {
      const column = match.index + 1;
      estimates.push({
        operation: 'SSTORE',
        line: lineNumber,
        column,
        endColumn: column + match[0].length,
        baseCost: this.gasCosts.SSTORE_SET,
        totalCost: this.gasCosts.SSTORE_SET,
        category: 'storage',
        description: `Storage write to ${match[1]}`,
        optimizable: true
      });
    }

    // State variable reads
    const loadPattern = /\b(\w+)\b(?!\s*[=\(])/g;
    while ((match = loadPattern.exec(line)) !== null) {
      if (this.isStateVariable(match[1])) {
        const column = match.index + 1;
        estimates.push({
          operation: 'SLOAD',
          line: lineNumber,
          column,
          endColumn: column + match[0].length,
          baseCost: this.gasCosts.SLOAD,
          totalCost: this.gasCosts.SLOAD,
          category: 'storage',
          description: `Storage read from ${match[1]}`,
          optimizable: true
        });
      }
    }
  }

  private analyzeFunctionCalls(line: string, lineNumber: number, estimates: GasEstimate[]): void {
    // External calls
    const callPattern = /(\w+)\.(\w+)\s*\(/g;
    let match;
    while ((match = callPattern.exec(line)) !== null) {
      const column = match.index + 1;
      estimates.push({
        operation: 'CALL',
        line: lineNumber,
        column,
        endColumn: column + match[0].length,
        baseCost: this.gasCosts.CALL,
        dynamicCost: 2300, // Gas stipend
        totalCost: this.gasCosts.CALL + 2300,
        category: 'call',
        description: `External call to ${match[1]}.${match[2]}()`,
        optimizable: false
      });
    }
  }

  private analyzeLoops(line: string, lineNumber: number, estimates: GasEstimate[]): void {
    // For loops
    const forPattern = /for\s*\(/g;
    let match;
    while ((match = forPattern.exec(line)) !== null) {
      const column = match.index + 1;
      estimates.push({
        operation: 'LOOP',
        line: lineNumber,
        column,
        endColumn: column + match[0].length,
        baseCost: 100, // Base loop overhead
        dynamicCost: 1000, // Estimated per iteration
        totalCost: 1100,
        category: 'computation',
        description: 'Loop iteration overhead',
        optimizable: true
      });
    }
  }

  private analyzeArithmetic(line: string, lineNumber: number, estimates: GasEstimate[]): void {
    // Arithmetic operations
    const arithmeticPattern = /[\+\-\*\/\%]/g;
    let match;
    while ((match = arithmeticPattern.exec(line)) !== null) {
      const column = match.index + 1;
      const operation = match[0];
      let cost = this.gasCosts.ADD;
      
      switch (operation) {
        case '*': cost = this.gasCosts.MUL; break;
        case '/': cost = this.gasCosts.DIV; break;
        case '%': cost = this.gasCosts.MOD; break;
      }
      
      estimates.push({
        operation: `ARITHMETIC_${operation}`,
        line: lineNumber,
        column,
        endColumn: column + 1,
        baseCost: cost,
        totalCost: cost,
        category: 'computation',
        description: `Arithmetic operation: ${operation}`,
        optimizable: true
      });
    }
  }

  private analyzeMemoryOperations(line: string, lineNumber: number, estimates: GasEstimate[]): void {
    // Memory allocations (arrays, strings)
    const memoryPattern = /new\s+\w+\[|\w+\[\]|\bstring\b|\bbytes\b/g;
    let match;
    while ((match = memoryPattern.exec(line)) !== null) {
      const column = match.index + 1;
      estimates.push({
        operation: 'MEMORY',
        line: lineNumber,
        column,
        endColumn: column + match[0].length,
        baseCost: 100, // Base memory cost
        dynamicCost: 300, // Dynamic expansion cost
        totalCost: 400,
        category: 'memory',
        description: 'Memory allocation',
        optimizable: true
      });
    }
  }

  // Find optimization opportunities
  private findOptimizations(code: string): GasOptimization[] {
    const optimizations: GasOptimization[] = [];
    const lines = code.split('\n');

    this.optimizationPatterns.forEach((pattern, patternIndex) => {
      lines.forEach((line, lineIndex) => {
        let match;
        while ((match = pattern.pattern.exec(line)) !== null) {
          if (pattern.check(match[0])) {
            const column = match.index + 1;
            const optimization = this.createOptimization(
              pattern,
              match,
              lineIndex + 1,
              column,
              patternIndex
            );
            optimizations.push(optimization);
          }
        }
      });
    });

    return optimizations;
  }

  private createOptimization(
    pattern: any,
    match: RegExpExecArray,
    line: number,
    column: number,
    patternIndex: number
  ): GasOptimization {
    const beforeCode = match[0];
    const afterCode = this.generateOptimizedCode(pattern, match);
    const savings = this.calculateSavings(pattern, match);

    return {
      id: `opt-${patternIndex}-${line}-${column}`,
      title: pattern.title,
      description: pattern.description,
      line,
      column,
      endLine: line,
      endColumn: column + beforeCode.length,
      currentCost: pattern.baseSavings + savings,
      optimizedCost: 0,
      savings,
      savingsPercentage: Math.round((savings / (pattern.baseSavings + savings)) * 100),
      difficulty: pattern.difficulty,
      impact: pattern.impact,
      beforeCode,
      afterCode,
      explanation: this.generateExplanation(pattern, match),
      autoFixAvailable: pattern.difficulty === 'easy',
      category: pattern.category
    };
  }

  // Helper methods
  private generateCacheKey(code: string): string {
    return `gas-${code.length}-${code.slice(0, 100).replace(/\s/g, '')}`;
  }

  private isStateVariable(name: string): boolean {
    // Simple heuristic - in a real implementation, this would use AST analysis
    return /^[a-z][a-zA-Z0-9]*$/.test(name) && name !== 'msg' && name !== 'block' && name !== 'tx';
  }

  private async getAIGasAnalysis(code: string, userId: string): Promise<GasOptimization[]> {
    try {
      const analysis = await enhancedTutor.analyzeCodeSecurity(code, userId);
      return this.convertAIGasOptimizations(analysis.gasOptimizations || []);
    } catch (error) {
      logger.error('AI gas analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'ai-gas-analysis'
      }, error instanceof Error ? error : undefined);
      return [];
    }
  }

  private convertAIGasOptimizations(aiOptimizations: any[]): GasOptimization[] {
    return aiOptimizations.map((opt, index) => ({
      id: `ai-gas-${index}`,
      title: 'AI Gas Optimization',
      description: opt.description || 'AI-suggested optimization',
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 100,
      currentCost: opt.gasSavings || 1000,
      optimizedCost: 0,
      savings: opt.gasSavings || 1000,
      savingsPercentage: 50,
      difficulty: 'medium' as const,
      impact: opt.impact || 'medium' as const,
      beforeCode: opt.beforeCode || '',
      afterCode: opt.afterCode || '',
      explanation: opt.description || 'AI-generated optimization',
      autoFixAvailable: false,
      category: 'computation' as const
    }));
  }

  private mergeOptimizations(staticOptimizations: GasOptimization[], aiOptimizations: GasOptimization[]): GasOptimization[] {
    // Simple merge - in production, would deduplicate and prioritize
    return [...staticOptimizations, ...aiOptimizations];
  }

  private generateFunctionBreakdown(code: string, estimates: GasEstimate[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    // Extract function names and associate gas costs
    const functionPattern = /function\s+(\w+)/g;
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      const functionName = match[1];
      breakdown[functionName] = estimates
        .filter(est => est.line >= this.getFunctionStartLine(code, functionName))
        .reduce((sum, est) => sum + est.totalCost, 0);
    }

    return breakdown;
  }

  private getFunctionStartLine(code: string, functionName: string): number {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`function ${functionName}`)) {
        return i + 1;
      }
    }
    return 1;
  }

  private generateHeatmapData(estimates: GasEstimate[]): HeatmapPoint[] {
    const maxCost = Math.max(...estimates.map(e => e.totalCost));
    
    return estimates.map(estimate => ({
      line: estimate.line,
      startColumn: estimate.column,
      endColumn: estimate.endColumn,
      gasCost: estimate.totalCost,
      intensity: estimate.totalCost / maxCost,
      category: estimate.category,
      description: estimate.description
    }));
  }

  private generateOptimizedCode(pattern: any, match: RegExpExecArray): string {
    // Generate optimized code based on pattern type
    switch (pattern.title) {
      case 'Function Visibility Optimization':
        return match[0].replace('public', 'external');
      case 'Storage Packing Opportunity':
        return match[0].replace('uint256', 'uint128');
      default:
        return match[0] + ' // Optimized';
    }
  }

  private calculateSavings(pattern: any, match: RegExpExecArray): number {
    return pattern.baseSavings;
  }

  private generateExplanation(pattern: any, match: RegExpExecArray): string {
    return `${pattern.description}. This optimization can save approximately ${pattern.baseSavings} gas.`;
  }

  // Public API
  public getLastAnalysis(): GasAnalysisResult | null {
    return this.lastAnalysis;
  }

  public clearCache(): void {
    this.analysisCache.clear();
  }

  // Apply gas heatmap visualization to editor
  public applyHeatmapVisualization(result: GasAnalysisResult): void {
    // Clear existing decorations
    this.decorations = this.editor.deltaDecorations(this.decorations, []);

    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

    result.heatmapData.forEach(point => {
      const intensity = Math.min(point.intensity, 1);
      const alpha = Math.max(0.1, intensity * 0.8);

      // Color based on gas cost intensity
      let backgroundColor: string;
      if (intensity > 0.8) {
        backgroundColor = `rgba(255, 0, 0, ${alpha})`; // Red for high cost
      } else if (intensity > 0.6) {
        backgroundColor = `rgba(255, 165, 0, ${alpha})`; // Orange for medium-high cost
      } else if (intensity > 0.4) {
        backgroundColor = `rgba(255, 255, 0, ${alpha})`; // Yellow for medium cost
      } else if (intensity > 0.2) {
        backgroundColor = `rgba(173, 255, 47, ${alpha})`; // Green-yellow for low-medium cost
      } else {
        backgroundColor = `rgba(0, 255, 0, ${alpha})`; // Green for low cost
      }

      newDecorations.push({
        range: new monaco.Range(
          point.line,
          point.startColumn,
          point.line,
          point.endColumn
        ),
        options: {
          className: 'gas-heatmap',
          hoverMessage: {
            value: `**Gas Cost: ${point.gasCost}**\n\n${point.description}\n\nCategory: ${point.category}`
          },
          minimap: {
            color: backgroundColor,
            position: monaco.editor.MinimapPosition.Inline
          }
        }
      });
    });

    // Apply decorations
    this.decorations = this.editor.deltaDecorations([], newDecorations);
  }

  public dispose(): void {
    this.clearCache();
    this.editor.deltaDecorations(this.decorations, []);
  }
}
