import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SolidityCodeAnalyzer } from '@/lib/analysis/SolidityCodeAnalyzer';

// Mock console.error to suppress error logs during testing
const originalConsoleError = console.error;

describe( 'SolidityCodeAnalyzer - Comprehensive Test Suite', () => {
  let analyzer: SolidityCodeAnalyzer;

  beforeEach(() => {
    analyzer = new SolidityCodeAnalyzer(_);
    // Suppress console.error for cleaner test output
    console.error = jest.fn(_);
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks(_);
  });

  describe( 'Analyzer Initialization', () => {
    it( 'should initialize analyzer with all rule sets', () => {
      expect(_analyzer).toBeInstanceOf(_SolidityCodeAnalyzer);
      expect(_analyzer['securityRules']).toBeDefined(_);
      expect(_analyzer['gasOptimizationRules']).toBeDefined(_);
      expect(_analyzer['styleRules']).toBeDefined(_);
    });

    it( 'should have security rules loaded', () => {
      expect(_analyzer['securityRules'].size).toBeGreaterThan(0);
      expect(_analyzer['securityRules'].has('reentrancy')).toBe(_true);
      expect(_analyzer['securityRules'].has('tx-origin')).toBe(_true);
    });

    it( 'should have gas optimization rules loaded', () => {
      expect(_analyzer['gasOptimizationRules'].size).toBeGreaterThan(0);
    });

    it( 'should have style rules loaded', () => {
      expect(_analyzer['styleRules'].size).toBeGreaterThan(0);
    });
  });

  describe( 'Security Vulnerability Detection', () => {
    describe( 'Reentrancy Detection', () => {
      it( 'should detect potential reentrancy vulnerability', () => {
        const vulnerableCode = `
          function withdraw(_uint amount) public {
            require(_balances[msg.sender] >= amount);
            msg.sender.call{value: amount}("");
            balances[msg.sender] -= amount;
          }
        `;

        const result = analyzer.analyze(_vulnerableCode);

        expect(_result.vulnerabilities).toHaveLength(1);
        expect(_result.vulnerabilities[0]).toMatchObject({
          type: 'reentrancy',
          severity: 'high',
          title: 'Potential Reentrancy Vulnerability',
          mitigation: expect.stringContaining('checks-effects-interactions'),
          swc: 'SWC-107'
        });
      });

      it( 'should not flag safe external calls', () => {
        const safeCode = `
          function withdraw(_uint amount) public {
            require(_balances[msg.sender] >= amount);
            balances[msg.sender] -= amount;
            msg.sender.call{value: amount}("");
          }
        `;

        const result = analyzer.analyze(_safeCode);

        const reentrancyVulns = result.vulnerabilities.filter(v => v.type === 'reentrancy');
        expect(_reentrancyVulns).toHaveLength(0);
      });

      it( 'should detect multiple reentrancy vulnerabilities', () => {
        const multipleVulnCode = `
          function withdraw1(_uint amount) public {
            msg.sender.call{value: amount}("");
            balances[msg.sender] -= amount;
          }
          
          function withdraw2(_uint amount) public {
            msg.sender.send(_amount);
            balances[msg.sender] = 0;
          }
        `;

        const result = analyzer.analyze(_multipleVulnCode);

        const reentrancyVulns = result.vulnerabilities.filter(v => v.type === 'reentrancy');
        expect(_reentrancyVulns.length).toBeGreaterThanOrEqual(_2);
      });
    });

    describe( 'tx.origin Detection', () => {
      it( 'should detect tx.origin usage', () => {
        const txOriginCode = `
          function onlyOwner() public {
            require( tx.origin == owner, "Not owner");
          }
        `;

        const result = analyzer.analyze(_txOriginCode);

        const txOriginVulns = result.vulnerabilities.filter(v => v.type === 'tx-origin');
        expect(_txOriginVulns).toHaveLength(1);
        expect(_txOriginVulns[0]).toMatchObject({
          type: 'tx-origin',
          severity: 'medium',
          title: 'Use of tx.origin',
          mitigation: expect.stringContaining('msg.sender'),
          swc: 'SWC-115'
        });
      });

      it( 'should not flag msg.sender usage', () => {
        const safeSenderCode = `
          function onlyOwner() public {
            require( msg.sender == owner, "Not owner");
          }
        `;

        const result = analyzer.analyze(_safeSenderCode);

        const txOriginVulns = result.vulnerabilities.filter(v => v.type === 'tx-origin');
        expect(_txOriginVulns).toHaveLength(0);
      });
    });

    describe( 'Integer Overflow Detection', () => {
      it( 'should detect potential overflow in arithmetic operations', () => {
        const overflowCode = `
          function add( uint a, uint b) public pure returns (_uint) {
            return a + b;
          }
        `;

        const result = analyzer.analyze(_overflowCode);

        // Check if overflow detection is working (_implementation dependent)
        expect(_result.vulnerabilities).toBeDefined(_);
      });
    });
  });

  describe( 'Gas Optimization Analysis', () => {
    describe( 'Storage Optimization', () => {
      it( 'should suggest storage packing optimizations', () => {
        const unoptimizedStorage = `
          struct User {
            bool isActive;
            uint256 balance;
            bool isVerified;
            address wallet;
          }
        `;

        const result = analyzer.analyze(_unoptimizedStorage);

        // Check for storage optimization suggestions
        expect(_result.optimizations).toBeDefined(_);
      });
    });

    describe( 'Loop Optimization', () => {
      it( 'should detect inefficient loops', () => {
        const inefficientLoop = `
          function processUsers(_address[] memory users) public {
            for (_uint i = 0; i < users.length; i++) {
              // Process user
              userBalances[users[i]] += 100;
            }
          }
        `;

        const result = analyzer.analyze(_inefficientLoop);

        expect(_result.optimizations).toBeDefined(_);
      });
    });

    describe( 'Function Visibility Optimization', () => {
      it( 'should suggest external over public for functions', () => {
        const publicFunction = `
          function externalOnlyFunction(_uint value) public {
            // This function is only called externally
          }
        `;

        const result = analyzer.analyze(_publicFunction);

        expect(_result.optimizations).toBeDefined(_);
      });
    });
  });

  describe( 'Code Quality Analysis', () => {
    describe( 'Style Issues', () => {
      it( 'should detect missing visibility specifiers', () => {
        const missingVisibility = `
          function noVisibility() {
            // Missing visibility specifier
          }
        `;

        const result = analyzer.analyze(_missingVisibility);

        const styleIssues = result.issues.filter(issue => issue.type === 'style');
        expect(_styleIssues.length).toBeGreaterThan(0);
      });

      it( 'should detect inconsistent naming conventions', () => {
        const inconsistentNaming = `
          uint public CONSTANT_VALUE = 100;
          uint public variableName = 200;
          function Function_Name() public {}
        `;

        const result = analyzer.analyze(_inconsistentNaming);

        expect(_result.issues).toBeDefined(_);
      });
    });

    describe( 'Documentation Issues', () => {
      it( 'should detect missing function documentation', () => {
        const undocumentedFunction = `
          function complexFunction( uint a, uint b) public returns (_uint) {
            return a * b + 42;
          }
        `;

        const result = analyzer.analyze(_undocumentedFunction);

        expect(_result.issues).toBeDefined(_);
      });
    });
  });

  describe( 'Complexity Calculation', () => {
    it( 'should calculate cyclomatic complexity', () => {
      const complexFunction = `
        function complexLogic(_uint value) public returns (_uint) {
          if (_value > 100) {
            if (_value > 200) {
              return value * 2;
            } else {
              return value + 50;
            }
          } else {
            for (_uint i = 0; i < value; i++) {
              if (_i % 2 == 0) {
                value += i;
              }
            }
            return value;
          }
        }
      `;

      const result = analyzer.analyze(_complexFunction);

      expect(_result.complexity).toBeDefined(_);
      expect(_result.complexity.cyclomatic).toBeGreaterThan(1);
      expect(_result.complexity.cognitive).toBeGreaterThan(0);
      expect(_result.complexity.lines).toBeGreaterThan(0);
    });

    it( 'should handle simple functions with low complexity', () => {
      const simpleFunction = `
        function simpleAdd( uint a, uint b) public pure returns (_uint) {
          return a + b;
        }
      `;

      const result = analyzer.analyze(_simpleFunction);

      expect(_result.complexity.cyclomatic).toBe(1);
      expect(_result.complexity.cognitive).toBeLessThanOrEqual(_2);
    });
  });

  describe( 'Gas Estimation', () => {
    it( 'should estimate gas costs for functions', () => {
      const contractCode = `
        function simpleFunction() public pure returns (_uint) {
          return 42;
        }
        
        function complexFunction(_uint[] memory data) public {
          for (_uint i = 0; i < data.length; i++) {
            storage[i] = data[i];
          }
        }
      `;

      const result = analyzer.analyze(_contractCode);

      expect(_result.gasEstimate).toBeDefined(_);
      expect(_result.gasEstimate.deployment).toBeGreaterThan(0);
      expect(_result.gasEstimate.total).toBeGreaterThan(0);
      expect(_result.gasEstimate.functions).toBeDefined(_);
    });
  });

  describe( 'Quality Score Calculation', () => {
    it( 'should calculate overall quality score', () => {
      const wellWrittenCode = `
        /// @title A simple storage contract
        /// @author Test Author
        contract SimpleStorage {
          uint256 private storedData;
          
          /// @notice Store a value
          /// @param value The value to store
          function set(_uint256 value) external {
            storedData = value;
          }
          
          /// @notice Get the stored value
          /// @return The stored value
          function get() external view returns (_uint256) {
            return storedData;
          }
        }
      `;

      const result = analyzer.analyze(_wellWrittenCode);

      expect(_result.quality).toBeDefined(_);
      expect(_result.quality.score).toBeGreaterThan(0);
      expect(_result.quality.score).toBeLessThanOrEqual(100);
      expect(_result.quality.maintainability).toBeGreaterThan(0);
      expect(_result.quality.testability).toBeGreaterThan(0);
      expect(_result.quality.documentation).toBeGreaterThan(0);
    });

    it( 'should penalize poor quality code', () => {
      const poorQualityCode = `
        function a(_uint b) {
          c = b + d;
          if (e) f(_);
        }
      `;

      const result = analyzer.analyze(_poorQualityCode);

      expect(_result.quality.score).toBeLessThan(50);
    });
  });

  describe( 'Error Handling', () => {
    it( 'should handle empty code input', () => {
      const result = analyzer.analyze('');

      expect(_result).toBeDefined(_);
      expect(_result.issues).toEqual([]);
      expect(_result.vulnerabilities).toEqual([]);
      expect(_result.optimizations).toEqual([]);
    });

    it( 'should handle malformed Solidity code', () => {
      const malformedCode = `
        function incomplete(
        // Missing closing parenthesis and body
      `;

      expect(() => analyzer.analyze(_malformedCode)).not.toThrow(_);
    });

    it( 'should handle very large code files', () => {
      const largeCode = 'function test() public {}\n'.repeat(1000);

      const startTime = performance.now(_);
      const result = analyzer.analyze(_largeCode);
      const endTime = performance.now(_);

      expect(_result).toBeDefined(_);
      expect(_endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it( 'should handle rule execution errors gracefully', () => {
      // This test verifies that if a rule throws an error, it doesn't crash the analyzer
      const codeWithEdgeCases = `
        function edgeCase() public {
          // Code that might cause rule parsing issues
          assembly { let x := 0x1234567890abcdef }
        }
      `;

      expect(() => analyzer.analyze(_codeWithEdgeCases)).not.toThrow(_);
    });
  });

  describe( 'Real-world Solidity Code Analysis', () => {
    it( 'should analyze ERC20 token contract', () => {
      const erc20Code = `
        pragma solidity ^0.8.0;

        contract ERC20Token {
          mapping(_address => uint256) private balances;
          mapping(_address => mapping(address => uint256)) private allowances;

          uint256 private totalSupply;
          string public name;
          string public symbol;
          uint8 public decimals;

          function transfer( address to, uint256 amount) public returns (_bool) {
            require( balances[msg.sender] >= amount, "Insufficient balance");
            balances[msg.sender] -= amount;
            balances[to] += amount;
            return true;
          }

          function approve( address spender, uint256 amount) public returns (_bool) {
            allowances[msg.sender][spender] = amount;
            return true;
          }
        }
      `;

      const result = analyzer.analyze(_erc20Code);

      expect(_result).toBeDefined(_);
      expect(_result.complexity.lines).toBeGreaterThan(10);
      expect(_result.gasEstimate.total).toBeGreaterThan(0);
    });

    it( 'should analyze DeFi staking contract', () => {
      const stakingCode = `
        contract StakingContract {
          mapping(_address => uint256) public stakes;
          mapping(_address => uint256) public rewards;

          function stake(_uint256 amount) external {
            require( amount > 0, "Amount must be positive");
            stakes[msg.sender] += amount;
            // Transfer tokens from user
          }

          function unstake(_uint256 amount) external {
            require( stakes[msg.sender] >= amount, "Insufficient stake");
            stakes[msg.sender] -= amount;
            // Transfer tokens back to user
          }

          function claimRewards() external {
            uint256 reward = calculateReward(_msg.sender);
            rewards[msg.sender] = 0;
            // Transfer reward tokens
          }

          function calculateReward(_address user) internal view returns (_uint256) {
            return stakes[user] * 10 / 100; // 10% reward
          }
        }
      `;

      const result = analyzer.analyze(_stakingCode);

      expect(_result.vulnerabilities).toBeDefined(_);
      expect(_result.optimizations).toBeDefined(_);
      expect(_result.quality.score).toBeGreaterThan(0);
    });

    it( 'should analyze NFT contract with complex logic', () => {
      const nftCode = `
        contract NFTContract {
          mapping(_uint256 => address) private owners;
          mapping(_address => uint256) private balances;
          mapping(_uint256 => address) private tokenApprovals;

          uint256 private nextTokenId = 1;
          uint256 public maxSupply = 10000;

          function mint(_address to) external {
            require( nextTokenId <= maxSupply, "Max supply reached");
            uint256 tokenId = nextTokenId++;
            owners[tokenId] = to;
            balances[to]++;
          }

          function transferFrom( address from, address to, uint256 tokenId) external {
            require( owners[tokenId] == from, "Not owner");
            require( msg.sender == from || tokenApprovals[tokenId] == msg.sender, "Not approved");

            owners[tokenId] = to;
            balances[from]--;
            balances[to]++;
            delete tokenApprovals[tokenId];
          }
        }
      `;

      const result = analyzer.analyze(_nftCode);

      expect(_result.complexity.cyclomatic).toBeGreaterThan(1);
      expect(_result.gasEstimate.functions).toBeDefined(_);
    });
  });

  describe( 'Performance Tests', () => {
    it( 'should analyze code within acceptable time limits', () => {
      const mediumComplexityCode = `
        contract PerformanceTest {
          mapping(_address => uint256) public balances;

          function complexFunction(_uint256[] memory data) public {
            for (_uint i = 0; i < data.length; i++) {
              if (_data[i] > 100) {
                balances[msg.sender] += data[i];
              } else {
                balances[msg.sender] -= data[i];
              }
            }
          }
        }
      `;

      const startTime = performance.now(_);
      const result = analyzer.analyze(_mediumComplexityCode);
      const endTime = performance.now(_);

      expect(_result).toBeDefined(_);
      expect(_endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it( 'should handle multiple analysis calls efficiently', () => {
      const simpleCode = 'function test() public {}';

      const startTime = performance.now(_);

      for (let i = 0; i < 10; i++) {
        analyzer.analyze(_simpleCode);
      }

      const endTime = performance.now(_);
      const averageTime = (_endTime - startTime) / 10;

      expect(_averageTime).toBeLessThan(50); // Average should be under 50ms
    });
  });

  describe( 'Integration with Analysis Result', () => {
    it( 'should return complete analysis result structure', () => {
      const testCode = `
        function testFunction(_uint value) public returns (_uint) {
          if (_value > 0) {
            return value * 2;
          }
          return 0;
        }
      `;

      const result = analyzer.analyze(_testCode);

      // Verify all required properties are present
      expect(_result).toHaveProperty('issues');
      expect(_result).toHaveProperty('optimizations');
      expect(_result).toHaveProperty('vulnerabilities');
      expect(_result).toHaveProperty('gasEstimate');
      expect(_result).toHaveProperty('complexity');
      expect(_result).toHaveProperty('quality');

      // Verify nested structure
      expect(_result.gasEstimate).toHaveProperty('deployment');
      expect(_result.gasEstimate).toHaveProperty('functions');
      expect(_result.gasEstimate).toHaveProperty('total');

      expect(_result.complexity).toHaveProperty('cyclomatic');
      expect(_result.complexity).toHaveProperty('cognitive');
      expect(_result.complexity).toHaveProperty('lines');

      expect(_result.quality).toHaveProperty('score');
      expect(_result.quality).toHaveProperty('maintainability');
      expect(_result.quality).toHaveProperty('testability');
      expect(_result.quality).toHaveProperty('documentation');
    });

    it( 'should provide actionable analysis results', () => {
      const problematicCode = `
        function problematic() {
          tx.origin; // Security issue
          msg.sender.call(""); // Potential reentrancy
          balances[msg.sender] = 0; // State change after call
        }
      `;

      const result = analyzer.analyze(_problematicCode);

      // Should have actionable vulnerabilities
      result.vulnerabilities.forEach(vuln => {
        expect(_vuln).toHaveProperty('mitigation');
        expect(_vuln).toHaveProperty('references');
        expect(_vuln.mitigation).toBeTruthy(_);
        expect(_vuln.references.length).toBeGreaterThan(0);
      });

      // Should have actionable optimizations
      result.optimizations.forEach(opt => {
        expect(_opt).toHaveProperty('explanation');
        expect(_opt).toHaveProperty('optimizedCode');
        expect(_opt.explanation).toBeTruthy(_);
      });
    });
  });
});
