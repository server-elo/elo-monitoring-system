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
  gasSavings: number;
  savingsPercentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  beforeCode: string;
  afterCode: string;
  explanation: string;
  autoFixAvailable: boolean;
  category: 'storage' | 'computation' | 'memory' | 'call' | 'deployment';
  range: monaco.Range;
}

export interface GasAnalysisResult {
  estimates: GasEstimate[];
  optimizations: GasOptimization[];
  totalGasCost: number;
  optimizedGasCost: number;
  totalSavings: number;
  analysisTime: number;
  timestamp: Date;
  contractName?: string;
}

// Gas costs for different operations (in gas units)
const GAS_COSTS = {
  // Storage operations
  SSTORE_SET: 20000,
  SSTORE_RESET: 5000,
  SSTORE_CLEAR: 15000,
  SLOAD: 2100,
  
  // Memory operations
  MSTORE: 3,
  MLOAD: 3,
  MEMORY_EXPANSION: 512, // per 256-bit word
  
  // Computation
  ADD: 3,
  SUB: 3,
  MUL: 5,
  DIV: 5,
  MOD: 5,
  EXP: 10,
  
  // Comparison
  LT: 3,
  GT: 3,
  EQ: 3,
  ISZERO: 3,
  
  // Bitwise
  AND: 3,
  OR: 3,
  XOR: 3,
  NOT: 3,
  SHL: 3,
  SHR: 3,
  
  // SHA3
  SHA3: 30,
  SHA3_WORD: 6,
  
  // External calls
  CALL: 700,
  STATICCALL: 700,
  DELEGATECALL: 700,
  CREATE: 32000,
  CREATE2: 32000,
  
  // Transaction base costs
  TX_BASE: 21000,
  TX_DATA_ZERO: 4,
  TX_DATA_NONZERO: 16,
  
  // Log operations
  LOG0: 375,
  LOG1: 750,
  LOG2: 1125,
  LOG3: 1500,
  LOG4: 1875,
  LOG_DATA: 8, // per byte
  
  // Other
  BALANCE: 700,
  EXTCODESIZE: 700,
  EXTCODECOPY: 700,
  SELFDESTRUCT: 5000,
  JUMP: 8,
  JUMPI: 10,
  PUSH: 3,
  DUP: 3,
  SWAP: 3
};

export class GasOptimizationAnalyzer {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private decorations: string[] = [];
  private model: monaco.editor.ITextModel | null = null;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    this.model = editor.getModel();
  }

  /**
   * Analyze gas usage in the current contract
   */
  async analyzeGasUsage(userId: string): Promise<GasAnalysisResult> {
    const startTime = performance.now();
    
    if (!this.model) {
      throw new Error('No model available for analysis');
    }

    const code = this.model.getValue();
    const estimates = await this.estimateGasCosts(code);
    const optimizations = await this.findOptimizations(code, userId);
    
    const totalGasCost = estimates.reduce((sum, est) => sum + est.totalCost, 0);
    const totalSavings = optimizations.reduce((sum, opt) => sum + opt.gasSavings, 0);
    const optimizedGasCost = totalGasCost - totalSavings;
    
    const analysisTime = performance.now() - startTime;

    return {
      estimates,
      optimizations,
      totalGasCost,
      optimizedGasCost,
      totalSavings,
      analysisTime,
      timestamp: new Date()
    };
  }

  /**
   * Estimate gas costs for different operations
   */
  private async estimateGasCosts(code: string): Promise<GasEstimate[]> {
    const estimates: GasEstimate[] = [];
    const lines = code.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      
      // Storage operations
      if (line.includes('storage') && !line.includes('//')) {
        if (line.includes('=')) {
          estimates.push({
            operation: 'Storage Write',
            line: lineNum + 1,
            column: 0,
            endColumn: line.length,
            baseCost: GAS_COSTS.SSTORE_SET,
            totalCost: GAS_COSTS.SSTORE_SET,
            category: 'storage',
            description: 'Writing to storage is expensive',
            optimizable: true
          });
        } else {
          estimates.push({
            operation: 'Storage Read',
            line: lineNum + 1,
            column: 0,
            endColumn: line.length,
            baseCost: GAS_COSTS.SLOAD,
            totalCost: GAS_COSTS.SLOAD,
            category: 'storage',
            description: 'Reading from storage costs gas',
            optimizable: true
          });
        }
      }

      // Loop operations
      if (line.includes('for') || line.includes('while')) {
        estimates.push({
          operation: 'Loop',
          line: lineNum + 1,
          column: 0,
          endColumn: line.length,
          baseCost: 100,
          dynamicCost: 500,
          totalCost: 600,
          category: 'computation',
          description: 'Loops can be gas intensive',
          optimizable: true
        });
      }

      // External calls
      if (line.includes('.call(') || line.includes('.send(') || line.includes('.transfer(')) {
        estimates.push({
          operation: 'External Call',
          line: lineNum + 1,
          column: 0,
          endColumn: line.length,
          baseCost: GAS_COSTS.CALL,
          totalCost: GAS_COSTS.CALL,
          category: 'call',
          description: 'External calls have a base cost',
          optimizable: false
        });
      }

      // Hash operations
      if (line.includes('keccak256') || line.includes('sha256')) {
        estimates.push({
          operation: 'Hash Operation',
          line: lineNum + 1,
          column: 0,
          endColumn: line.length,
          baseCost: GAS_COSTS.SHA3,
          dynamicCost: GAS_COSTS.SHA3_WORD * 2,
          totalCost: GAS_COSTS.SHA3 + GAS_COSTS.SHA3_WORD * 2,
          category: 'computation',
          description: 'Hashing operations consume gas',
          optimizable: false
        });
      }
    }

    return estimates;
  }

  /**
   * Find optimization opportunities
   */
  private async findOptimizations(code: string, userId: string): Promise<GasOptimization[]> {
    const optimizations: GasOptimization[] = [];
    const lines = code.split('\n');

    // Pattern 1: Storage in loops
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('for') || lines[i].includes('while')) {
        // Check if storage is accessed in the loop
        let j = i + 1;
        let braceCount = 0;
        let foundStorageInLoop = false;
        
        while (j < lines.length) {
          if (lines[j].includes('{')) braceCount++;
          if (lines[j].includes('}')) {
            braceCount--;
            if (braceCount <= 0) break;
          }
          
          if (lines[j].includes('storage') && !lines[j].includes('//')) {
            foundStorageInLoop = true;
            
            optimizations.push({
              id: `opt-${i}-storage-loop`,
              title: 'Storage Access in Loop',
              description: 'Cache storage variables in memory before loops',
              line: i + 1,
              column: 0,
              endLine: j + 1,
              endColumn: lines[j].length,
              currentCost: GAS_COSTS.SLOAD * 10, // Assuming 10 iterations
              optimizedCost: GAS_COSTS.SLOAD + GAS_COSTS.MLOAD * 10,
              gasSavings: (GAS_COSTS.SLOAD * 10) - (GAS_COSTS.SLOAD + GAS_COSTS.MLOAD * 10),
              savingsPercentage: 80,
              difficulty: 'easy',
              impact: 'high',
              beforeCode: lines[j].trim(),
              afterCode: `uint256 cached_${i} = ${lines[j].trim()}; // Use cached_${i} in loop`,
              explanation: 'Reading from storage in loops is expensive. Cache the value in memory first.',
              autoFixAvailable: true,
              category: 'storage',
              range: new monaco.Range(i + 1, 0, j + 1, lines[j].length)
            });
          }
          j++;
        }
      }
    }

    // Pattern 2: Inefficient packing
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('uint8') || lines[i].includes('uint16') || lines[i].includes('uint32')) {
        optimizations.push({
          id: `opt-${i}-packing`,
          title: 'Inefficient Variable Packing',
          description: 'Use uint256 for better gas efficiency',
          line: i + 1,
          column: 0,
          endLine: i + 1,
          endColumn: lines[i].length,
          currentCost: 50,
          optimizedCost: 30,
          gasSavings: 20,
          savingsPercentage: 40,
          difficulty: 'easy',
          impact: 'low',
          beforeCode: lines[i].trim(),
          afterCode: lines[i].replace(/uint(8|16|32)/, 'uint256'),
          explanation: 'Using smaller uint types doesn\'t save gas and can cost more due to additional operations.',
          autoFixAvailable: true,
          category: 'computation',
          range: new monaco.Range(i + 1, 0, i + 1, lines[i].length)
        });
      }
    }

    // Get AI-powered suggestions
    try {
      const aiSuggestions = await enhancedTutor.analyzeGasUsage(code, userId);
      // Add AI suggestions to optimizations array
      // This would be implemented based on the AI response format
    } catch (error) {
      logger.error('Failed to get AI gas suggestions', { error });
    }

    return optimizations;
  }

  /**
   * Apply heatmap visualization
   */
  applyHeatmapVisualization(result: GasAnalysisResult): void {
    this.clearDecorations();
    
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];

    // Add decorations for gas estimates
    result.estimates.forEach(estimate => {
      const severity = this.getGasSeverity(estimate.totalCost);
      decorations.push({
        range: new monaco.Range(estimate.line, estimate.column, estimate.line, estimate.endColumn),
        options: {
          isWholeLine: true,
          className: `gas-${severity}`,
          hoverMessage: {
            value: `**${estimate.operation}**\n\nGas cost: ${estimate.totalCost}\n\n${estimate.description}`
          },
          glyphMarginClassName: `gas-glyph-${severity}`,
          glyphMarginHoverMessage: {
            value: `Gas: ${estimate.totalCost}`
          }
        }
      });
    });

    // Add decorations for optimizations
    result.optimizations.forEach(optimization => {
      decorations.push({
        range: optimization.range,
        options: {
          isWholeLine: false,
          className: 'gas-optimization',
          hoverMessage: {
            value: `**${optimization.title}**\n\nPotential savings: ${optimization.gasSavings} gas (${optimization.savingsPercentage}%)\n\n${optimization.explanation}`
          },
          linesDecorationsClassName: 'gas-optimization-line',
          minimap: {
            color: '#ff9800',
            position: monaco.editor.MinimapPosition.Inline
          }
        }
      });
    });

    this.decorations = this.editor.deltaDecorations(this.decorations, decorations);
  }

  /**
   * Get severity level based on gas cost
   */
  private getGasSeverity(gasCost: number): 'low' | 'medium' | 'high' | 'critical' {
    if (gasCost < 100) return 'low';
    if (gasCost < 1000) return 'medium';
    if (gasCost < 10000) return 'high';
    return 'critical';
  }

  /**
   * Apply an optimization
   */
  async applyOptimization(optimization: GasOptimization): Promise<boolean> {
    if (!optimization.autoFixAvailable || !this.model) {
      return false;
    }

    try {
      const edit: monaco.editor.IIdentifiedSingleEditOperation = {
        range: optimization.range,
        text: optimization.afterCode,
        forceMoveMarkers: true
      };

      this.model.pushEditOperations([], [edit], () => []);
      
      logger.info('Applied gas optimization', {
        optimizationId: optimization.id,
        savings: optimization.gasSavings
      });

      return true;
    } catch (error) {
      logger.error('Failed to apply optimization', { error, optimizationId: optimization.id });
      return false;
    }
  }

  /**
   * Clear all decorations
   */
  clearDecorations(): void {
    this.decorations = this.editor.deltaDecorations(this.decorations, []);
  }

  /**
   * Dispose of the analyzer
   */
  dispose(): void {
    this.clearDecorations();
  }
}