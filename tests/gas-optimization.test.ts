import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { GasOptimizationAnalyzer } from '../lib/gas/GasOptimizationAnalyzer';
import * as monaco from 'monaco-editor';

// Mock Monaco Editor
const mockEditor = {
  getModel: vi.fn(),
  deltaDecorations: vi.fn(),
} as any;

const mockModel = {
  getValue: vi.fn(),
  onDidChangeContent: vi.fn(),
} as any;

// Mock Enhanced Tutor
vi.mock('../lib/ai/EnhancedTutorSystem', () => ({
  enhancedTutor: {
    analyzeCodeSecurity: vi.fn(),
  },
}));

describe('Gas Optimization Analyzer', () => {
  let analyzer: GasOptimizationAnalyzer;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockEditor.getModel.mockReturnValue(mockModel);
    mockEditor.deltaDecorations.mockReturnValue([]);
    
    analyzer = new GasOptimizationAnalyzer(mockEditor);
  });

  afterEach(() => {
    analyzer.dispose();
  });

  describe('Static Analysis', () => {
    it('should detect storage operations', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function setValue(uint256 _value) external {
                value = _value; // SSTORE operation
            }
            
            function getValue() external view returns (uint256) {
                return value; // SLOAD operation
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      expect(result.estimates).toBeDefined();
      expect(result.estimates.length).toBeGreaterThan(0);
      
      // Should detect storage operations
      const storageOps = result.estimates.filter(est => est.category === 'storage');
      expect(storageOps.length).toBeGreaterThan(0);
      
      // Should have SSTORE and SLOAD operations
      const sstoreOps = result.estimates.filter(est => est.operation === 'SSTORE');
      const sloadOps = result.estimates.filter(est => est.operation === 'SLOAD');
      expect(sstoreOps.length).toBeGreaterThan(0);
      expect(sloadOps.length).toBeGreaterThan(0);
    });

    it('should detect function visibility optimization opportunities', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            function publicFunction() public pure returns (uint256) {
                return 42;
            }
            
            function anotherPublicFunction(uint256 x) public pure returns (uint256) {
                return x * 2;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      expect(result.optimizations).toBeDefined();
      
      // Should detect function visibility optimizations
      const visibilityOpts = result.optimizations.filter(opt => 
        opt.title.includes('Function Visibility')
      );
      expect(visibilityOpts.length).toBeGreaterThan(0);
      
      // Should suggest external instead of public
      visibilityOpts.forEach(opt => {
        expect(opt.afterCode).toContain('external');
        expect(opt.difficulty).toBe('easy');
        expect(opt.autoFixAvailable).toBe(true);
      });
    });

    it('should detect storage packing opportunities', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public largeValue;
            uint256 public anotherLargeValue;
            bool public flag;
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      // Should detect storage packing opportunities
      const packingOpts = result.optimizations.filter(opt => 
        opt.title.includes('Storage Packing')
      );
      expect(packingOpts.length).toBeGreaterThan(0);
      
      packingOpts.forEach(opt => {
        expect(opt.category).toBe('storage');
        expect(opt.savings).toBeGreaterThan(0);
      });
    });

    it('should detect loop optimization opportunities', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256[] public items;
            
            function processItems() external {
                for (uint256 i = 0; i < items.length; i++) {
                    // Process item
                    items[i] = items[i] * 2;
                }
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      // Should detect array length caching opportunity
      const cachingOpts = result.optimizations.filter(opt => 
        opt.title.includes('Array Length Caching')
      );
      expect(cachingOpts.length).toBeGreaterThan(0);
      
      // Should detect loop overhead
      const loopEstimates = result.estimates.filter(est => est.operation === 'LOOP');
      expect(loopEstimates.length).toBeGreaterThan(0);
    });
  });

  describe('Gas Cost Calculations', () => {
    it('should calculate realistic gas costs', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            mapping(address => uint256) public balances;
            
            function transfer(address to, uint256 amount) external {
                balances[msg.sender] -= amount;
                balances[to] += amount;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      expect(result.totalGasCost).toBeGreaterThan(0);
      expect(result.totalGasCost).toBeLessThan(10000000); // Reasonable upper bound
      
      // Should have storage operations with appropriate costs
      const storageOps = result.estimates.filter(est => est.category === 'storage');
      storageOps.forEach(est => {
        expect(est.totalCost).toBeGreaterThan(0);
        if (est.operation === 'SSTORE') {
          expect(est.totalCost).toBeGreaterThanOrEqual(5000); // Minimum SSTORE cost
        }
        if (est.operation === 'SLOAD') {
          expect(est.totalCost).toBeGreaterThanOrEqual(2100); // SLOAD cost
        }
      });
    });

    it('should calculate potential savings correctly', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value1;
            uint256 public value2;
            
            function publicFunction() public pure returns (uint256) {
                return 42;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      if (result.optimizations.length > 0) {
        expect(result.totalSavings).toBeGreaterThan(0);
        expect(result.optimizedGasCost).toBeLessThanOrEqual(result.totalGasCost);
        
        // Savings should equal sum of individual optimization savings
        const calculatedSavings = result.optimizations.reduce((sum, opt) => sum + opt.savings, 0);
        expect(result.totalSavings).toBe(calculatedSavings);
      }
    });
  });

  describe('Heatmap Generation', () => {
    it('should generate heatmap data', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function expensiveOperation() external {
                value = value * 2 + 1;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      expect(result.heatmapData).toBeDefined();
      expect(Array.isArray(result.heatmapData)).toBe(true);
      
      if (result.heatmapData.length > 0) {
        result.heatmapData.forEach(point => {
          expect(point.line).toBeGreaterThan(0);
          expect(point.gasCost).toBeGreaterThan(0);
          expect(point.intensity).toBeGreaterThanOrEqual(0);
          expect(point.intensity).toBeLessThanOrEqual(1);
          expect(point.category).toBeDefined();
          expect(point.description).toBeDefined();
        });
      }
    });

    it('should apply heatmap visualization to editor', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value = 42;
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);
      analyzer.applyHeatmapVisualization(result);

      // Should call deltaDecorations to apply visual indicators
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
    });
  });

  describe('Function Breakdown', () => {
    it('should generate function-level gas breakdown', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function setValue(uint256 _value) external {
                value = _value;
            }
            
            function getValue() external view returns (uint256) {
                return value;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      expect(result.functionBreakdown).toBeDefined();
      expect(typeof result.functionBreakdown).toBe('object');
      
      // Should have entries for detected functions
      const functionNames = Object.keys(result.functionBreakdown);
      expect(functionNames.length).toBeGreaterThan(0);
      
      // Each function should have a gas cost
      functionNames.forEach(funcName => {
        expect(result.functionBreakdown[funcName]).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Optimization Categories', () => {
    it('should categorize optimizations correctly', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public storageVar;
            
            function publicFunc() public pure returns (uint256) {
                return 42;
            }
            
            function loopFunc() external {
                for (uint256 i = 0; i < 10; i++) {
                    storageVar += i;
                }
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      const categories = new Set(result.optimizations.map(opt => opt.category));
      
      // Should have different categories of optimizations
      expect(categories.size).toBeGreaterThan(0);
      
      // Verify category types
      categories.forEach(category => {
        expect(['storage', 'computation', 'memory', 'call', 'deployment']).toContain(category);
      });
    });

    it('should assign appropriate difficulty levels', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function publicFunction() public pure returns (uint256) {
                return 42;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      result.optimizations.forEach(opt => {
        expect(['easy', 'medium', 'hard']).toContain(opt.difficulty);
        expect(['low', 'medium', 'high']).toContain(opt.impact);
        
        // Easy optimizations should be auto-fixable
        if (opt.difficulty === 'easy') {
          expect(opt.autoFixAvailable).toBe(true);
        }
      });
    });
  });

  describe('Caching', () => {
    it('should cache analysis results', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value = 42;
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      // First analysis
      const result1 = await analyzer.analyzeGasUsage(mockUserId);
      
      // Second analysis with same code should be faster (cached)
      const startTime = Date.now();
      const result2 = await analyzer.analyzeGasUsage(mockUserId);
      const endTime = Date.now();

      expect(result2).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast due to caching
    });

    it('should clear cache when requested', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value = 42;
        }
      `;

      mockModel.getValue.mockReturnValue(testCode);

      await analyzer.analyzeGasUsage(mockUserId);
      
      // Clear cache
      analyzer.clearCache();
      
      // Should work normally after cache clear
      const result = await analyzer.analyzeGasUsage(mockUserId);
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid code gracefully', async () => {
      const invalidCode = 'invalid solidity code here';
      mockModel.getValue.mockReturnValue(invalidCode);

      const result = await analyzer.analyzeGasUsage(mockUserId);

      // Should still return a result, even if minimal
      expect(result).toBeDefined();
      expect(result.estimates).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(result.totalGasCost).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty code', async () => {
      mockModel.getValue.mockReturnValue('');

      const result = await analyzer.analyzeGasUsage(mockUserId);

      expect(result).toBeDefined();
      expect(result.estimates).toEqual([]);
      expect(result.optimizations).toEqual([]);
      expect(result.totalGasCost).toBe(0);
    });
  });
});
