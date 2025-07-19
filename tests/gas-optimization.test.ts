import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { GasOptimizationAnalyzer } from '../lib/gas/GasOptimizationAnalyzer';
import * as monaco from 'monaco-editor';

// Mock Monaco Editor
const mockEditor = {
  getModel: vi.fn(_),
  deltaDecorations: vi.fn(_),
} as any;

const mockModel = {
  getValue: vi.fn(_),
  onDidChangeContent: vi.fn(_),
} as any;

// Mock Enhanced Tutor
vi.mock( '../lib/ai/EnhancedTutorSystem', () => ({
  enhancedTutor: {
    analyzeCodeSecurity: vi.fn(_),
  },
}));

describe( 'Gas Optimization Analyzer', () => {
  let analyzer: GasOptimizationAnalyzer;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks(_);
    mockEditor.getModel.mockReturnValue(_mockModel);
    mockEditor.deltaDecorations.mockReturnValue([]);
    
    analyzer = new GasOptimizationAnalyzer(_mockEditor);
  });

  afterEach(() => {
    analyzer.dispose(_);
  });

  describe( 'Static Analysis', () => {
    it( 'should detect storage operations', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function setValue(_uint256 _value) external {
                value = _value; // SSTORE operation
            }
            
            function getValue() external view returns (_uint256) {
                return value; // SLOAD operation
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      expect(_result.estimates).toBeDefined(_);
      expect(_result.estimates.length).toBeGreaterThan(0);
      
      // Should detect storage operations
      const storageOps = result.estimates.filter(est => est.category === 'storage');
      expect(_storageOps.length).toBeGreaterThan(0);
      
      // Should have SSTORE and SLOAD operations
      const sstoreOps = result.estimates.filter(est => est.operation === 'SSTORE');
      const sloadOps = result.estimates.filter(est => est.operation === 'SLOAD');
      expect(_sstoreOps.length).toBeGreaterThan(0);
      expect(_sloadOps.length).toBeGreaterThan(0);
    });

    it( 'should detect function visibility optimization opportunities', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            function publicFunction() public pure returns (_uint256) {
                return 42;
            }
            
            function anotherPublicFunction(_uint256 x) public pure returns (_uint256) {
                return x * 2;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      expect(_result.optimizations).toBeDefined(_);
      
      // Should detect function visibility optimizations
      const visibilityOpts = result.optimizations.filter(opt => 
        opt.title.includes('Function Visibility')
      );
      expect(_visibilityOpts.length).toBeGreaterThan(0);
      
      // Should suggest external instead of public
      visibilityOpts.forEach(opt => {
        expect(_opt.afterCode).toContain('external');
        expect(_opt.difficulty).toBe('easy');
        expect(_opt.autoFixAvailable).toBe(_true);
      });
    });

    it( 'should detect storage packing opportunities', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public largeValue;
            uint256 public anotherLargeValue;
            bool public flag;
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      // Should detect storage packing opportunities
      const packingOpts = result.optimizations.filter(opt => 
        opt.title.includes('Storage Packing')
      );
      expect(_packingOpts.length).toBeGreaterThan(0);
      
      packingOpts.forEach(opt => {
        expect(_opt.category).toBe('storage');
        expect(_opt.savings).toBeGreaterThan(0);
      });
    });

    it( 'should detect loop optimization opportunities', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256[] public items;
            
            function processItems() external {
                for (_uint256 i = 0; i < items.length; i++) {
                    // Process item
                    items[i] = items[i] * 2;
                }
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      // Should detect array length caching opportunity
      const cachingOpts = result.optimizations.filter(opt => 
        opt.title.includes('Array Length Caching')
      );
      expect(_cachingOpts.length).toBeGreaterThan(0);
      
      // Should detect loop overhead
      const loopEstimates = result.estimates.filter(est => est.operation === 'LOOP');
      expect(_loopEstimates.length).toBeGreaterThan(0);
    });
  });

  describe( 'Gas Cost Calculations', () => {
    it( 'should calculate realistic gas costs', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            mapping(_address => uint256) public balances;
            
            function transfer( address to, uint256 amount) external {
                balances[msg.sender] -= amount;
                balances[to] += amount;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      expect(_result.totalGasCost).toBeGreaterThan(0);
      expect(_result.totalGasCost).toBeLessThan(10000000); // Reasonable upper bound
      
      // Should have storage operations with appropriate costs
      const storageOps = result.estimates.filter(est => est.category === 'storage');
      storageOps.forEach(est => {
        expect(_est.totalCost).toBeGreaterThan(0);
        if (_est.operation === 'SSTORE') {
          expect(_est.totalCost).toBeGreaterThanOrEqual(5000); // Minimum SSTORE cost
        }
        if (_est.operation === 'SLOAD') {
          expect(_est.totalCost).toBeGreaterThanOrEqual(_2100); // SLOAD cost
        }
      });
    });

    it( 'should calculate potential savings correctly', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value1;
            uint256 public value2;
            
            function publicFunction() public pure returns (_uint256) {
                return 42;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      if (_result.optimizations.length > 0) {
        expect(_result.totalSavings).toBeGreaterThan(0);
        expect(_result.optimizedGasCost).toBeLessThanOrEqual(_result.totalGasCost);
        
        // Savings should equal sum of individual optimization savings
        const calculatedSavings = result.optimizations.reduce( (sum, opt) => sum + opt.savings, 0);
        expect(_result.totalSavings).toBe(_calculatedSavings);
      }
    });
  });

  describe( 'Heatmap Generation', () => {
    it( 'should generate heatmap data', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function expensiveOperation() external {
                value = value * 2 + 1;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      expect(_result.heatmapData).toBeDefined(_);
      expect(_Array.isArray(result.heatmapData)).toBe(_true);
      
      if (_result.heatmapData.length > 0) {
        result.heatmapData.forEach(point => {
          expect(_point.line).toBeGreaterThan(0);
          expect(_point.gasCost).toBeGreaterThan(0);
          expect(_point.intensity).toBeGreaterThanOrEqual(0);
          expect(_point.intensity).toBeLessThanOrEqual(1);
          expect(_point.category).toBeDefined(_);
          expect(_point.description).toBeDefined(_);
        });
      }
    });

    it( 'should apply heatmap visualization to editor', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value = 42;
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);
      analyzer.applyHeatmapVisualization(_result);

      // Should call deltaDecorations to apply visual indicators
      expect(_mockEditor.deltaDecorations).toHaveBeenCalled(_);
    });
  });

  describe( 'Function Breakdown', () => {
    it( 'should generate function-level gas breakdown', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function setValue(_uint256 _value) external {
                value = _value;
            }
            
            function getValue() external view returns (_uint256) {
                return value;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      expect(_result.functionBreakdown).toBeDefined(_);
      expect(_typeof result.functionBreakdown).toBe('object');
      
      // Should have entries for detected functions
      const functionNames = Object.keys(_result.functionBreakdown);
      expect(_functionNames.length).toBeGreaterThan(0);
      
      // Each function should have a gas cost
      functionNames.forEach(funcName => {
        expect(_result.functionBreakdown[funcName]).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe( 'Optimization Categories', () => {
    it( 'should categorize optimizations correctly', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public storageVar;
            
            function publicFunc() public pure returns (_uint256) {
                return 42;
            }
            
            function loopFunc() external {
                for (_uint256 i = 0; i < 10; i++) {
                    storageVar += i;
                }
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      const categories = new Set(_result.optimizations.map(opt => opt.category));
      
      // Should have different categories of optimizations
      expect(_categories.size).toBeGreaterThan(0);
      
      // Verify category types
      categories.forEach(category => {
        expect( ['storage', 'computation', 'memory', 'call', 'deployment']).toContain(_category);
      });
    });

    it( 'should assign appropriate difficulty levels', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract TestContract {
            uint256 public value;
            
            function publicFunction() public pure returns (_uint256) {
                return 42;
            }
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      result.optimizations.forEach(opt => {
        expect( ['easy', 'medium', 'hard']).toContain(_opt.difficulty);
        expect( ['low', 'medium', 'high']).toContain(_opt.impact);
        
        // Easy optimizations should be auto-fixable
        if (_opt.difficulty === 'easy') {
          expect(_opt.autoFixAvailable).toBe(_true);
        }
      });
    });
  });

  describe( 'Caching', () => {
    it( 'should cache analysis results', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value = 42;
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      // First analysis
      const result1 = await analyzer.analyzeGasUsage(_mockUserId);
      
      // Second analysis with same code should be faster (_cached)
      const startTime = Date.now(_);
      const result2 = await analyzer.analyzeGasUsage(_mockUserId);
      const endTime = Date.now(_);

      expect(_result2).toBeDefined(_);
      expect(_endTime - startTime).toBeLessThan(100); // Should be very fast due to caching
    });

    it( 'should clear cache when requested', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value = 42;
        }
      `;

      mockModel.getValue.mockReturnValue(_testCode);

      await analyzer.analyzeGasUsage(_mockUserId);
      
      // Clear cache
      analyzer.clearCache(_);
      
      // Should work normally after cache clear
      const result = await analyzer.analyzeGasUsage(_mockUserId);
      expect(_result).toBeDefined(_);
    });
  });

  describe( 'Error Handling', () => {
    it( 'should handle invalid code gracefully', async () => {
      const invalidCode = 'invalid solidity code here';
      mockModel.getValue.mockReturnValue(_invalidCode);

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      // Should still return a result, even if minimal
      expect(_result).toBeDefined(_);
      expect(_result.estimates).toBeDefined(_);
      expect(_result.optimizations).toBeDefined(_);
      expect(_result.totalGasCost).toBeGreaterThanOrEqual(0);
    });

    it( 'should handle empty code', async () => {
      mockModel.getValue.mockReturnValue('');

      const result = await analyzer.analyzeGasUsage(_mockUserId);

      expect(_result).toBeDefined(_);
      expect(_result.estimates).toEqual([]);
      expect(_result.optimizations).toEqual([]);
      expect(_result.totalGasCost).toBe(0);
    });
  });
});
